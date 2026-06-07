# orders/shipping_views.py
# Register this file's router in orders/urls.py

from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

from .models import (
    ShippingZone, ShippingZoneCoverage, WeightShippingRule,
    OrderValueShippingRule, CategoryShippingRule, CourierProvider,
    Warehouse, LeftoverPackShippingRule, FreeShippingRule, Coupon,
)
from .shipping_serializers import (
    ShippingZoneSerializer, ShippingZoneWriteSerializer,
    ShippingZoneCoverageSerializer, ShippingZoneCoverageWriteSerializer,
    WeightShippingRuleSerializer, OrderValueShippingRuleSerializer,
    CategoryShippingRuleSerializer, CourierProviderSerializer,
    CourierProviderWriteSerializer, WarehouseSerializer, WarehouseWriteSerializer,
    LeftoverPackShippingRuleSerializer,
    ShippingCalculateRequestSerializer, ZoneDetectRequestSerializer,
    FreeShippingCheckRequestSerializer,
)
from .shipping_engine import ShippingEngine
from users.permissions import ReadOnlyOrIsAdmin


class ShippingPageNumberPagination(PageNumberPagination):
    page_size              = 20
    page_size_query_param  = 'page_size'
    max_page_size          = 100


class IsShippingManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_staff
        role = getattr(request.user, 'role', '') or ''
        return request.user.is_superuser or (
            request.user.is_staff and role in ('admin', 'shipping_manager', 'super_admin')
        )


# ── ShippingZone ──────────────────────────────────────────────────────────────

class ShippingZoneViewSet(viewsets.ModelViewSet):
    queryset         = ShippingZone.objects.prefetch_related('coverages').order_by('priority', 'name')
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [SearchFilter, DjangoFilterBackend]
    search_fields      = ['name', 'code']
    filterset_fields   = ['is_active', 'code']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ShippingZoneWriteSerializer
        return ShippingZoneSerializer

    @action(detail=True, methods=['get', 'post'], url_path='coverage')
    def coverage(self, request, pk=None):
        zone = self.get_object()
        if request.method == 'GET':
            qs = zone.coverages.all()
            return Response(ShippingZoneCoverageSerializer(qs, many=True).data)
        ser = ShippingZoneCoverageWriteSerializer(data={**request.data, 'zone': zone.pk})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='active', permission_classes=[permissions.AllowAny])
    def active_zones(self, request):
        qs = ShippingZone.objects.filter(is_active=True).order_by('priority', 'name')
        return Response(ShippingZoneSerializer(qs, many=True).data)


# ── WeightShippingRule ────────────────────────────────────────────────────────

class WeightShippingRuleViewSet(viewsets.ModelViewSet):
    queryset           = WeightShippingRule.objects.select_related('zone').order_by('zone', 'min_weight')
    serializer_class   = WeightShippingRuleSerializer
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['is_active', 'zone']


# ── OrderValueShippingRule ────────────────────────────────────────────────────

class OrderValueShippingRuleViewSet(viewsets.ModelViewSet):
    queryset           = OrderValueShippingRule.objects.select_related('zone').order_by('min_order_value')
    serializer_class   = OrderValueShippingRuleSerializer
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['is_active', 'zone', 'is_free_shipping']


# ── CategoryShippingRule ──────────────────────────────────────────────────────

class CategoryShippingRuleViewSet(viewsets.ModelViewSet):
    queryset           = CategoryShippingRule.objects.select_related('category').order_by('category__name')
    serializer_class   = CategoryShippingRuleSerializer
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [SearchFilter, DjangoFilterBackend]
    search_fields      = ['category__name', 'notes']
    filterset_fields   = ['is_active', 'is_override']


# ── CourierProvider ───────────────────────────────────────────────────────────

class CourierProviderViewSet(viewsets.ModelViewSet):
    queryset           = CourierProvider.objects.prefetch_related('supported_zones').order_by('name')
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [SearchFilter, DjangoFilterBackend]
    search_fields      = ['name', 'slug']
    filterset_fields   = ['is_active']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CourierProviderWriteSerializer
        return CourierProviderSerializer


