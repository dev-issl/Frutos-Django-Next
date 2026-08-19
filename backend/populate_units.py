import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import DisplayUnit

UNIT_OPTIONS = [
  { "abbreviation": "BAN", "name": "BANDEJA (TRAY)" },
  { "abbreviation": "CAJ", "name": "CAJA (BOX)" },
  { "abbreviation": "GRA", "name": "GRANDE (LARGE)" },
  { "abbreviation": "KG", "name": "KILO (KILO)" },
  { "abbreviation": "MAN", "name": "MANOJO (BUNCH)" },
  { "abbreviation": "MED", "name": "MEDIO CAJA (HALF BOX)" },
  { "abbreviation": "PAL", "name": "PALET (PALLET)" },
  { "abbreviation": "PEQ", "name": "PEQUEÑO (SMALL)" },
  { "abbreviation": "PIE", "name": "PIEZA (PIECE)" },
]

for unit in UNIT_OPTIONS:
    DisplayUnit.objects.get_or_create(
        abbreviation=unit["abbreviation"],
        defaults={"name": unit["name"]}
    )

print("Successfully populated display units.")
