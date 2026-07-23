# wholesale/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid


class WholesaleUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_approved', True)
        return self.create_user(email, password, **extra_fields)


class BusinessType(models.TextChoices):
    RESTAURANT = 'restaurant', 'Restaurant / Bistro'
    HOTEL = 'hotel', 'Hotel / Resort'
    CATERING = 'catering', 'Catering Company'
    FOOD_RETAIL = 'food_retail', 'Food Retail / Grocery'
    DARK_KITCHEN = 'dark_kitchen', 'Dark Kitchen'
    CAFE = 'cafe', 'Café / Bakery'
    OTHER = 'other', 'Other'


class MonthlyVolume(models.TextChoices):
    LOW = '400_1000', '€400 – €1,000 / month'
    MED = '1000_3000', '€1,000 – €3,000 / month'
    HIGH = '3000_7000', '€3,000 – €7,000 / month'
    VERY_HIGH = '7000_plus', '€7,000+ / month'


class ApplicationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending Review'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    SUSPENDED = 'suspended', 'Suspended'


class WholesaleUser(AbstractBaseUser, PermissionsMixin):
    # Override PermissionsMixin fields to avoid reverse accessor clash with auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='wholesale_users',
        related_query_name='wholesale_user',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='wholesale_users_permissions',
        related_query_name='wholesale_user',
        verbose_name='user permissions',
    )
    email = models.EmailField(unique=True, db_index=True)

    # Business info
    business_name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=200)
    trade_license_number = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    postcode = models.CharField(max_length=20, blank=True)
    business_type = models.CharField(
        max_length=50,
        choices=BusinessType.choices,
        default=BusinessType.OTHER
    )
    monthly_volume = models.CharField(
        max_length=50,
        choices=MonthlyVolume.choices,
        default=MonthlyVolume.LOW
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
        db_index=True
    )

    # Django auth fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Timestamps
    applied_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)

    # Account manager
    account_manager_name = models.CharField(max_length=200, blank=True)
    account_manager_email = models.EmailField(blank=True)

    # Admin notes
    admin_notes = models.TextField(blank=True)

    # Aggregate stats (updated on order)
    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    profile_image = models.ImageField(
        upload_to='wholesale/avatars/',
        null=True,
        blank=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['business_name', 'contact_name', 'trade_license_number']

    objects = WholesaleUserManager()

    class Meta:
        verbose_name = 'Wholesale User'
        verbose_name_plural = 'Wholesale Users'
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.business_name} <{self.email}>"

    @property
    def is_approved(self):
        return self.status == ApplicationStatus.APPROVED

    @property
    def display_business_type(self):
        return dict(BusinessType.choices).get(self.business_type, self.business_type)

    @property
    def display_volume(self):
        return dict(MonthlyVolume.choices).get(self.monthly_volume, self.monthly_volume)


