import random
from products.models import Product
from website.models import SiteSettings

settings = SiteSettings.objects.filter(key='product_classes').first()
if settings and settings.value:
    classes = [c.strip() for c in settings.value.split(',') if c.strip()]
    if classes:
        print('Available classes:', classes)
        count = 0
        for p in Product.objects.all():
            p.variant = random.choice(classes)
            p.save(update_fields=['variant'])
            count += 1
        print(f'Successfully updated {count} products with random classes.')
    else:
        print('No valid classes found in settings.')
else:
    print('No classes settings found.')
