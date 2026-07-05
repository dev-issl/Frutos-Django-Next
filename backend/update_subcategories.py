import os
import sys
import django
import random

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, SubCategory

def update_subcategories():
    products = Product.objects.filter(sub_category__isnull=True)
    count = 0
    for product in products:
        # Find subcategories for this product's category
        subcategories = SubCategory.objects.filter(category=product.category)
        if subcategories.exists():
            product.sub_category = random.choice(list(subcategories))
        else:
            # Fallback to any subcategory if none match the category
            all_scs = SubCategory.objects.all()
            if all_scs.exists():
                product.sub_category = random.choice(list(all_scs))
        
        if product.sub_category:
            product.save()
            count += 1
            print(f"Updated sub_category for: {product.name}")
            
    print(f"\nTotal {count} products updated with sub_category.")

if __name__ == '__main__':
    update_subcategories()
