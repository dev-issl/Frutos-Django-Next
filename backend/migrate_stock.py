import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product, ProductStoreStock

def migrate_stock():
    products = Product.objects.all()
    count = 0
    for product in products:
        for store in product.stores.all():
            stock, created = ProductStoreStock.objects.get_or_create(
                product=product,
                store=store,
                defaults={'stock': product.stock}
            )
            if created:
                count += 1
    print(f"Created {count} StoreInventory records.")

if __name__ == '__main__':
    migrate_stock()
