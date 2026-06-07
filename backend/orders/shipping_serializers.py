# orders/shipping_serializers.py
# Add this import block at top of orders/serializers.py, or keep as separate file
# and import from orders.shipping_serializers where needed.

from rest_framework import serializers
from .models import (
    ShippingZone, ShippingZoneCoverage, WeightShippingRule,
    OrderValueShippingRule, CategoryShippingRule, CourierProvider,
    Warehouse, WarehouseZoneMapping, LeftoverPackShippingRule,
)


class ShippingZoneCoverageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingZoneCoverage
        fields = ['id', 'city', 'postcode', 'district']


class ShippingZoneSerializer(serializers.ModelSerializer):
    coverages = ShippingZoneCoverageSerializer(many=True, read_only=True)

    class Meta:
        model  = ShippingZone
        fields = [
            'id', 'name', 'code', 'base_charge', 'delivery_sla',
            'is_active', 'priority', 'coverages', 'created_at',
        ]
        read_only_fields = ['created_at']


class ShippingZoneWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingZone
        fields = ['name', 'code', 'base_charge', 'delivery_sla', 'is_active', 'priority']


class ShippingZoneCoverageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingZoneCoverage
        fields = ['id', 'zone', 'city', 'postcode', 'district']


class WeightShippingRuleSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True, allow_null=True)

    class Meta:
        model  = WeightShippingRule
        fields = [
            'id', 'name', 'min_weight', 'max_weight', 'base_cost',
            'per_kg_cost', 'zone', 'zone_name', 'is_active', 'priority',
        ]


class OrderValueShippingRuleSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True, allow_null=True)

    class Meta:
        model  = OrderValueShippingRule
        fields = [
            'id', 'name', 'min_order_value', 'max_order_value',
            'shipping_cost', 'is_free_shipping', 'zone', 'zone_name', 'is_active',
        ]


class CategoryShippingRuleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = CategoryShippingRule
        fields = [
            'id', 'category', 'category_name', 'additional_charge',
            'is_override', 'override_cost', 'is_active', 'notes',
        ]


class CourierProviderSerializer(serializers.ModelSerializer):
    supported_zones = ShippingZoneSerializer(many=True, read_only=True)

    class Meta:
        model  = CourierProvider
        fields = [
            'id', 'name', 'slug', 'tracking_url', 'webhook_url',
            'base_url', 'is_active', 'supported_zones', 'created_at',
        ]
        read_only_fields = ['created_at']


class CourierProviderWriteSerializer(serializers.ModelSerializer):
    supported_zones = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ShippingZone.objects.all(), required=False,
    )

    class Meta:
        model  = CourierProvider
        fields = [
            'name', 'slug', 'api_key', 'api_secret',
            'tracking_url', 'webhook_url', 'base_url',
            'is_active', 'supported_zones',
        ]
        extra_kwargs = {
            'api_key':    {'write_only': True},
            'api_secret': {'write_only': True},
        }

    def create(self, validated_data):
        zones = validated_data.pop('supported_zones', [])
        obj   = CourierProvider.objects.create(**validated_data)
        obj.supported_zones.set(zones)
        return obj

    def update(self, instance, validated_data):
        zones = validated_data.pop('supported_zones', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if zones is not None:
            instance.supported_zones.set(zones)
        return instance


class WarehouseZoneMappingSerializer(serializers.ModelSerializer):
    zone_code = serializers.CharField(source='zone.code', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model  = WarehouseZoneMapping
        fields = ['id', 'zone', 'zone_code', 'zone_name']


class WarehouseSerializer(serializers.ModelSerializer):
    zone_name     = serializers.CharField(source='zone.name', read_only=True, allow_null=True)
    zone_mappings = WarehouseZoneMappingSerializer(many=True, read_only=True)

    class Meta:
        model  = Warehouse
        fields = [
            'id', 'name', 'code', 'address', 'city', 'postcode',
            'zone', 'zone_name', 'delivery_radius_km', 'priority',
            'is_active', 'contact_phone', 'contact_email', 'zone_mappings',
        ]


class WarehouseWriteSerializer(serializers.ModelSerializer):
    serviced_zone_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ShippingZone.objects.all(),
        required=False, write_only=True,
    )

    class Meta:
        model  = Warehouse
        fields = [
            'name', 'code', 'address', 'city', 'postcode',
            'zone', 'delivery_radius_km', 'priority',
            'is_active', 'contact_phone', 'contact_email', 'serviced_zone_ids',
        ]

    def _save_zone_mappings(self, instance, zones):
        WarehouseZoneMapping.objects.filter(warehouse=instance).delete()
        for zone in zones:
            WarehouseZoneMapping.objects.create(warehouse=instance, zone=zone)

    def create(self, validated_data):
        zones = validated_data.pop('serviced_zone_ids', [])
        obj   = Warehouse.objects.create(**validated_data)
        self._save_zone_mappings(obj, zones)
        return obj

    def update(self, instance, validated_data):
        zones = validated_data.pop('serviced_zone_ids', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if zones is not None:
            self._save_zone_mappings(instance, zones)
        return instance


class LeftoverPackShippingRuleSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True, allow_null=True)

    class Meta:
        model  = LeftoverPackShippingRule
        fields = [
            'id', 'name', 'rule_type', 'fixed_cost', 'reduction_percent',
            'zone', 'zone_name', 'zone_cost', 'is_active', 'created_at',
        ]
        read_only_fields = ['created_at']


# ── Shipping Calculator Serializers ───────────────────────────────────────────

class CartItemForShippingSerializer(serializers.Serializer):
    product_id   = serializers.UUIDField()
    quantity     = serializers.IntegerField(min_value=1)
    is_leftover  = serializers.BooleanField(default=False, required=False)


class ShippingCalculateRequestSerializer(serializers.Serializer):
    cart_items   = CartItemForShippingSerializer(many=True)
    city         = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    postcode     = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    order_value  = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    coupon_code  = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')


class ShippingCalculateResponseSerializer(serializers.Serializer):
    shipping_cost       = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_free             = serializers.BooleanField()
    rule_applied        = serializers.CharField()
    zone                = serializers.CharField(allow_null=True)
    zone_name           = serializers.CharField(allow_null=True)
    breakdown           = serializers.DictField()
    available_couriers  = CourierProviderSerializer(many=True)
    delivery_sla        = serializers.CharField(allow_null=True)


class ZoneDetectRequestSerializer(serializers.Serializer):
    city     = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    postcode = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')


class FreeShippingCheckRequestSerializer(serializers.Serializer):
    order_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    city        = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    postcode    = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')