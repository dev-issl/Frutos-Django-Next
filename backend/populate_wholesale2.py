import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from wholesale.models import WholesalePageContent

WHOLESALE_FALLBACK = {
    "stats": [
        { "value": "200+", "label": "Business Partners", "sub": "Restaurants, hotels & retailers", "icon_name": "Building2" },
        { "value": "48h", "label": "Harvest to Delivery", "sub": "Maximum freshness guaranteed", "icon_name": "Truck" },
        { "value": "99.1%", "label": "Order Accuracy", "sub": "Rigorous quality control", "icon_name": "CheckCircle2" },
        { "value": "40+", "label": "Farm Sources", "sub": "Spain & southern Europe", "icon_name": "Tractor" },
        { "value": "0", "label": "Setup Fees", "sub": "No hidden costs", "icon_name": "ShieldCheck" }
    ],
    "benefits": [
        { "title": "Guaranteed Freshness", "body": "Every order is harvested within 24 hours of dispatch. Our cold-chain logistics deliver produce at peak quality — every single time.", "icon_name": "Leaf" },
        { "title": "Flexible Ordering Windows", "body": "Order daily, weekly, or on a custom schedule. Cut-off is 10 PM for next-morning delivery across Madrid, Barcelona, and Sevilla.", "icon_name": "Clock" },
        { "title": "Dedicated Account Manager", "body": "Every wholesale account gets a named contact who knows your kitchen, your seasonal needs, and is reachable directly — no call centres.", "icon_name": "UserCheck" },
        { "title": "Transparent Volume Pricing", "body": "Pricing tiers based on monthly volume — the more you order, the better the rate. No hidden surcharges, no seasonal price shocks.", "icon_name": "TrendingDown" },
        { "title": "Sustainability Credentials", "body": "All partner farms hold regenerative agriculture certification. Full traceability documentation for menu provenance and ESG reporting.", "icon_name": "Sun" },
        { "title": "Nationwide Cold-Chain Delivery", "body": "Refrigerated fleet covering all major Spanish cities. Temperature-monitored throughout, with live tracking on Growth and Enterprise plans.", "icon_name": "Truck" }
    ],
    "categories": [
        { "title": "Fresh Vegetables", "items": "Heirloom tomatoes, peppers, courgettes, aubergines, leafy greens, brassicas", "badge": "Year-round", "badge_bg_color": "#E7F1DF", "badge_text_color": "#00694c", "icon_name": "Carrot", "icon_bg_color": "#EDFAF2" },
        { "title": "Seasonal Fruits", "items": "Stone fruit, berries, figs, pears, melons — sourced at peak ripeness per season", "badge": "Seasonal", "badge_bg_color": "#FEF3C7", "badge_text_color": "#92400e", "icon_name": "Apple", "icon_bg_color": "#FFF7ED" },
        { "title": "Fresh Herbs & Microgreens", "items": "Basil, thyme, rosemary, tarragon, chives, coriander, edible flowers, micro shoots", "badge": "Year-round", "badge_bg_color": "#E7F1DF", "badge_text_color": "#00694c", "icon_name": "Sprout", "icon_bg_color": "#F0FDF4" },
        { "title": "Citrus & Tropical", "items": "Valencia oranges, Eureka lemons, limes, grapefruits, pomelos, blood oranges", "badge": "Year-round", "badge_bg_color": "#FEF3C7", "badge_text_color": "#92400e", "icon_name": "Sun", "icon_bg_color": "#FFFBEB" },
        { "title": "Root & Allium", "items": "Carrots, beetroot, celeriac, parsnips, turnips, garlic varieties, shallots, onions", "badge": "Year-round", "badge_bg_color": "#E7F1DF", "badge_text_color": "#00694c", "icon_name": "Tractor", "icon_bg_color": "#FDF4E7" },
        { "title": "Specialty & Heirloom", "items": "Rare varietals, wild-harvested items, foraged mushrooms, edible flowers, truffle products", "badge": "Limited", "badge_bg_color": "#EDE9FE", "badge_text_color": "#5b21b6", "icon_name": "Star", "icon_bg_color": "#F5F3FF" }
    ],
    "steps": [
        { "number": "01", "title": "Apply for an Account", "body": "Fill out the application form with your business details.", "icon_name": "FileText" },
        { "number": "02", "title": "Get Approved", "body": "Our team will review and approve your account within 24h.", "icon_name": "CheckSquare" },
        { "number": "03", "title": "Start Ordering", "body": "Access wholesale pricing and place your first order.", "icon_name": "ShoppingCart" },
        { "number": "04", "title": "Fast Delivery", "body": "Receive your fresh produce exactly when you need it.", "icon_name": "Truck" }
    ]
}

instance, created = WholesalePageContent.objects.get_or_create()

instance.stats = WHOLESALE_FALLBACK["stats"]
instance.benefits = WHOLESALE_FALLBACK["benefits"]
instance.categories = WHOLESALE_FALLBACK["categories"]
instance.steps = WHOLESALE_FALLBACK["steps"]

instance.save()

print("Successfully populated WholesalePageContent!")
if instance.hero_image:
    print(f"Hero Image URL: {instance.hero_image.url}")
else:
    print("No hero image found!")
