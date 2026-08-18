"""
stores/serializers.py

Output shape matches the frontend components exactly.
Changes:
  - image / leftoverPack.image → absolute URLs via request context
  - availability → list of {category, icon} dicts instead of flat strings
  - hours is auto-calculated by the model; no change needed here
"""
from rest_framework import serializers
from .models import Store, StoreFeature, StoreAvailability, LeftoverPack, LeftoverPackImage

class LeftoverPackImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = LeftoverPackImage
        fields = ['id', 'image', 'order']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return ''

class LeftoverPackSerializer(serializers.ModelSerializer):
    price = serializers.FloatField()
    original_price = serializers.FloatField(required=False, allow_null=True)
    shipping_charge = serializers.FloatField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    image = serializers.SerializerMethodField()
    gallery = LeftoverPackImageSerializer(source='images', many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    store_slug = serializers.CharField(source='store.slug', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model  = LeftoverPack
        fields = [
            'id', 'name', 'description', 'original_price', 'price', 
            'shipping_charge', 'shipping_category', 'weight',
            'package_type', 'weight_quantity', 'store_slug', 'store_name',
            'stock', 'estimated_delivery', 'image', 'gallery', 
            'discount_percentage', 'is_active', 'created_at', 'updated_at'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return ''
class StoreListSerializer(serializers.ModelSerializer):
    """
    Lightweight shape for the store finder list + map.
    """
    features      = serializers.SerializerMethodField()
    availability  = serializers.SerializerMethodField()
    leftoverPacks = serializers.SerializerMethodField()
    image         = serializers.SerializerMethodField()
    shortName     = serializers.CharField(source='short_name')
    fullAddress   = serializers.CharField(source='full_address')

    # TimeField serialises as "HH:MM:SS"; the frontend isStoreOpen() handles this fine
    openTime      = serializers.TimeField(source='open_time',  format='%H:%M')
    closeTime     = serializers.TimeField(source='close_time', format='%H:%M')

    mapLink       = serializers.CharField(source='map_link', allow_blank=True)
    storeCode     = serializers.CharField(source='store_code', allow_blank=True, allow_null=True, required=False)

    class Meta:
        model  = Store
        fields = [
            'id', 'slug', 'name', 'shortName',
            'address', 'city', 'fullAddress', 'phone', 'storeCode',
            'openTime', 'closeTime', 'hours', 'schedules',
            'mapLink', 'lat', 'lng',
            'features', 'availability', 'provenance',
            'image', 'leftoverPacks', 'is_active',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return ''

    def get_features(self, obj):
        return list(obj.features.values_list('feature', flat=True))

    def get_availability(self, obj):
        """Return [{category, icon}, …] so the frontend can render Lucide icons."""
        return [
            {'category': a.category, 'icon': a.icon or 'shopping-basket'}
            for a in obj.availability.all()
        ]

    def get_leftoverPacks(self, obj):
        active_packs = obj.leftover_packs.filter(is_active=True)
        return LeftoverPackSerializer(active_packs, many=True, context=self.context).data

    def to_internal_value(self, data):
        import json
        if 'schedules' in data and isinstance(data['schedules'], str):
            try:
                # QueryDict is immutable, copy it
                _data = data.copy()
                _data['schedules'] = json.loads(data['schedules'])
                return super().to_internal_value(_data)
            except Exception:
                pass
        return super().to_internal_value(data)


class StoreDetailSerializer(StoreListSerializer):
    """
    Full detail shape for /stores/<slug>/.
    Identical to list shape — all data is already included.
    """
    class Meta(StoreListSerializer.Meta):
        pass