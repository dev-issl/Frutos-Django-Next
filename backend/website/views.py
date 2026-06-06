from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache
from .models import (
    NavbarSettings, OfferCategory, HeroBanner, OfferBanner, 
    HorizontalPromoBanner, BlogPost, FooterSection, FooterLink, 
    SocialMediaLink, SiteSettings
)
from .serializers import (
    NavbarSettingsSerializer, OfferCategorySerializer, HeroBannerSerializer,
    OfferBannerSerializer, HorizontalPromoBannerSerializer, BlogPostSerializer,
    BlogPostListSerializer, FooterSectionSerializer, FooterLinkSerializer,
    SocialMediaLinkSerializer, SiteSettingsSerializer, WebsiteDataSerializer
)

# Cache timeout in seconds (15 minutes)
CACHE_TIMEOUT = 900

class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read access to anyone, write access only to admin users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or getattr(request.user, 'user_type', '') == 'ADMIN')
        )

class BaseWebsiteViewSet(viewsets.ModelViewSet):
    """Base viewset for website content - full CRUD for admins, read-only for public"""
    permission_classes = [IsAdminOrReadOnly]
    
    @method_decorator(cache_page(CACHE_TIMEOUT))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(CACHE_TIMEOUT))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete('site_config_v1')
        cache.clear()

    def perform_update(self, serializer):
        serializer.save()
        cache.delete('site_config_v1')
        cache.clear()

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete('site_config_v1')
        cache.clear()

class NavbarSettingsViewSet(BaseWebsiteViewSet):
    """API for navbar settings and links - full CRUD for admins"""
    serializer_class = NavbarSettingsSerializer
    
    def get_queryset(self):
        qs = NavbarSettings.objects.all().prefetch_related('naverbarsettings_set').order_by('order', 'name')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True, parent__isnull=True)
        return qs

class OfferCategoryViewSet(BaseWebsiteViewSet):
    """API for offer categories - full CRUD for admins"""
    serializer_class = OfferCategorySerializer
    
    def get_queryset(self):
        qs = OfferCategory.objects.all().select_related('category').order_by('order', 'name')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class HeroBannerViewSet(BaseWebsiteViewSet):
    """API for hero banners - full CRUD for admins"""
    serializer_class = HeroBannerSerializer
    
    def get_queryset(self):
        qs = HeroBanner.objects.all().order_by('order', 'created_at')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class OfferBannerViewSet(BaseWebsiteViewSet):
    """API for offer banners"""
    serializer_class = OfferBannerSerializer
    
    def get_queryset(self):
        queryset = OfferBanner.objects.all().order_by('banner_type', 'order', 'created_at')
        
        # For public requests, only show active banners
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            queryset = queryset.filter(is_active=True)
        
        # Filter by banner type if specified
        banner_type = self.request.query_params.get('banner_type')
        if banner_type:
            queryset = queryset.filter(banner_type=banner_type)
        
        return queryset

class HorizontalPromoBannerViewSet(BaseWebsiteViewSet):
    """API for horizontal promotional banners - full CRUD for admins"""
    serializer_class = HorizontalPromoBannerSerializer
    
    def get_queryset(self):
        qs = HorizontalPromoBanner.objects.all().order_by('order', 'created_at')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class BlogPostViewSet(BaseWebsiteViewSet):
    """API for blog posts - full CRUD for admins"""
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        return BlogPostSerializer
    
    def get_queryset(self):
        qs = BlogPost.objects.all().order_by('-is_featured', 'order', '-publish_date')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class FooterSectionViewSet(BaseWebsiteViewSet):
    """API for footer sections with links - full CRUD for admins"""
    serializer_class = FooterSectionSerializer
    
    def get_queryset(self):
        qs = FooterSection.objects.all().prefetch_related('links').order_by('section_type', 'order')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class FooterLinkViewSet(BaseWebsiteViewSet):
    """API for individual footer links - full CRUD for admins"""
    serializer_class = FooterLinkSerializer
    
    def get_queryset(self):
        qs = FooterLink.objects.all().select_related('section').order_by('order', 'text')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class SocialMediaLinkViewSet(BaseWebsiteViewSet):
    """API for social media links - full CRUD for admins"""
    serializer_class = SocialMediaLinkSerializer
    
    def get_queryset(self):
        qs = SocialMediaLink.objects.all().order_by('order', 'platform')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

