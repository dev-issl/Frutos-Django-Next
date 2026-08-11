import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from orders.models import Coupon
from django.utils import timezone
from datetime import timedelta

c = Coupon.objects.create(
    code="TEST_SAVE40",
    type="PRODUCT_DISCOUNT",
    discount_type="FLAT",
    discount_amount="40.00",
    expires_at=timezone.now() + timedelta(days=1),
    active=True
)

try:
    print(c.calculate_discount(100, 10))
except Exception as e:
    import traceback
    traceback.print_exc()

c.delete()
