from rest_framework import serializers
from .models import (
    NavbarSettings, OfferCategory, HeroBanner, OfferBanner, 
    HorizontalPromoBanner, BlogPost, FooterSection, FooterLink, 
    SocialMediaLink, SiteSettings
)

class NavbarSettingsSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = NavbarSettings
        fields = [
            'id', 'name', 'link_type', 'url', 'icon_class', 'order', 
            'show_in_mobile', 'show_in_desktop', 'is_active', 'children'
        ]
    
    def get_children(self, obj):
        if obj.link_type == 'dropdown':
            children = NavbarSettings.objects.filter(parent=obj, is_active=True)
            return NavbarSettingsSerializer(children, many=True).data
        return []

class OfferCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    
    class Meta:
        model = OfferCategory
        fields = [
            'id', 'name', 'title', 'category', 'category_name', 'slug', 'description', 'link', 'order', 
            'is_featured', 'badge_text', 'badge_color', 'icon_class', 'is_active'
        ]

class HeroBannerSerializer(serializers.ModelSerializer):
    image_url_final = serializers.SerializerMethodField()
    
    class Meta:
        model = HeroBanner
        fields = [
            'id', 'title', 'subtitle', 'description', 'button_text', 'button_url',
            'order', 'autoplay_duration', 'is_active', 'image_url_final'
        ]
    
    def get_image_url_final(self, obj):
        """Return the final image URL - either uploaded image or external URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

class OfferBannerSerializer(serializers.ModelSerializer):
    image_url_final = serializers.SerializerMethodField()
    
    class Meta:
        model = OfferBanner
        fields = [
            'id', 'title', 'subtitle', 'description', 'banner_type', 'alt_text',
            'image', 'image_url', 'discount_text', 'coupon_code', 'button_text', 'button_url',
            'gradient_colors', 'order', 'show_on_mobile', 'show_on_desktop',
            'is_active', 'image_url_final', 'meta_title', 'meta_description',
            'created_at', 'updated_at'
        ]
    
    def get_image_url_final(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

class HorizontalPromoBannerSerializer(serializers.ModelSerializer):
    image_url_final = serializers.SerializerMethodField()
    
    class Meta:
        model = HorizontalPromoBanner
        fields = [
            'id', 'title', 'subtitle', 'button_text', 'button_url',
            'overlay_colors', 'order', 'is_active', 'image_url_final'
        ]
    
    def get_image_url_final(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

class BlogPostSerializer(serializers.ModelSerializer):
    image_url_final = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'description', 'content', 'slug', 'publish_date',
            'is_featured', 'order', 'is_active', 'image_url_final'
        ]
    
    def get_image_url_final(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return obj.featured_image_url

class BlogPostListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    image_url_final = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'description', 'slug', 'publish_date',
            'is_featured', 'image_url_final'
        ]
    
    def get_image_url_final(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return obj.featured_image_url

class FooterLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterLink
        fields = [
            'id', 'section', 'text', 'url', 'icon_class', 'order', 'open_in_new_tab', 'is_active'
        ]

class FooterSectionSerializer(serializers.ModelSerializer):
    links = FooterLinkSerializer(many=True, read_only=True)
    
    class Meta:
        model = FooterSection
        fields = [
            'id', 'section_type', 'title', 'order', 'is_active', 'links'
        ]

class SocialMediaLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaLink
        fields = ['id', 'platform', 'url', 'icon_class', 'order', 'is_active']

class SiteSettingsSerializer(serializers.ModelSerializer):
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteSettings
        fields = [
            'id', 'key', 'value', 'typed_value', 'setting_type', 
            'description', 'group', 'is_active'
        ]
    
    def get_typed_value(self, obj):
        return obj.get_typed_value()

# Grouped serializers for frontend
class WebsiteDataSerializer(serializers.Serializer):
    """Combined serializer for all website data"""
    navbar_links = NavbarSettingsSerializer(many=True, read_only=True)
    offer_categories = OfferCategorySerializer(many=True, read_only=True)
    hero_banners = HeroBannerSerializer(many=True, read_only=True)
    offer_banners = OfferBannerSerializer(many=True, read_only=True)
    horizontal_banners = HorizontalPromoBannerSerializer(many=True, read_only=True)
    blog_posts = BlogPostListSerializer(many=True, read_only=True)
    footer_sections = FooterSectionSerializer(many=True, read_only=True)
    social_links = SocialMediaLinkSerializer(many=True, read_only=True)
    site_settings = SiteSettingsSerializer(many=True, read_only=True)


from .models import HomePageContent

class HomePageContentSerializer(serializers.ModelSerializer):
    hero_image_desktop_url = serializers.SerializerMethodField()
    hero_image_mobile_url = serializers.SerializerMethodField()
    leftover_banner_image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomePageContent
        fields = [
            'id', 'hero_section', 'how_it_works', 'steps', 'leftover_banner',
            'hero_image_desktop', 'hero_image_mobile', 'leftover_banner_image',
            'hero_image_desktop_url', 'hero_image_mobile_url', 'leftover_banner_image_url'
        ]
        
    def _get_absolute_url(self, file_field):
        if file_field:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(file_field.url)
            return file_field.url
        return ''
        
    def get_hero_image_desktop_url(self, obj):
        return self._get_absolute_url(obj.hero_image_desktop)

    def get_hero_image_mobile_url(self, obj):
        return self._get_absolute_url(obj.hero_image_mobile)

    def get_leftover_banner_image_url(self, obj):
        return self._get_absolute_url(obj.leftover_banner_image)


from .models import AboutPageContent

class AboutPageContentSerializer(serializers.ModelSerializer):
    hero_image_url_final = serializers.SerializerMethodField()

    class Meta:
        model = AboutPageContent
        fields = ['id', 'hero_section', 'hero_image', 'hero_image_url_final', 'stats', 'values', 'milestones', 'farm_partners', 'team']
        
    def get_hero_image_url_final(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        
        # Fallback to JSON image_url if provided
        hero_section = obj.hero_section or {}
        return hero_section.get('image_url', '')
