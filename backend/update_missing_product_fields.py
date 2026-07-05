import os
import sys
import django
import random
from decimal import Decimal

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product

def update_products():
    products = Product.objects.all()
    count = 0
    for product in products:
        changed = False
        
        if not product.unit:
            product.unit = random.choice(['1 kg', '500g', '1 piece', '1 Dozen', '1 Pack'])
            changed = True
            
        if not product.wholesale_unit:
            product.wholesale_unit = random.choice(['10 kg', '5 kg', '10 pieces', '5 Dozen', '10 Packs'])
            changed = True
            
        if not product.origin:
            product.origin = random.choice(['Bangladesh', 'India', 'China', 'Thailand', 'Vietnam'])
            changed = True
            
        if not product.variant:
            product.variant = random.choice(['A-Grade', 'Premium', 'Standard', 'Organic'])
            changed = True
            
        if not product.wholesale_price and product.price:
            # 10% to 30% discount for wholesale
            discount = Decimal(random.uniform(0.1, 0.3))
            product.wholesale_price = round(product.price * (Decimal('1.0') - discount), 2)
            changed = True
            
        if not product.discount_price and product.price:
            # Randomly give 5-15% discount
            if random.choice([True, False]):
                discount = Decimal(random.uniform(0.05, 0.15))
                product.discount_price = round(product.price * (Decimal('1.0') - discount), 2)
                changed = True
                
        if not product.badge:
            if random.choice([True, False, False]): # 33% chance
                product.badge = random.choice(['NEW', 'SALE', 'HOT', 'ORGANIC'])
                product.badge_color = random.choice(['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500'])
                changed = True

        if not product.thumbnail:
            # We can't easily generate a real photo, but we could assign a default one if needed.
            # Usually, it's better to just skip if we don't have files, or try to use an existing one.
            # Let's find any product that has a thumbnail and copy it.
            p_with_thumb = Product.objects.exclude(thumbnail='').first()
            if p_with_thumb:
                product.thumbnail = p_with_thumb.thumbnail
                changed = True
                
        if product.stock == 0:
            product.stock = random.randint(50, 500)
            changed = True
            
        if changed:
            product.save()
            count += 1
            print(f"Updated product: {product.name}")
            
    print(f"\nTotal {count} products updated.")

if __name__ == '__main__':
    update_products()