# ── Warehouse ─────────────────────────────────────────────────────────────────

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset           = Warehouse.objects.select_related('zone').prefetch_related('zone_mappings__zone').order_by('priority', 'name')
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [SearchFilter, DjangoFilterBackend]
    search_fields      = ['name', 'code', 'city']
    filterset_fields   = ['is_active', 'zone']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return WarehouseWriteSerializer
        return WarehouseSerializer


# ── LeftoverPackShippingRule ──────────────────────────────────────────────────

class LeftoverPackShippingRuleViewSet(viewsets.ModelViewSet):
    queryset           = LeftoverPackShippingRule.objects.select_related('zone').order_by('-created_at')
    serializer_class   = LeftoverPackShippingRuleSerializer
    permission_classes = [IsShippingManagerOrAdmin]
    pagination_class   = ShippingPageNumberPagination
    filter_backends    = [SearchFilter, DjangoFilterBackend]
    search_fields      = ['name']
    filterset_fields   = ['is_active', 'rule_type', 'zone']


# ── Shipping Calculator API ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def calculate_shipping_v2(request):
    ser = ShippingCalculateRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data

    from products.models import Product

    cart_items = []
    for ci in data['cart_items']:
        try:
            product = Product.objects.select_related('category').get(id=ci['product_id'])
        except Product.DoesNotExist:
            continue
        cart_items.append({
            'product':     product,
            'quantity':    ci['quantity'],
            'unit_price':  product.discount_price or product.price,
            'is_leftover': ci.get('is_leftover', False),
        })

    city     = data.get('city', '')
    postcode = data.get('postcode', '')
    zone     = ShippingEngine.detect_zone(city=city, postcode=postcode)

    order_value = data.get('order_value')
    if order_value is None:
        order_value = sum(
            i['unit_price'] * i['quantity'] for i in cart_items
        )

    coupon = None
    coupon_code = data.get('coupon_code', '').strip()
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code, active=True)
        except Coupon.DoesNotExist:
            pass

    engine = ShippingEngine(
        cart_items=cart_items,
        zone=zone,
        order_value=order_value,
        coupon=coupon,
    )
    result = engine.calculate()

    if coupon:
        result['shipping_cost'] = engine.apply_coupon_discount(result['shipping_cost'])
        result['is_free'] = result['shipping_cost'] == Decimal('0')

    # Available couriers for this zone
    if zone:
        couriers_qs = CourierProvider.objects.filter(
            is_active=True, supported_zones=zone,
        ).order_by('name')
    else:
        couriers_qs = CourierProvider.objects.filter(is_active=True).order_by('name')

    from .shipping_serializers import CourierProviderSerializer as CPS
    return Response({
        'shipping_cost':      result['shipping_cost'],
        'is_free':            result['is_free'],
        'rule_applied':       result['rule_applied'],
        'zone':               result['zone'],
        'zone_name':          result['zone_name'],
        'breakdown':          result['breakdown'],
        'available_couriers': CPS(couriers_qs, many=True).data,
        'delivery_sla':       zone.delivery_sla if zone else None,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def detect_zone_api(request):
    ser = ZoneDetectRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data
    zone = ShippingEngine.detect_zone(
        city=data.get('city', ''),
        postcode=data.get('postcode', ''),
    )
    if not zone:
        return Response({'zone': None, 'zone_name': None, 'base_charge': None, 'delivery_sla': None})
    return Response({
        'zone':         zone.code,
        'zone_name':    zone.name,
        'base_charge':  str(zone.base_charge),
        'delivery_sla': zone.delivery_sla,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def free_shipping_check(request):
    ser = FreeShippingCheckRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data

    zone = ShippingEngine.detect_zone(
        city=data.get('city', ''),
        postcode=data.get('postcode', ''),
    )
    engine = ShippingEngine(cart_items=[], zone=zone, order_value=data['order_value'])
    free = engine._check_free_shipping()

    active_rules = FreeShippingRule.objects.filter(active=True).order_by('-threshold_amount')
    next_threshold = None
    for rule in active_rules:
        if data['order_value'] < rule.threshold_amount:
            next_threshold = str(rule.threshold_amount)
            break

    return Response({
        'is_free':        free is not None,
        'next_threshold': next_threshold,
    })