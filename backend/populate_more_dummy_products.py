import os
import django
import sys
import random

# Setup Django environment
sys.path.append('d:/El-arbol/Frutos-Django-Next/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Category, SubCategory, Product, Brand
from shops.models import Shop

def populate_10_products():
    try:
        shop = Shop.objects.get(name="El Árbol Main Store")
    except Shop.DoesNotExist:
        shop = Shop.objects.first()

    brands = list(Brand.objects.all())
    if not brands:
        b, _ = Brand.objects.get_or_create(name="Default Brand")
        brands.append(b)

    # Make sure Grocery category exists
    grocery_cat, _ = Category.objects.get_or_create(name="Grocery")
    
    # Create subcategories
    subcats_data = {
        "Fruits": ["Tropical Fruits"],
        "Vegetables": ["Gourds", "Onions & Garlic"],
        "Grocery": ["Snacks", "Beverages", "Pasta"]
    }
    
    categories = {
        "Fruits": Category.objects.get_or_create(name="Fruits")[0],
        "Vegetables": Category.objects.get_or_create(name="Vegetables")[0],
        "Grocery": grocery_cat
    }
    
    subcategories = {}
    for cat_name, subs in subcats_data.items():
        for sub_name in subs:
            subcat, _ = SubCategory.objects.get_or_create(
                name=sub_name, 
                category=categories[cat_name]
            )
            subcategories[sub_name] = subcat

    # 10 new products
    products_data = [
        {"name": "Organic Mangoes", "category": "Fruits", "sub": "Tropical Fruits", "price": 4.50, "stock": 50, "unit": "per kg"},
        {"name": "Fresh Pineapple", "category": "Fruits", "sub": "Tropical Fruits", "price": 3.00, "stock": 40, "unit": "per piece"},
        
        {"name": "Red Onions", "category": "Vegetables", "sub": "Onions & Garlic", "price": 1.50, "stock": 200, "unit": "per kg"},
        {"name": "Garlic Bulbs", "category": "Vegetables", "sub": "Onions & Garlic", "price": 0.99, "stock": 150, "unit": "per 250g"},
        {"name": "Green Zucchini", "category": "Vegetables", "sub": "Gourds", "price": 2.20, "stock": 80, "unit": "per kg"},
        {"name": "Pumpkin", "category": "Vegetables", "sub": "Gourds", "price": 1.80, "stock": 60, "unit": "per kg"},

        {"name": "Potato Chips", "category": "Grocery", "sub": "Snacks", "price": 1.20, "stock": 300, "unit": "150g bag"},
        {"name": "Mixed Nuts", "category": "Grocery", "sub": "Snacks", "price": 4.50, "stock": 100, "unit": "200g jar"},
        {"name": "Apple Juice", "category": "Grocery", "sub": "Beverages", "price": 2.50, "stock": 120, "unit": "1L bottle"},
        {"name": "Spaghetti Pasta", "category": "Grocery", "sub": "Pasta", "price": 1.30, "stock": 250, "unit": "500g pack"}
    ]

    for pdata in products_data:
        cat = categories[pdata["category"]]
        sub = subcategories[pdata["sub"]]
        brand = random.choice(brands)
        
        product, created = Product.objects.get_or_create(
            name=pdata["name"],
            defaults={
                'shop': shop,
                'brand': brand,
                'description': f"Fresh and high quality {pdata['name']} for your daily needs.",
                'category': cat,
                'sub_category': sub,
                'price': pdata["price"],
                'stock': pdata["stock"],
                'unit': pdata["unit"],
                'is_active': True,
                'tax_rate': 5.00
            }
        )
        if created:
            print(f"Created product: {product.name}")
        else:
            print(f"Found existing product: {product.name}")

if __name__ == '__main__':
    populate_10_products()
    print("Successfully added 10 more products!")