class WholesaleDocument(models.Model):
    """Optional business documents uploaded by wholesale users."""
    user = models.ForeignKey(
        WholesaleUser, on_delete=models.CASCADE, related_name='documents'
    )
    name = models.CharField(max_length=200)
    file = models.FileField(upload_to='wholesale/documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.business_name} - {self.name}"


class WholesaleNotification(models.Model):
    """Simple notification system for wholesale users."""
    class Type(models.TextChoices):
        APPLICATION = 'application', 'Application Update'
        ORDER = 'order', 'Order Update'
        PRICING = 'pricing', 'Pricing Update'
        GENERAL = 'general', 'General'

    user = models.ForeignKey(
        WholesaleUser, on_delete=models.CASCADE, related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.business_name} - {self.title}"


class WholesaleDailyReport(models.Model):
    """Daily reports submitted by wholesale users."""
    user = models.ForeignKey(
        WholesaleUser, on_delete=models.CASCADE, related_name='daily_reports'
    )
    cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bank = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    store = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    purchase = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    purchase_note = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Report {self.date} - {self.user.business_name}"


# wholesale content
"""
wholesale/models.py

Content models for the public-facing Wholesale landing page.
Auth / account models (WholesaleAccount, etc.) should stay below — untouched.
"""

from django.db import models


# ─────────────────────────────────────────────────────────────────────────────
# PAGE CONTENT (JSON-based Singleton)
# ─────────────────────────────────────────────────────────────────────────────

class WholesalePageContent(models.Model):
    """
    Singleton-style model holding all content for the Wholesale landing page
    in flexible JSON fields.
    """
    def default_hero():
        return {
            'badge': 'PARTNER WITH US',
            'title_main': 'Supply your business with',
            'title_highlight': 'the freshest local produce',
            'description': 'Join hundreds of restaurants, hotels, and retailers who trust us for consistent quality, transparent sourcing, and reliable delivery.',
            'primary_cta_text': 'Apply for Wholesale',
            'primary_cta_href': '#apply',
            'secondary_cta_text': 'View our catalogue',
            'secondary_cta_href': '/products'
        }

    def default_stats():
        return [
            {'value': '48h', 'label': 'Farm to Kitchen', 'sub': 'Guaranteed freshness', 'icon_name': 'Clock'},
            {'value': '40+', 'label': 'Local Farms', 'sub': 'Direct relationships', 'icon_name': 'MapPin'},
            {'value': '€0', 'label': 'Delivery Fee', 'sub': 'On orders over €150', 'icon_name': 'Truck'},
        ]

    def default_benefits():
        return [
            {'title': 'Consistent Quality', 'body': 'We source only from trusted local farms with strict quality standards.', 'icon_name': 'Award'},
            {'title': 'Transparent Pricing', 'body': 'Fair prices for farmers, competitive prices for your business.', 'icon_name': 'CircleDollarSign'},
            {'title': 'Reliable Delivery', 'body': 'Flexible delivery schedules to match your kitchen\'s rhythm.', 'icon_name': 'Truck'},
            {'title': 'Dedicated Support', 'body': 'A personal account manager for your specific sourcing needs.', 'icon_name': 'Headset'},
            {'title': 'Seasonal Insights', 'body': 'Regular updates on what\'s in season to help plan your menus.', 'icon_name': 'CalendarDays'},
            {'title': 'Sustainable Impact', 'body': 'Reduce food miles and support the local agricultural economy.', 'icon_name': 'Leaf'},
        ]

    def default_categories():
        return [
            {'title': 'Fresh Produce', 'items': 'Seasonal fruits, vegetables, herbs, and specialty items.', 'badge': 'MOST POPULAR', 'badge_bg_color': '#E8F5E9', 'badge_text_color': '#2E7D32', 'icon_name': 'Leaf', 'icon_bg_color': '#F1F8F5'},
            {'title': 'Dairy & Eggs', 'items': 'Farm-fresh eggs, artisanal cheeses, milk, and butter.', 'badge': '', 'badge_bg_color': '', 'badge_text_color': '', 'icon_name': 'Egg', 'icon_bg_color': '#FFF8E1'},
            {'title': 'Pantry Staples', 'items': 'Olive oils, grains, preserves, and artisanal honey.', 'badge': '', 'badge_bg_color': '', 'badge_text_color': '', 'icon_name': 'Wheat', 'icon_bg_color': '#FFF3E0'},
            {'title': 'Leftover Packs', 'items': 'Imperfect produce at a discount to reduce food waste.', 'badge': 'ECO-FRIENDLY', 'badge_bg_color': '#E8EAF6', 'badge_text_color': '#3F51B5', 'icon_name': 'PackageOpen', 'icon_bg_color': '#E8EAF6'},
        ]

    def default_steps():
        return [
            {'number': '1', 'title': 'Apply online', 'body': 'Fill out our quick wholesale application form with your business details.', 'icon_name': 'FileText'},
            {'number': '2', 'title': 'Account approval', 'body': 'Our team will review your application and set up your account within 24 hours.', 'icon_name': 'CheckCircle'},
            {'number': '3', 'title': 'Place orders', 'body': 'Access our wholesale portal, view live pricing, and place your first order.', 'icon_name': 'ShoppingCart'},
            {'number': '4', 'title': 'Receive delivery', 'body': 'Get fresh produce delivered directly to your kitchen door.', 'icon_name': 'Truck'},
        ]

    def default_guarantee():
        return {
            'title': 'The El Árbol Guarantee',
            'subtitle': 'We stand behind the quality of every order.',
            'checks': [
                '100% Satisfaction or your money back',
                'Fully traceable supply chain',
                'HACCP compliant handling'
            ]
        }

    hero_section = models.JSONField(
        default=default_hero,
        blank=True,
        help_text="JSON for the hero section (badge, title_main, title_highlight, image_url, etc.)"
    )
    hero_image = models.ImageField(
        upload_to="wholesale/hero/",
        null=True,
        blank=True,
        help_text="Main hero image displayed on the right side of the section. Recommended: 1200×900px."
    )
    stats = models.JSONField(
        default=default_stats,
        blank=True,
        help_text="Array of stat objects: [{ value, label, sub, icon_name }]"
    )
    benefits = models.JSONField(
        default=default_benefits,
        blank=True,
        help_text="Array of benefit objects: [{ title, body, icon_name }]"
    )
    categories = models.JSONField(
        default=default_categories,
        blank=True,
        help_text="Array of category objects: [{ title, items, badge, badge_bg_color, badge_text_color, icon_name, icon_bg_color }]"
    )
    steps = models.JSONField(
        default=default_steps,
        blank=True,
        help_text="Array of step objects: [{ number, title, body, icon_name }]"
    )
    guarantee = models.JSONField(
        default=default_guarantee,
        blank=True,
        help_text="JSON object for the guarantee bar: { title, subtitle, checks: [text, text...] }"
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Wholesale Page Content"
        verbose_name_plural = "Wholesale Page Content"

    def __str__(self):
        return "Wholesale Page Content"
