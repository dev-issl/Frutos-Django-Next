from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NavbarSettingsViewSet, OfferCategoryViewSet, HeroBannerViewSet,
    OfferBannerViewSet, HorizontalPromoBannerViewSet, BlogPostViewSet,
    FooterSectionViewSet, FooterLinkViewSet, SocialMediaLinkViewSet, SiteSettingsViewSet,
    website_data, navbar_data, homepage_data, footer_data, clear_website_cache,
    site_config, AboutPageContentViewSet, HomePageContentViewSet
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'navbar-settings', NavbarSettingsViewSet, basename='navbar-settings')
router.register(r'offer-categories', OfferCategoryViewSet, basename='offer-categories')
router.register(r'hero-banners', HeroBannerViewSet, basename='hero-banners')
router.register(r'offer-banners', OfferBannerViewSet, basename='offer-banners')
router.register(r'horizontal-banners', HorizontalPromoBannerViewSet, basename='horizontal-banners')
router.register(r'blog-posts', BlogPostViewSet, basename='blog-posts')
router.register(r'footer-sections', FooterSectionViewSet, basename='footer-sections')
router.register(r'footer-links', FooterLinkViewSet, basename='footer-links')
router.register(r'social-links', SocialMediaLinkViewSet, basename='social-links')
router.register(r'site-settings', SiteSettingsViewSet, basename='site-settings')
router.register(r'about-page', AboutPageContentViewSet, basename='about-page')
router.register(r'home-page', HomePageContentViewSet, basename='home-page')

app_name = 'website'

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),

    # Consolidated endpoints
    path('data/all/', website_data, name='website-data-all'),
    path('data/navbar/', navbar_data, name='navbar-data'),
    path('data/homepage/', homepage_data, name='homepage-data'),
    path('data/footer/', footer_data, name='footer-data'),

    # ── NEW: unified site-config for Next.js layout ──────────────────────
    path('site-config/', site_config, name='site-config'),

    # Cache management
    path('cache/clear/', clear_website_cache, name='clear-cache'),
]