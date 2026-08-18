"""
stores/views.py  — FINAL VERSION
=================================
Public  → AllowAny  (guest, normal user, wholesale সবাই দেখবে)
Admin   → IsAdminUser only  (dashboard CRUD)
"""
from datetime import datetime
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils.text import slugify

from .models import Store, StoreFeature, StoreAvailability, LeftoverPack, LeftoverPackImage
from .serializers import StoreListSerializer, StoreDetailSerializer, LeftoverPackSerializer
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied


# ── Helper ────────────────────────────────────────────────────────────────────

def _parse_time(val):
    """
    'HH:MM' বা 'HH:MM:SS' string → Python time object
    Model এ TimeField আছে তাই string direct save হয় না।
    """
    if not val:
        return None
    for fmt in ('%H:%M:%S', '%H:%M'):
        try:
            return datetime.strptime(str(val).strip(), fmt).time()
        except ValueError:
            continue
    return None


def _bool(val):
    if isinstance(val, bool):
        return val
    return str(val).lower() in ('true', '1', 'yes')


# ── Public Views ──────────────────────────────────────────────────────────────

class StoreListView(APIView):
    """GET /api/fulfillment/stores/  — active stores, public"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = (
            Store.objects
            .filter(is_active=True)
            .prefetch_related('features', 'availability', 'leftover_packs')
            .order_by('order', 'name')
        )
        feature = request.query_params.get('feature')
        if feature:
            qs = qs.filter(features__feature=feature)
        return Response(StoreListSerializer(qs, many=True, context={'request': request}).data)


class StoreDetailView(APIView):
    """GET /api/fulfillment/stores/slug/<slug>/  — public"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        store = get_object_or_404(
            Store.objects
            .filter(is_active=True)
            .prefetch_related('features', 'availability', 'leftover_packs'),
            slug=slug,
        )
        return Response(StoreDetailSerializer(store, context={'request': request}).data)


