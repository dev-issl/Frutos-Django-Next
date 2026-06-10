import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from wholesale.models import WholesalePageContent

WHOLESALE_FALLBACK = {
    "stats": [
        { "value": "200+", "label": "Business Partners", "sub": "Restaurants, hotels & retailers", "icon_name": "Building2" },
        { "value": "48h", "label": "Harvest to Delivery", "sub": "Maximum freshness guaranteed", "icon_name": "Truck" },
        { "value": "99.1%", "label": "Order Accuracy", "sub": "Rigorous quality control", "icon_name": "CheckCircle2" }
    ],
    "benefits": [
        { "title": "Guaranteed Freshness", "body": "Produce is harvested only after your order is confirmed.", "icon_name": "Leaf" },
        { "title": "Direct from Farms", "body": "We work directly with growers to ensure fair prices.", "icon_name": "Tractor" },
        { "title": "Flexible Ordering", "body": "Order via our B2B platform, email, or WhatsApp.", "icon_name": "Phone" }
    ],
    "categories": [
        { "title": "Fresh Vegetables", "items": "Tomatoes, peppers, courgettes", "badge": "Year-round", "badge_bg_color": "#E7F1DF", "badge_text_color": "#00694c", "icon_name": "Carrot", "icon_bg_color": "#EDFAF2" },
        { "title": "Seasonal Fruits", "items": "Citrus, stone fruits, berries", "badge": "Seasonal", "badge_bg_color": "#FEF3C7", "badge_text_color": "#92400E", "icon_name": "Apple", "icon_bg_color": "#FFFBEB" },
        { "title": "Artisan Dairy", "items": "Cheeses, butter, milk", "badge": "Limited", "badge_bg_color": "#E0E7FF", "badge_text_color": "#3730A3", "icon_name": "Milk", "icon_bg_color": "#EEF2FF" }
    ],
    "steps": [
        { "number": "01", "title": "Apply for an Account", "body": "Fill out the application form with your business details.", "icon_name": "FileText" },
        { "number": "02", "title": "Get Approved", "body": "Our team will review and approve your account within 24h.", "icon_name": "CheckSquare" },
        { "number": "03", "title": "Start Ordering", "body": "Access wholesale pricing and place your first order.", "icon_name": "ShoppingCart" }
    ],
    "guarantee": {
        "title": "No long-term commitment required",
        "subtitle": "Rolling monthly arrangement. Upgrade or pause anytime.",
        "checks": [
            { "text": "No setup fees", "order": 1, "id": 1 },
            { "text": "Cancel anytime", "order": 2, "id": 2 },
            { "text": "Dedicated support", "order": 3, "id": 3 }
        ]
    }
}

instance, created = WholesalePageContent.objects.get_or_create()

instance.stats = WHOLESALE_FALLBACK["stats"]
instance.benefits = WHOLESALE_FALLBACK["benefits"]
instance.categories = WHOLESALE_FALLBACK["categories"]
instance.steps = WHOLESALE_FALLBACK["steps"]
instance.guarantee = WHOLESALE_FALLBACK["guarantee"]

instance.save()
print("Successfully populated WholesalePageContent with default data!")
