# orders/shipping_engine.py
"""
ShippingEngine v2
Priority: 1-FreeShippingRule  2-LeftoverPackRule  3-OrderValueRule
          4-CategoryOverride  5-WeightRule        6-ZoneBase+CategoryAdd
          7-ShippingMethod fallback (existing behaviour)
"""
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ShippingEngine:

    def __init__(
        self,
        cart_items: list,
        zone=None,
        shipping_method=None,
        order_value: Decimal = None,
        coupon=None,
    ):
        self.cart_items      = cart_items
        self.zone            = zone
        self.shipping_method = shipping_method
        self.order_value     = order_value or Decimal('0')
        self.coupon          = coupon

    # ── Zone detection ────────────────────────────────────────────────────────

    @staticmethod
    def detect_zone(city: str = '', postcode: str = ''):
        from .models import ShippingZoneCoverage
        try:
            qs = ShippingZoneCoverage.objects.select_related('zone').filter(
                zone__is_active=True
            )
            if city:
                match = qs.filter(city__iexact=city.strip()).first()
                if match:
                    return match.zone
            if postcode:
                match = qs.filter(postcode=postcode.strip()).first()
                if match:
                    return match.zone
        except Exception as exc:
            logger.warning('ShippingEngine.detect_zone error: %s', exc)
        return None

    # ── Cart helpers ──────────────────────────────────────────────────────────

    def _total_weight(self) -> Decimal:
        total = Decimal('0')
        for item in self.cart_items:
            product = item.get('product')
            if product:
                w = getattr(product, 'weight', None) or Decimal('0')
                total += Decimal(str(w)) * item['quantity']
        return total

    def _categories(self) -> list:
        cats = []
        for item in self.cart_items:
            product = item.get('product')
            if product:
                cat = getattr(product, 'category', None)
                if cat and cat not in cats:
                    cats.append(cat)
        return cats

    def _total_qty(self) -> int:
        return sum(item['quantity'] for item in self.cart_items)

    def _all_leftover(self) -> bool:
        return bool(self.cart_items) and all(
            item.get('is_leftover', False) for item in self.cart_items
        )

    def _any_leftover(self) -> bool:
        return any(item.get('is_leftover', False) for item in self.cart_items)

    # ── Rule checkers ─────────────────────────────────────────────────────────

    def _check_free_shipping(self) -> Optional[Decimal]:
        from .models import FreeShippingRule
        rules = FreeShippingRule.objects.filter(active=True).prefetch_related(
            'applicable_categories', 'applicable_products'
        ).order_by('-threshold_amount')
        for rule in rules:
            if self.order_value < rule.threshold_amount:
                continue
            if rule.applicable_categories.count() == 0:
                return Decimal('0')
            for cat in self._categories():
                if rule.applicable_categories.filter(id=cat.id).exists():
                    return Decimal('0')
        return None

    def _check_leftover_rule(self) -> Optional[Decimal]:
        if not self._all_leftover():
            return None
        first = next((i for i in self.cart_items if i.get('is_leftover')), None)
        if not first:
            return None
        lp = first.get('leftover_pack')
        rule = getattr(lp, 'shipping_rule', None) if lp else None
        if rule and rule.is_active:
            std = self._standard_cost()
            return rule.calculate_cost(std, self.zone)
        return None

    def _check_order_value_rule(self) -> Optional[Decimal]:
        from .models import OrderValueShippingRule
        qs = OrderValueShippingRule.objects.filter(is_active=True).order_by('-min_order_value')
        for rule in qs:
            if rule.applies_to(self.order_value, self.zone):
                return Decimal('0') if rule.is_free_shipping else rule.shipping_cost
        return None

    def _check_category_override(self) -> Optional[Decimal]:
        from .models import CategoryShippingRule
        best = None
        for cat in self._categories():
            try:
                rule = CategoryShippingRule.objects.get(
                    category=cat, is_active=True, is_override=True
                )
                cost = rule.override_cost or Decimal('0')
                if best is None or cost > best:
                    best = cost
            except CategoryShippingRule.DoesNotExist:
                continue
        return best

    def _check_weight_rule(self) -> Optional[Decimal]:
        from .models import WeightShippingRule
        weight = self._total_weight()
        if weight <= 0:
            return None
        qs = WeightShippingRule.objects.filter(is_active=True)
        # Zone-specific first
        if self.zone:
            for rule in qs.filter(zone=self.zone).order_by('-priority', 'min_weight'):
                cost = rule.calculate_cost(weight)
                if cost is not None:
                    return cost
        # Global fallback
        for rule in qs.filter(zone__isnull=True).order_by('-priority', 'min_weight'):
            cost = rule.calculate_cost(weight)
            if cost is not None:
                return cost
        return None

    def _zone_base_cost(self) -> Decimal:
        if self.zone:
            return self.zone.base_charge
        return Decimal('0')

    def _category_additional(self) -> Decimal:
        from .models import CategoryShippingRule
        total = Decimal('0')
        for cat in self._categories():
            try:
                rule = CategoryShippingRule.objects.get(
                    category=cat, is_active=True, is_override=False
                )
                total += rule.additional_charge
            except CategoryShippingRule.DoesNotExist:
                continue
        return total

    def _standard_cost(self) -> Decimal:
        if not self.shipping_method:
            return Decimal('0')
        qty    = self._total_qty()
        weight = float(self._total_weight())
        return self.shipping_method.get_price_for_cart(quantity=qty, weight=weight)

    # ── Mixed cart ────────────────────────────────────────────────────────────

    def _calculate_mixed_cart(self) -> dict:
        regular_items  = [i for i in self.cart_items if not i.get('is_leftover')]
        leftover_items = [i for i in self.cart_items if i.get('is_leftover')]

        regular_value = sum(
            i['unit_price'] * i['quantity'] for i in regular_items
        ) if regular_items else Decimal('0')

        regular_engine = ShippingEngine(
            cart_items=regular_items,
            zone=self.zone,
            shipping_method=self.shipping_method,
            order_value=regular_value,
        )
        regular_result = regular_engine.calculate()
        regular_cost   = regular_result['shipping_cost']

        leftover_cost = Decimal('0')
        for item in leftover_items:
            lp   = item.get('leftover_pack')
            rule = getattr(lp, 'shipping_rule', None) if lp else None
            if rule and rule.is_active:
                leftover_cost += rule.calculate_cost(regular_cost, self.zone)
            else:
                leftover_cost += regular_cost

        total = regular_cost + leftover_cost
        return self._result(total, 'mixed_cart', {
            'regular_cost':  float(regular_cost),
            'leftover_cost': float(leftover_cost),
        }, total == Decimal('0'))

    # ── Main ──────────────────────────────────────────────────────────────────

    def calculate(self) -> dict:
        # P1
        free = self._check_free_shipping()
        if free is not None:
            return self._result(Decimal('0'), 'free_shipping_rule', {}, True)

        # P2
        leftover = self._check_leftover_rule()
        if leftover is not None:
            return self._result(leftover, 'leftover_pack_rule', {}, leftover == 0)

        # Mixed cart
        if self._any_leftover():
            return self._calculate_mixed_cart()

        # P3
        val_rule = self._check_order_value_rule()
        if val_rule is not None:
            return self._result(val_rule, 'order_value_rule', {}, val_rule == 0)

        # P4
        cat_override = self._check_category_override()
        if cat_override is not None:
            return self._result(cat_override, 'category_override', {}, False)

        # P5
        weight_cost = self._check_weight_rule()
        if weight_cost is not None:
            cat_add = self._category_additional()
            total   = weight_cost + cat_add
            return self._result(total, 'weight_rule', {
                'weight': float(weight_cost),
                'category_additional': float(cat_add),
            }, False)

        # P6
        zone_cost = self._zone_base_cost()
        cat_add   = self._category_additional()
        if zone_cost > 0 or cat_add > 0:
            total = zone_cost + cat_add
            return self._result(total, 'zone_rule', {
                'zone_base': float(zone_cost),
                'category_additional': float(cat_add),
            }, False)

        # P7 fallback
        std = self._standard_cost()
        return self._result(std, 'shipping_method_fallback', {}, False)

    def apply_coupon_discount(self, shipping_cost: Decimal) -> Decimal:
        if not self.coupon:
            return shipping_cost
        if self.coupon.type != 'SHIPPING_DISCOUNT':
            return shipping_cost
        discounts = self.coupon.calculate_discount(self.order_value, shipping_cost)
        discount  = Decimal(str(discounts.get('shipping_discount', 0)))
        return max(shipping_cost - discount, Decimal('0'))

    def _result(self, cost, rule, breakdown, is_free) -> dict:
        return {
            'shipping_cost': cost,
            'breakdown':     breakdown,
            'rule_applied':  rule,
            'is_free':       is_free,
            'zone':          self.zone.code if self.zone else None,
            'zone_name':     self.zone.name if self.zone else None,
        }