class EligibleStoresView(APIView):
    """POST /api/fulfillment/stores/eligible/  — public"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        items = request.data.get('items', [])
        
        # Start with all active stores
        stores = Store.objects.filter(is_active=True).prefetch_related('features', 'availability', 'leftover_packs')
        
        from products.models import Product

        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            if product_id:
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    continue
                
                # Check global stock
                if product.stock < quantity:
                    return Response([]) # Not enough global stock, no store can fulfill
                
                # If product has restricted stores, intersect them
                if product.stores.exists():
                    stores = stores.filter(id__in=product.stores.all())
                
        return Response(StoreListSerializer(stores.distinct(), many=True, context={'request': request}).data)



# ── Admin Views ───────────────────────────────────────────────────────────────

class AdminStoreListCreateView(APIView):
    """
    GET  /api/fulfillment/stores/admin/   — all stores (active + inactive)
    POST /api/fulfillment/stores/admin/   — create store
    """
    permission_classes = [permissions.IsAdminUser]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = (
            Store.objects.all()
            .prefetch_related('features', 'availability', 'leftover_packs')
            .order_by('order', 'name')
        )
        return Response(StoreListSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        data = request.data
        name = (data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'name is required'}, status=400)

        # Unique slug
        base = slugify(name)
        slug = base
        n = 1
        while Store.objects.filter(slug=slug).exists():
            slug = f'{base}-{n}'; n += 1

        store_code = data.get('store_code') or data.get('storeCode') or None
        if store_code and Store.objects.filter(store_code=store_code).exists():
            return Response({'detail': f'Store ID "{store_code}" is already in use.'}, status=400)

        open_t  = _parse_time(data.get('open_time',  '08:00'))
        close_t = _parse_time(data.get('close_time', '21:00'))

        schedules = data.get('schedules', '{}')
        if isinstance(schedules, list): schedules = schedules[0]
        import json
        try:
            parsed_schedules = json.loads(schedules) if isinstance(schedules, str) else schedules
        except Exception:
            parsed_schedules = {}

        store = Store(
            slug         = slug,
            name         = name,
            short_name   = (data.get('short_name') or name)[:80],
            address      = data.get('address', ''),
            city         = data.get('city', ''),
            full_address = data.get('full_address', ''),
            phone        = data.get('phone', ''),
            open_time    = open_t,
            close_time   = close_t,
            schedules    = parsed_schedules,
            store_code   = store_code,
            map_link     = data.get('map_link', ''),
            provenance   = data.get('provenance', ''),
            is_active    = _bool(data.get('is_active', True)),
            order        = int(data.get('order') or 0),
        )
        if 'image' in request.FILES:
            store.image = request.FILES['image']

        store.save()
        return Response(
            StoreListSerializer(store, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminStoreDetailView(APIView):
    """
    GET    /api/fulfillment/stores/<pk>/   — single store (admin)
    PATCH  /api/fulfillment/stores/<pk>/   — partial update
    DELETE /api/fulfillment/stores/<pk>/   — delete
    """
    permission_classes = [permissions.IsAdminUser]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get(self, pk):
        return get_object_or_404(
            Store.objects.prefetch_related('features', 'availability', 'leftover_packs'),
            pk=pk,
        )

    def get(self, request, pk):
        return Response(StoreListSerializer(self._get(pk), context={'request': request}).data)

    def patch(self, request, pk):
        store = self._get(pk)
        data  = dict(request.data)   # works for both FormData and JSON

        # Scalar fields
        for f in ['name', 'short_name', 'address', 'city', 'full_address',
                  'phone', 'map_link', 'provenance', 'store_code']:
            if f in data:
                val = data[f]
                if isinstance(val, list): val = val[0]  # FormData quirk
                setattr(store, f, val)

        # Time fields  (string → time object)
        for tf in ['open_time', 'close_time']:
            if tf in data:
                val = data[tf]
                if isinstance(val, list): val = val[0]
                t = _parse_time(val)
                if t:
                    setattr(store, tf, t)

        if 'is_active' in data:
            val = data['is_active']
            if isinstance(val, list): val = val[0]
            store.is_active = _bool(val)

        if 'order' in data:
            val = data['order']
            if isinstance(val, list): val = val[0]
            store.order = int(val or 0)

        if 'schedules' in data:
            val = data['schedules']
            if isinstance(val, list): val = val[0]
            import json
            try:
                store.schedules = json.loads(val) if isinstance(val, str) else val
            except Exception as e:
                return Response({'detail': f'Schedules parsing error: {str(e)}'}, status=400)

        if store.store_code and Store.objects.filter(store_code=store.store_code).exclude(pk=store.pk).exists():
            return Response({'detail': f'Store ID "{store.store_code}" is already in use.'}, status=400)

        if 'image' in request.FILES:
            store.image = request.FILES['image']

        store.save()
        return Response(StoreListSerializer(store, context={'request': request}).data)

    def delete(self, request, pk):
        self._get(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminStoreFeaturesView(APIView):
    """PUT /api/fulfillment/stores/<pk>/features/"""
    permission_classes = [permissions.IsAdminUser]

    def put(self, request, pk):
        store    = get_object_or_404(Store, pk=pk)
        features = request.data.get('features', [])
        StoreFeature.objects.filter(store=store).delete()
        for f in features:
            StoreFeature.objects.get_or_create(store=store, feature=f)
        return Response({'ok': True, 'features': features})


class AdminStoreAvailabilityView(APIView):
    """PUT /api/fulfillment/stores/<pk>/availability/"""
    permission_classes = [permissions.IsAdminUser]

    def put(self, request, pk):
        store = get_object_or_404(Store, pk=pk)
        items = request.data.get('availability', [])
        StoreAvailability.objects.filter(store=store).delete()
        for i, item in enumerate(items):
            StoreAvailability.objects.create(
                store    = store,
                category = item.get('category', ''),
                icon     = item.get('icon', 'shopping-basket'),
                order    = i,
            )
        return Response({'ok': True, 'availability': items})

class DashboardLeftoverPackViewSet(viewsets.ModelViewSet):
    """
    CRUD for Store Owners to manage Leftover Packs.
    """
    serializer_class = LeftoverPackSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        # Filter by store owner unless superuser
        qs = LeftoverPack.objects.all().prefetch_related('images')
        store_slug = self.request.query_params.get('store_slug')
        if store_slug:
            qs = qs.filter(store__slug=store_slug)

        if self.request.user.is_superuser:
            return qs
        return qs.filter(store__owner=self.request.user)

    def perform_create(self, serializer):
        store_slug = self.request.data.get('store_slug') or self.request.query_params.get('store_slug')
        if not store_slug:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"store_slug": "store_slug is required."})
        
        store = get_object_or_404(Store, slug=store_slug)
        if not self.request.user.is_superuser and store.owner != self.request.user:
            raise PermissionDenied("You do not own this store.")
        
        pack = serializer.save(store=store)
        self._handle_images(pack)

    def perform_update(self, serializer):
        pack = serializer.save()
        self._handle_images(pack)

    def _handle_images(self, pack):
        main_image = self.request.FILES.get('image')
        if main_image:
            pack.image = main_image
            pack.save(update_fields=['image'])
            
        images = self.request.FILES.getlist('gallery_images')
        for image in images:
            LeftoverPackImage.objects.create(pack=pack, image=image)
