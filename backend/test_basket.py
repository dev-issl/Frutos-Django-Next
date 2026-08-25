import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from orders.models import Basket, BasketItem
from products.models import Product
from orders.serializers import BasketItemSerializer

try:
    basket = Basket.objects.create()
    product = Product.objects.first()
    print(f"Using product: {product.id}")
    basket_item = BasketItem.objects.create(basket=basket, product=product, quantity=1)
    
    serializer = BasketItemSerializer(basket_item)
    print(serializer.data)
except Exception as e:
    import traceback
    traceback.print_exc()
