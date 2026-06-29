from products.models import Product

def get_realistic_min(name):
    name_lower = name.lower()
    if 'juice' in name_lower or 'milk' in name_lower:
        return 12  # A case of 12
    if 'chips' in name_lower or 'nuts' in name_lower or 'pepper' in name_lower:
        return 20  # Box of 20
    if 'apple' in name_lower or 'orange' in name_lower or 'banana' in name_lower or 'mango' in name_lower or 'pineapple' in name_lower:
        return 10  # 10 kg or 10 boxes
    if 'rice' in name_lower or 'garlic' in name_lower or 'onion' in name_lower or 'tomato' in name_lower or 'pumpkin' in name_lower or 'broccoli' in name_lower or 'spinach' in name_lower or 'carrot' in name_lower or 'zucchini' in name_lower:
        return 15  # 15 kg or bags
    if 'cheese' in name_lower or 'yogurt' in name_lower:
        return 10
    return 10  # Default 10

count = 0
for p in Product.objects.all():
    min_qty = get_realistic_min(p.name)
    p.minimum_purchase = min_qty
    p.save(update_fields=['minimum_purchase'])
    count += 1

print(f"Updated minimum_purchase for {count} products.")