class SiteSettingsViewSet(BaseWebsiteViewSet):
    """API for site settings - full CRUD for admins"""
    serializer_class = SiteSettingsSerializer
    
    def get_queryset(self):
        qs = SiteSettings.objects.all().order_by('group', 'key')
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

# Consolidated API endpoints
@api_view(['GET'])
@perm_classes([AllowAny])
@cache_page(CACHE_TIMEOUT)
def website_data(request):
    """Get all website data in a single API call"""
    try:
        # Check if data is cached
        cache_key = 'website_data_all'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        # Gather all data with optimized queries
        data = {
            'navbar_links': NavbarSettingsSerializer(
                NavbarSettings.objects.filter(is_active=True, parent__isnull=True).prefetch_related('naverbarsettings_set').order_by('order', 'name'),
                many=True,
                context={'request': request}
            ).data,
            'offer_categories': OfferCategorySerializer(
                OfferCategory.objects.filter(is_active=True).select_related('category').order_by('order', 'name'),
                many=True
            ).data,
            'hero_banners': HeroBannerSerializer(
                HeroBanner.objects.filter(is_active=True).order_by('order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'offer_banners': OfferBannerSerializer(
                OfferBanner.objects.filter(is_active=True).order_by('banner_type', 'order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'horizontal_banners': HorizontalPromoBannerSerializer(
                HorizontalPromoBanner.objects.filter(is_active=True).order_by('order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'blog_posts': BlogPostListSerializer(
                BlogPost.objects.filter(is_active=True).order_by('-is_featured', 'order', '-publish_date')[:8],
                many=True,
                context={'request': request}
            ).data,
            'footer_sections': FooterSectionSerializer(
                FooterSection.objects.filter(is_active=True).prefetch_related('links').order_by('section_type', 'order'),
                many=True,
                context={'request': request}
            ).data,
            'social_links': SocialMediaLinkSerializer(
                SocialMediaLink.objects.filter(is_active=True).order_by('order', 'platform'),
                many=True
            ).data,
            'site_settings': SiteSettingsSerializer(
                SiteSettings.objects.filter(is_active=True).order_by('group', 'key'),
                many=True
            ).data
        }
        
        # Cache the data
        cache.set(cache_key, data, CACHE_TIMEOUT)
        
        return Response(data)
    
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch website data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@perm_classes([AllowAny])
@cache_page(CACHE_TIMEOUT)
def navbar_data(request):
    """Get navbar-specific data"""
    try:
        data = {
            'navbar_links': NavbarSettingsSerializer(
                NavbarSettings.objects.filter(is_active=True, parent__isnull=True).prefetch_related('naverbarsettings_set').order_by('order', 'name'),
                many=True,
                context={'request': request}
            ).data,
            'offer_categories': OfferCategorySerializer(
                OfferCategory.objects.filter(is_active=True).select_related('category').order_by('order', 'name'),
                many=True
            ).data
        }
        return Response(data)
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch navbar data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@perm_classes([AllowAny])
@cache_page(CACHE_TIMEOUT)
def homepage_data(request):
    """Get homepage-specific data"""
    try:
        data = {
            'hero_banners': HeroBannerSerializer(
                HeroBanner.objects.filter(is_active=True).order_by('order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'offer_banners': OfferBannerSerializer(
                OfferBanner.objects.filter(is_active=True).order_by('banner_type', 'order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'horizontal_banners': HorizontalPromoBannerSerializer(
                HorizontalPromoBanner.objects.filter(is_active=True).order_by('order', 'created_at'),
                many=True,
                context={'request': request}
            ).data,
            'blog_posts': BlogPostListSerializer(
                BlogPost.objects.filter(is_active=True).order_by('-is_featured', 'order', '-publish_date')[:4],
                many=True,
                context={'request': request}
            ).data
        }
        return Response(data)
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch homepage data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@perm_classes([AllowAny])
@cache_page(CACHE_TIMEOUT)
def footer_data(request):
    """Get footer-specific data"""
    try:
        data = {
            'footer_sections': FooterSectionSerializer(
                FooterSection.objects.filter(is_active=True).prefetch_related('links').order_by('section_type', 'order'),
                many=True,
                context={'request': request}
            ).data,
            'social_links': SocialMediaLinkSerializer(
                SocialMediaLink.objects.filter(is_active=True).order_by('order', 'platform'),
                many=True
            ).data,
            'site_settings': SiteSettingsSerializer(
                SiteSettings.objects.filter(is_active=True, group__in=['footer', 'company']).order_by('key'),
                many=True
            ).data
        }
        return Response(data)
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch footer data', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@perm_classes([AllowAny])
def clear_website_cache(request):
    """Clear website data cache (for admin use)"""
    try:
        cache_keys = [
            'website_data_all',
            'navbar_data',
            'homepage_data',
            'footer_data',
            'site_config_v1',
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        # Also clear Django's cache_page cache
        cache.clear()
        
        return Response({'message': 'Website cache cleared successfully'})
    except Exception as e:
        return Response(
            {'error': 'Failed to clear cache', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@perm_classes([AllowAny])
def site_config(request):
    """
    Returns a unified site config object expected by the Next.js frontend.
    Shape matches what FooterWrapper / NavbarWrapper / layout.jsx expect:
    {
        brand_name, brand_tagline, navbar_logo_url, footer_logo_url,
        favicon_url, contact_email, contact_phone, contact_address,
        nav_links: [{label, href}],
        social_links: [{url, icon_name, title}],
        store_locations: [{name, slug}],
        footer_sections: [...],   # full sections with links
        site_settings: [...]      # raw key/value list
    }
    """
    try:
        cache_key = 'site_config_v1'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # ── Site settings → dict ─────────────────────────────────────────
        settings_qs = SiteSettings.objects.filter(is_active=True)
        settings_map = {s.key: s.get_typed_value() for s in settings_qs}

        # ── Navbar links ────────────────────────────────────────────────
        navbar_qs = NavbarSettings.objects.filter(is_active=True, parent__isnull=True).order_by('order', 'name')
        nav_links = [
            {'label': n.name, 'href': n.url or '#'}
            for n in navbar_qs
        ]

        # ── Social links ─────────────────────────────────────────────────
        social_qs = SocialMediaLink.objects.filter(is_active=True).order_by('order', 'platform')
        social_links = [
            {
                'url': s.url,
                'icon_name': s.icon_class or s.platform.capitalize(),
                'title': s.platform,
                'platform': s.platform,
            }
            for s in social_qs
        ]

        # ── Footer sections (with nested links) ──────────────────────────
        footer_sections = FooterSectionSerializer(
            FooterSection.objects.filter(is_active=True).prefetch_related('links').order_by('section_type', 'order'),
            many=True,
            context={'request': request}
        ).data

        # ── Build response ───────────────────────────────────────────────
        data = {
            # Core branding (from site settings or defaults)
            'brand_name':      settings_map.get('brand_name', 'El Árbol'),
            'brand_tagline':   settings_map.get('brand_tagline', ''),
            'navbar_logo_url': settings_map.get('navbar_logo_url', '/el-erbol-logo.png'),
            'footer_logo_url': settings_map.get('footer_logo_url', '/el-erbol-logo.png'),
            'favicon_url':     settings_map.get('favicon_url', '/favicon.ico'),

            # Contact
            'contact_email':   settings_map.get('contact_email', ''),
            'contact_phone':   settings_map.get('contact_phone', ''),
            'contact_address': settings_map.get('contact_address', ''),

            # Navigation
            'nav_links': nav_links,

            # Social
            'social_links': social_links,

            # Footer
            'footer_sections': footer_sections,

            # Raw settings for any extra frontend use
            'site_settings': [
                {'key': s.key, 'value': s.get_typed_value(), 'group': s.group}
                for s in settings_qs
            ],

            # Kept for backward compat (Footer component uses these)
            'store_locations': [],
            'payment_methods': [],
        }

        cache.set(cache_key, data, CACHE_TIMEOUT)
        return Response(data)

    except Exception as e:
        return Response(
            {'error': 'Failed to fetch site config', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )