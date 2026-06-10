from django.db import models
from django.core.validators import URLValidator
import uuid
from utils.image_optimizer import ImageOptimizer

class BaseModel(models.Model):
    """Base model with common fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Ensure UUID is generated before saving"""
        if not self.id:
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)

class NavbarSettings(BaseModel):
    """Navbar configuration and links"""
    LINK_TYPES = [
        ('internal', 'Internal Link'),
        ('external', 'External Link'),
        ('dropdown', 'Dropdown Menu'),
    ]
    
    name = models.CharField(max_length=100, db_index=True)
    link_type = models.CharField(max_length=20, choices=LINK_TYPES, default='internal', db_index=True)
    url = models.CharField(max_length=500, blank=True, null=True)
    icon_class = models.CharField(max_length=100, blank=True, null=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, db_index=True)
    show_in_mobile = models.BooleanField(default=True)
    show_in_desktop = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Navbar Link"
        verbose_name_plural = "Navbar Links"
        indexes = [
            models.Index(fields=['is_active', 'order'], name='navbar_active_order_idx'),
            models.Index(fields=['parent', 'is_active'], name='navbar_parent_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"

class OfferCategory(BaseModel):
    """Offer categories for navbar dropdown"""
    name = models.CharField(max_length=100, help_text="Internal category name (e.g., 'flash-sale', 'clearance')", db_index=True)
    title = models.CharField(max_length=150, help_text="Display title shown in dropdown (e.g., 'Flash Sale', 'Clearance Items')", db_index=True)
    category = models.ForeignKey('products.Category', on_delete=models.SET_NULL, blank=True, null=True, related_name='special_offers', help_text="Select a product category for this offer", db_index=True)
    slug = models.SlugField(unique=True, blank=True, null=True, db_index=True)
    description = models.TextField(blank=True, null=True, help_text="Detailed description of the offer")
    link = models.CharField(max_length=500, help_text="URL/Link for this offer category - redirects when clicked (e.g., 'https://example.com' or '/products')")
    order = models.PositiveIntegerField(default=0, db_index=True)
    
    # Additional fields for better offer management
    is_featured = models.BooleanField(default=False, help_text="Show as featured offer", db_index=True)
    badge_text = models.CharField(max_length=50, blank=True, null=True, help_text="Badge text like 'HOT', 'NEW', 'SALE' - shown next to title")
    badge_color = models.CharField(max_length=50, default='red', help_text="Badge color (e.g., 'red', 'blue', 'green', 'orange')")
    icon_class = models.CharField(max_length=100, blank=True, null=True, help_text="CSS icon class (optional)")
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Special Offer"
        verbose_name_plural = "Special Offers"
        indexes = [
            models.Index(fields=['is_active', 'is_featured', 'order'], name='offer_act_feat_ord_idx'),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.name})"
    
    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided"""
        if not self.slug and self.name:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            # Ensure unique slug
            while OfferCategory.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        super().save(*args, **kwargs)

class HeroBanner(BaseModel):
    """Hero section banners"""
    title = models.CharField(max_length=200, blank=True, null=True)
    subtitle = models.CharField(max_length=300, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Single image field
    image = models.ImageField(upload_to='banners/hero/', blank=True, null=True)
    
    # External image URL (alternative to uploaded image)
    image_url = models.URLField(blank=True, null=True)
    
    # Button settings
    button_text = models.CharField(max_length=50, blank=True, null=True)
    button_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Display settings
    order = models.PositiveIntegerField(default=0)
    autoplay_duration = models.PositiveIntegerField(default=3000, help_text="Duration in milliseconds")
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Hero Banner"
        verbose_name_plural = "Hero Banners"
    
    def __str__(self):
        return f"Banner {self.order}: {self.title or 'Untitled'}"
    
    def save(self, *args, **kwargs):
        # Optimize hero banner image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_banner_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing hero banner image: {e}")
        super().save(*args, **kwargs)

class OfferBanner(BaseModel):
    """Promotional offer banners"""
    BANNER_TYPES = [
        ('main', 'Main Banner'),
        ('vertical', 'Vertical Banner'),
        ('horizontal', 'Horizontal Banner'),
    ]
    
    title = models.CharField(max_length=200, blank=True, null=True)
    subtitle = models.CharField(max_length=300, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPES, default='main')
    
    # Image settings
    image = models.ImageField(upload_to='banners/offers/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=200, blank=True, null=True, help_text="SEO alt text for the banner image")
    
    # Offer details
    discount_text = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., 'UP TO 40% OFF'")
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    button_text = models.CharField(max_length=50, default="Shop Now", blank=True, null=True)
    button_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Styling
    gradient_colors = models.CharField(
        max_length=100, 
        default="from-amber-500 to-orange-600",
        help_text="Tailwind gradient classes"
    )
    
    # Display settings
    order = models.PositiveIntegerField(default=0)
    show_on_mobile = models.BooleanField(default=True)
    show_on_desktop = models.BooleanField(default=True)
    
    # SEO fields
    meta_title = models.CharField(max_length=60, blank=True, null=True, help_text="SEO meta title")
    meta_description = models.CharField(max_length=160, blank=True, null=True, help_text="SEO meta description")
    
    class Meta:
        ordering = ['banner_type', 'order', 'created_at']
        verbose_name = "Offer Banner"
        verbose_name_plural = "Offer Banners"
        indexes = [
            models.Index(fields=['banner_type', 'is_active']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.get_banner_type_display()}: {self.title or 'Untitled'}"
    
    def save(self, *args, **kwargs):
        """Auto-generate meta fields and optimize image if not provided"""
        # Optimize banner image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_banner_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing offer banner image: {e}")
        
        # Auto-generate meta fields
        if not self.meta_title and self.title:
            self.meta_title = self.title[:60]
        if not self.meta_description and self.description:
            self.meta_description = self.description[:160]
        if not self.alt_text and self.title:
            self.alt_text = f"{self.title} - {self.discount_text or 'Special Offer'}"
        super().save(*args, **kwargs)

class HorizontalPromoBanner(BaseModel):
    """Horizontal promotional banners"""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True, null=True)
    
    # Image settings
    image = models.ImageField(upload_to='banners/horizontal/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    
    # Button settings
    button_text = models.CharField(max_length=50, default="Shop Now")
    button_url = models.CharField(max_length=500)
    
    # Styling
    overlay_colors = models.CharField(
        max_length=100,
        default="from-purple-900/70 via-blue-900/50 to-transparent",
        help_text="Tailwind gradient classes for overlay"
    )
    
    # Display settings
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Horizontal Promo Banner"
        verbose_name_plural = "Horizontal Promo Banners"
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Optimize horizontal promo banner image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_banner_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing horizontal promo banner image: {e}")
        super().save(*args, **kwargs)

class BlogPost(BaseModel):
    """Blog posts for blog section"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    content = models.TextField(blank=True, null=True)
    
    # Image settings
    featured_image = models.ImageField(upload_to='blog/', blank=True, null=True)
    featured_image_url = models.URLField(blank=True, null=True)
    
    # SEO and routing
    slug = models.SlugField(unique=True)
    
    # Publication settings
    publish_date = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-is_featured', 'order', '-publish_date']
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from title if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.title)
            unique_slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while BlogPost.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
        
        # Optimize blog featured image before saving
        if self.featured_image and hasattr(self.featured_image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_banner_image(self.featured_image.file)
                if optimized:
                    self.featured_image.file = optimized
            except Exception as e:
                print(f"Error optimizing blog featured image: {e}")
        super().save(*args, **kwargs)

class FooterSection(BaseModel):
    """Footer sections and links"""
    SECTION_TYPES = [
        ('company_info', 'Company Information'),
        ('services', 'Services'),
        ('platforms', 'Platforms'),
        ('company', 'Company'),
        ('legal', 'Legal'),
        ('social', 'Social Media'),
    ]
    
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    title = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['section_type', 'order']
        verbose_name = "Footer Section"
        verbose_name_plural = "Footer Sections"
    
    def __str__(self):
        return f"{self.get_section_type_display()}: {self.title}"

class FooterLink(BaseModel):
    """Individual footer links"""
    section = models.ForeignKey(FooterSection, on_delete=models.CASCADE, related_name='links')
    text = models.CharField(max_length=100)
    url = models.CharField(max_length=500)
    icon_class = models.CharField(max_length=100, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    open_in_new_tab = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['order', 'text']
        verbose_name = "Footer Link"
        verbose_name_plural = "Footer Links"
    
    def __str__(self):
        return f"{self.section.title}: {self.text}"

class SocialMediaLink(BaseModel):
    """Social media links"""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter/X'),
        ('instagram', 'Instagram'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
        ('pinterest', 'Pinterest'),
    ]
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    url = models.URLField()
    icon_class = models.CharField(max_length=100, blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'platform']
        verbose_name = "Social Media Link"
        verbose_name_plural = "Social Media Links"
    
    def __str__(self):
        return f"{self.get_platform_display()}: {self.url}"

class SiteSettings(BaseModel):
    """General site settings"""
    SETTING_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('boolean', 'Boolean'),
        ('url', 'URL'),
        ('email', 'Email'),
        ('textarea', 'Long Text'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='text')
    description = models.TextField(blank=True, null=True)
    group = models.CharField(max_length=50, default='general', help_text="Group settings together")
    
    class Meta:
        ordering = ['group', 'key']
        verbose_name = "Site Setting"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."
    
    def get_typed_value(self):
        """Return value converted to appropriate type"""
        if self.setting_type == 'boolean':
            return self.value.lower() in ['true', '1', 'yes']
        elif self.setting_type == 'number':
            try:
                return int(self.value)
            except ValueError:
                return 0
        return self.value


class HomePageContent(models.Model):
    """Singleton model for the public Home Page content"""
    def default_hero():
        return {
            'mobile_heading': 'Freshness from the Orchard to Your Table.',
            'desktop_heading': 'Fresh from the market, delivered to your door.',
            'desktop_subtext': 'Experience the finest seasonal harvests, sourced directly from trusted local farms. We bring nature’s best right to your kitchen, ensuring quality and sustainability in every bite.',
            'primary_cta_text': 'Shop the Harvest',
            'primary_cta_href': '/products',
            'secondary_cta_text': 'Learn more',
            'secondary_cta_href': '/about'
        }

    def default_how_it_works():
        return {
            'heading': 'How it works'
        }

    def default_steps():
        return [
            {
                'id': 1,
                'icon_key': 'select',
                'title': 'Select Your Favorites',
                'desc': 'Browse our curated selection of seasonal produce, dairy, and pantry staples.'
            },
            {
                'id': 2,
                'icon_key': 'local',
                'title': 'Sourced Locally',
                'desc': 'We partner directly with farmers to ensure peak freshness and fair prices.'
            },
            {
                'id': 3,
                'icon_key': 'delivery',
                'title': 'Delivered to You',
                'desc': 'Enjoy convenient, eco-friendly delivery straight to your doorstep.'
            },
            {
                'id': 4,
                'icon_key': 'enjoy',
                'title': 'Enjoy the Harvest',
                'desc': 'Cook, share, and savor the exceptional taste of farm-fresh food.'
            }
        ]

    def default_leftover_banner():
        return {
            'heading': 'Help Us Reduce Food Waste!',
            'description': 'Grab our \'Leftover Pack\'—a surprise bundle of perfectly good, delicious produce that might otherwise go to waste. Save money and the planet!',
            'cta_text': 'Get a Leftover Pack',
            'cta_href': '/products'
        }

    hero_section = models.JSONField(default=default_hero, blank=True)
    how_it_works = models.JSONField(default=default_how_it_works, blank=True)
    steps = models.JSONField(default=default_steps, blank=True)
    leftover_banner = models.JSONField(default=default_leftover_banner, blank=True)
    
    hero_image_desktop = models.ImageField(upload_to='homepage/hero/', blank=True, null=True)
    hero_image_mobile = models.ImageField(upload_to='homepage/hero/', blank=True, null=True)
    leftover_banner_image = models.ImageField(upload_to='homepage/leftover/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Home Page Content"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and HomePageContent.objects.exists():
            return HomePageContent.objects.first()
        return super().save(*args, **kwargs)


class AboutPageContent(BaseModel):
    """Singleton model for the About Us page content"""
    # The default data structures map to the frontend FALLBACK data
    
    def default_hero():
        return {
            'badge': 'Our story',
            'title': 'Rooted in quality,<br /><em style="font-style: italic; color: #00694c">growing for the future.</em>',
            'image_url': ''
        }
    
    def default_stats():
        return [
            {'value': '6+', 'label': 'Years of service'},
            {'value': '40+', 'label': 'Local farm partners'},
            {'value': '8', 'label': 'Store locations'},
            {'value': '98%', 'label': 'Customer satisfaction'},
        ]
        
    def default_values():
        return [
            {'icon_name': 'Leaf', 'title': 'Rooted in sustainability', 'body': 'Every product we source follows strict environmental criteria.'},
            {'icon_name': 'Users', 'title': 'Community first', 'body': 'We believe in fair prices for farmers and fair prices for customers.'},
            {'icon_name': 'Award', 'title': 'Uncompromising quality', 'body': 'From harvest to doorstep in under 48 hours.'},
            {'icon_name': 'MapPin', 'title': 'Transparent provenance', 'body': 'Every product carries a story — the farm, the region, the farmer.'},
        ]
        
    def default_milestones():
        return [
            {'year': '2018', 'event': 'Founded in Madrid with three farm partners and a single market stall.'},
            {'year': '2019', 'event': 'Opened our first physical store in Chamberí; launched home delivery across Madrid.'},
            {'year': '2021', 'event': 'Expanded to Barcelona and Sevilla; introduced the Leftover Pack programme.'},
            {'year': '2023', 'event': 'Reached 40 partner farms across Spain; launched the El Árbol digital platform.'},
            {'year': '2024', 'event': '8 store locations, 50,000+ happy customers, and still growing.'},
        ]
        
    def default_farm_partners():
        return [
            {'name': 'Hacienda del Sol', 'region': 'Almería', 'specialty': 'Heirloom tomatoes & peppers'},
            {'name': 'Finca La Paloma', 'region': 'Huelva', 'specialty': 'Strawberries & stone fruit'},
            {'name': 'Rancho Verde', 'region': 'Murcia', 'specialty': 'Avocados & citrus'},
            {'name': 'Serra dei Fiori', 'region': 'Liguria', 'specialty': 'Fresh herbs & greens'},
            {'name': 'Huerta La Vega', 'region': 'Murcia', 'specialty': 'Spinach & root vegetables'},
            {'name': 'Les Herbes du Midi', 'region': 'Provence', 'specialty': 'Wild-harvested herbs'},
        ]
        
    def default_team():
        return [
            {'name': 'Sofía Martínez', 'role': 'Co-founder & CEO', 'initials': 'SM', 'origin': 'Madrid'},
            {'name': 'Lucas Ferreira', 'role': 'Co-founder & Head of Sourcing', 'initials': 'LF', 'origin': 'Porto'},
            {'name': 'Ana Delgado', 'role': 'Head of Operations', 'initials': 'AD', 'origin': 'Sevilla'},
            {'name': 'Tomás Ruiz', 'role': 'Head of Technology', 'initials': 'TR', 'origin': 'Barcelona'},
        ]

    stats = models.JSONField(default=default_stats, help_text="List of stats objects {value, label}")
    values = models.JSONField(default=default_values, help_text="List of value objects {icon_name, title, body}")
    milestones = models.JSONField(default=default_milestones, help_text="List of timeline milestone objects {year, event}")
    farm_partners = models.JSONField(default=default_farm_partners, help_text="List of farm partners {name, region, specialty}")
    team = models.JSONField(default=default_team, help_text="List of team members {name, role, initials, origin}")
    hero_section = models.JSONField(default=default_hero, help_text="Hero section data {badge, title, image_url}")
    hero_image = models.ImageField(upload_to='about/', null=True, blank=True, help_text="Upload image for hero section (overrides image_url in JSON)")

    class Meta:
        verbose_name = "About Page Content"
        verbose_name_plural = "About Page Content"

    def __str__(self):
        return "About Page Content"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and AboutPageContent.objects.exists():
            return AboutPageContent.objects.first()
        return super().save(*args, **kwargs)

