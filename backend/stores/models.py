"""
stores/models.py
"""
import re
import urllib.request
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


def _resolve_short_url(url: str) -> str:
    """Follow redirects to expand short URLs like maps.app.goo.gl"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.url
    except Exception:
        return url


def _extract_lat_lng(url: str):
    """Parse lat/lng from a Google Maps URL. Returns (lat, lng) or (None, None)."""
    if not url:
        return None, None

    if 'maps.app.goo.gl' in url or 'goo.gl' in url:
        url = _resolve_short_url(url)

    patterns = [
        r'@(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)',
        r'[?&]q=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)',
        r'll=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)',
        r'destination=(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)',
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            lat, lng = float(m.group(1)), float(m.group(2))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                return lat, lng
    return None, None


def _format_time_12h(t) -> str:
    """Convert a time object to '8:30 AM' style string."""
    if t is None:
        return ''
    hour = t.hour
    minute = t.minute
    period = 'AM' if hour < 12 else 'PM'
    hour12 = hour % 12 or 12
    if minute:
        return f'{hour12}:{minute:02d} {period}'
    return f'{hour12}:00 {period}'


class Store(models.Model):
    owner        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='stores_owned', help_text='Store Owner for managing leftover packs')
    slug         = models.SlugField(max_length=100, unique=True)
    name         = models.CharField(max_length=200)
    short_name   = models.CharField(max_length=80)
    address      = models.CharField(max_length=300)
    city         = models.CharField(max_length=150)
    full_address = models.CharField(max_length=400)
    phone        = models.CharField(max_length=30)

    # ── Time fields (replaces CharField) ─────────────────────────────────────
    open_time    = models.TimeField(help_text='Opening time (use AM/PM picker)')
    close_time   = models.TimeField(help_text='Closing time (use AM/PM picker)')

    # Auto-calculated on save — do not edit manually
    hours        = models.CharField(
        max_length=30,
        blank=True,
        editable=False,
        help_text='Auto-calculated from open/close time — e.g. 8:00 AM — 9:00 PM',
    )

    map_link     = models.URLField(blank=True, help_text='Full বা শর্ট Google Maps URL — lat/lng auto-extracted on save')
    lat          = models.FloatField(null=True, blank=True, help_text='Auto-filled from Map Link')
    lng          = models.FloatField(null=True, blank=True, help_text='Auto-filled from Map Link')

    # ── Image upload (replaces URLField) ─────────────────────────────────────
    image        = models.ImageField(
        upload_to='stores/banners/',
        help_text='Banner image — upload JPG/PNG/WebP',
    )

    # ── Optional provenance ───────────────────────────────────────────────────
    provenance   = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='e.g. from Almería (optional)',
    )

    is_active    = models.BooleanField(default=True, db_index=True)
    order        = models.PositiveSmallIntegerField(default=0, help_text='Store display order')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'stores'
        ordering  = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Auto-calculate hours from open_time / close_time
        if self.open_time and self.close_time:
            self.hours = f'{_format_time_12h(self.open_time)} — {_format_time_12h(self.close_time)}'

        # Auto-extract lat/lng from map_link
        if self.map_link:
            lat, lng = _extract_lat_lng(self.map_link)
            if lat is not None:
                self.lat = lat
                self.lng = lng

        super().save(*args, **kwargs)


class StoreFeature(models.Model):
    FEATURE_CHOICES = [
        ('leftoverPack', 'Leftover Pack'),
        ('organic',      'Organic'),
        ('delivery',     'Delivery'),
        ('pickup',       'Click & Collect'),
        ('clickCollect', 'Click & Collect'),
    ]
    store   = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='features')
    feature = models.CharField(max_length=30, choices=FEATURE_CHOICES)

    class Meta:
        app_label       = 'stores'
        unique_together = ('store', 'feature')

    def __str__(self):
        return f'{self.store.short_name} — {self.feature}'


class StoreAvailability(models.Model):
    store    = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='availability')
    category = models.CharField(max_length=80, help_text='e.g. Fruits, Veg, Bread')

    # ── Lucide icon name (kebab-case) ─────────────────────────────────────────
    icon     = models.CharField(
        max_length=80,
        blank=True,
        default='shopping-basket',
        help_text='Lucide icon name in kebab-case, e.g. apple, leaf, wheat, milk, wine, croissant',
    )

    order    = models.PositiveSmallIntegerField(default=0)

    class Meta:
        app_label       = 'stores'
        ordering        = ['order', 'category']
        unique_together = ('store', 'category')

    def __str__(self):
        return f'{self.store.short_name} — {self.category}'


class LeftoverPack(models.Model):
    PACKAGE_TYPE_CHOICES = [
        ('KG', 'KG'),
        ('Box', 'Box'),
        ('Bundle', 'Bundle'),
        ('Carton', 'Carton'),
        ('Piece', 'Piece'),
        ('Sack', 'Sack'),
        ('Other', 'Other'),
    ]
    store       = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='leftover_packs')
    name        = models.CharField(max_length=200)
    description = models.CharField(max_length=300)
    
    # Pricing
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    price       = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Selling price")
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    # Shipping Config
    shipping_category = models.ForeignKey(
        'products.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipping_category_leftover_packs',
        help_text="Optional: Restrict to specific shipping methods"
    )
    weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Weight in kg for weight-based shipping calculation"
    )

    # Product Details
    package_type = models.CharField(max_length=50, choices=PACKAGE_TYPE_CHOICES, default='Box')
    weight_quantity = models.CharField(max_length=100, blank=True, help_text='e.g., 5 KG, 2 Boxes')
    stock = models.PositiveIntegerField(default=0)
    estimated_delivery = models.CharField(max_length=150, blank=True, help_text='e.g., 1-2 Business Days')

    # ── Image upload (replaces URLField) ─────────────────────────────────────
    image       = models.ImageField(
        upload_to='stores/leftover-packs/',
        help_text='Main Pack image — upload JPG/PNG/WebP',
    )

    is_active   = models.BooleanField(default=True)
    order       = models.PositiveSmallIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at  = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        app_label = 'stores'
        ordering  = ['order', 'name']

    def __str__(self):
        return f'{self.store.short_name} — {self.name} (€{self.price})'

    @property
    def discount_percentage(self):
        if self.original_price and self.price and self.original_price > self.price:
            return round(((self.original_price - self.price) / self.original_price) * 100, 2)
        return 0


class LeftoverPackImage(models.Model):
    pack = models.ForeignKey(LeftoverPack, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='stores/leftover-packs/gallery/')
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'stores'
        ordering = ['order', 'id']

    def __str__(self):
        return f"Image for {self.pack.name}"