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
from django.contrib.auth import get_user_model

User = get_user_model()

def populate_dummy_data():
    email = "munnahowlader06@gmail.com"
    try:
        user = User.objects.get(email=email)
        print(f"Found user: {email}")
    except User.DoesNotExist:
        # If not found, get the first user
        user = User.objects.first()
        if not user:
            print("No users found. Creating a default user.")
            user = User.objects.create_user(email="admin@example.com", password="password123")
        print(f"Using user: {user.email}")

    # Create a dummy shop if none exists
    shop, created = Shop.objects.get_or_create(
        name="El Árbol Main Store",
        defaults={
            'owner': user,
            'description': "The main store for all organic products.",
            'contact_email': "contact@elarbol.com",
            'is_active': True,
            'is_verified': True
        }
    )
    if created:
        print(f"Created shop: {shop.name}")
    else:
        print(f"Found existing shop: {shop.name}")

    # Create dummy brands
    brands_data = ["Nature's Best", "Organic Farms", "Fresh Picks"]
    brands = []
    for brand_name in brands_data:
        brand, created = Brand.objects.get_or_create(
            name=brand_name,
            defaults={'description': f"Description for {brand_name}"}
        )
        brands.append(brand)
        if created:
            print(f"Created brand: {brand.name}")

    # Create dummy categories and subcategories
    categories_data = {
        "Fruits": ["Apples", "Bananas", "Citrus", "Berries"],
        "Vegetables": ["Root Vegetables", "Leafy Greens", "Cruciferous"],
        "Dairy": ["Milk", "Cheese", "Yogurt"],
        "Pantry": ["Grains", "Canned Goods", "Spices"]
    }
    
    categories = {}
    subcategories = {}

    for cat_name, sub_names in categories_data.items():
        category, created = Category.objects.get_or_create(name=cat_name)
        categories[cat_name] = category
        if created:
            print(f"Created category: {category.name}")
            
        for sub_name in sub_names:
            subcat, created = SubCategory.objects.get_or_create(
                name=sub_name,
                category=category
            )
            subcategories[sub_name] = subcat
            if created:
                print(f"Created subcategory: {subcat.name}")

    # Create dummy products
    products_data = [
        # Fruits
        {"name": "Organic Gala Apples", "category": "Fruits", "sub": "Apples", "price": 3.99, "stock": 100, "unit": "per kg"},
        {"name": "Fresh Cavendish Bananas", "category": "Fruits", "sub": "Bananas", "price": 1.99, "stock": 150, "unit": "per bunch"},
        {"name": "Navel Oranges", "category": "Fruits", "sub": "Citrus", "price": 4.50, "stock": 80, "unit": "per kg"},
        {"name": "Organic Strawberries", "category": "Fruits", "sub": "Berries", "price": 5.99, "stock": 50, "unit": "per box"},
        # Vegetables
        {"name": "Organic Carrots", "category": "Vegetables", "sub": "Root Vegetables", "price": 2.49, "stock": 120, "unit": "per kg"},
        {"name": "Fresh Spinach", "category": "Vegetables", "sub": "Leafy Greens", "price": 3.50, "stock": 60, "unit": "per bunch"},
        {"name": "Broccoli Crowns", "category": "Vegetables", "sub": "Cruciferous", "price": 2.99, "stock": 90, "unit": "per head"},
        # Dairy
        {"name": "Whole Milk 1L", "category": "Dairy", "sub": "Milk", "price": 1.50, "stock": 200, "unit": "1 Liter"},
        {"name": "Cheddar Cheese Block", "category": "Dairy", "sub": "Cheese", "price": 6.99, "stock": 40, "unit": "500g"},
        {"name": "Greek Yogurt Plain", "category": "Dairy", "sub": "Yogurt", "price": 4.20, "stock": 70, "unit": "1 kg tub"},
        # Pantry
        {"name": "Brown Rice", "category": "Pantry", "sub": "Grains", "price": 5.50, "stock": 100, "unit": "1 kg bag"},
        {"name": "Canned Diced Tomatoes", "category": "Pantry", "sub": "Canned Goods", "price": 1.20, "stock": 300, "unit": "400g can"},
        {"name": "Black Pepper", "category": "Pantry", "sub": "Spices", "price": 3.00, "stock": 150, "unit": "100g jar"},
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
                'description': f"This is a delicious and high quality {pdata['name']}.",
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
    populate_dummy_data()
    print("Done populating product dummy data!")
