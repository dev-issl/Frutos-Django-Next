# products/filters.py
from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Product

class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass

class NumberInFilter(filters.BaseInFilter, filters.NumberFilter):
    pass

class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(method='filter_category')
    subcategory = filters.CharFilter(method='filter_subcategory')
    subcategories = CharInFilter(field_name='sub_category__slug', lookup_expr='in')  # Support multiple subcategories
    brand = filters.CharFilter(field_name='brand__slug')  # Single brand filter
    brands = CharInFilter(field_name='brand__slug', lookup_expr='in')  # Multiple brands filter
    colors = CharInFilter(field_name='colors__name', lookup_expr='in') # Filter by color name
    shipping_categories = NumberInFilter(field_name='shipping_category__id', lookup_expr='in') # Filter by shipping category ID
    search = filters.CharFilter(method='filter_search')  # Custom search filter
    variant = filters.CharFilter(field_name='variant', lookup_expr='iexact')
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    ordering = filters.OrderingFilter(
        fields=(
            ('price', 'price'),
            ('name', 'name'),
            ('created_at', 'created_at'),
        )
    )

    class Meta:
        model = Product
        fields = ['category', 'subcategory', 'subcategories', 'brand', 'brands', 'colors', 'shipping_categories', 'variant', 'search', 'min_price', 'max_price', 'ordering']

    def filter_category(self, queryset, name, value):
        from django.db.models import Q
        if not value:
            return queryset
        return queryset.filter(
            Q(sub_category__category__slug__iexact=value) |
            Q(sub_category__category__name__iexact=value) |
            Q(category__slug__iexact=value) |
            Q(category__name__iexact=value)
        ).distinct()

    def filter_subcategory(self, queryset, name, value):
        from django.db.models import Q
        if not value:
            return queryset
        return queryset.filter(
            Q(sub_category__slug__iexact=value) |
            Q(sub_category__name__iexact=value)
        ).distinct()

    def filter_search(self, queryset, name, value):
        """Custom search filter that searches across multiple fields"""
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(sub_category__name__icontains=value) |
            Q(brand__name__icontains=value) |
            Q(shop__name__icontains=value)
        ).distinct()

    def filter_queryset(self, queryset):
        # Use distinct() to avoid duplicate results when filtering on ManyToMany fields
        return super().filter_queryset(queryset).distinct()
