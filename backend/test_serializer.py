import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product
from products.serializers import ProductSerializer
from wholesale.models import WholesaleUser
from rest_framework.test import APIRequestFactory

def test():
    # Get or create products/users
    product = Product.objects.filter(name__icontains='Premium Product 30').first() or Product.objects.first()
    if not product:
        print("No product found")
        return
        
    print(f"--- Product: {product.name} ---")
    print(f"Raw Price: {product.price}, Wholesale Price: {product.wholesale_price}, Restaurant Price: {product.restaurant_price}")
    print("-" * 50)

    factory = APIRequestFactory()

    # 1. Test External Wholesale (RESTAURANT) User
    ext_user = WholesaleUser.objects.filter(user_type='RESTAURANT').first()
    if ext_user:
        ext_user.status = 'APPROVED'
        ext_user.save()
        req = factory.get('/')
        req.user = ext_user
        s = ProductSerializer(product, context={'request': req})
        data = s.data
        print(f"External Wholesale User ({ext_user.email}) -> wholesale_price in response: {data.get('wholesale_price')}")
        print(f"User context: {data.get('_user_context')}")
    else:
        print("No RESTAURANT WholesaleUser found")

    print("-" * 50)

    # 2. Test Internal Wholesale (WHOLESALER) User
    int_user = WholesaleUser.objects.filter(user_type='WHOLESALER').first()
    if int_user:
        int_user.status = 'APPROVED'
        int_user.save()
        req = factory.get('/')
        req.user = int_user
        s = ProductSerializer(product, context={'request': req})
        data = s.data
        print(f"Internal Wholesale User ({int_user.email}) -> wholesale_price in response: {data.get('wholesale_price')}")
        print(f"User context: {data.get('_user_context')}")
    else:
        print("No WHOLESALER WholesaleUser found")

if __name__ == '__main__':
    test()

