# orders/management/commands/setup_shipping_zones.py
from django.core.management.base import BaseCommand
from orders.models import (
    ShippingZone, ShippingZoneCoverage,
    WeightShippingRule, CourierProvider, Warehouse,
)


ZONES = [
    {
        'name': 'Dhaka', 'code': 'DHK', 'base_charge': 60, 'delivery_sla': '1-2 days', 'priority': 1,
        'cities': [
            'Dhaka', 'Narayanganj', 'Gazipur', 'Savar', 'Manikganj', 'Munshiganj',
            'Narsingdi', 'Kishorganj', 'Tangail', 'Faridpur',
        ],
        'postcodes': ['1000', '1100', '1200', '1205', '1207', '1212', '1215', '1216', '1300', '1400'],
    },
    {
        'name': 'Chattogram', 'code': 'CTG', 'base_charge': 120, 'delivery_sla': '2-3 days', 'priority': 2,
        'cities': [
            'Chattogram', 'Chittagong', 'Cox\'s Bazar', 'Comilla', 'Feni',
            'Noakhali', 'Lakshmipur', 'Chandpur', 'Brahmanbaria',
        ],
        'postcodes': ['4000', '4100', '4200', '4300', '4400', '4500'],
    },
    {
        'name': 'Rajshahi', 'code': 'RJH', 'base_charge': 150, 'delivery_sla': '2-3 days', 'priority': 3,
        'cities': [
            'Rajshahi', 'Bogra', 'Naogaon', 'Natore', 'Chapainawabganj',
            'Pabna', 'Sirajganj', 'Joypurhat',
        ],
        'postcodes': ['6000', '6100', '6200', '6300', '6400'],
    },
    {
        'name': 'Khulna', 'code': 'KHL', 'base_charge': 150, 'delivery_sla': '2-3 days', 'priority': 4,
        'cities': [
            'Khulna', 'Jessore', 'Satkhira', 'Bagerhat', 'Narail',
            'Magura', 'Meherpur', 'Chuadanga', 'Kushtia',
        ],
        'postcodes': ['9000', '9100', '9200', '9300', '7400'],
    },
    {
        'name': 'Sylhet', 'code': 'SYL', 'base_charge': 130, 'delivery_sla': '2-3 days', 'priority': 5,
        'cities': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
        'postcodes': ['3100', '3200', '3300', '3400'],
    },
    {
        'name': 'Barisal', 'code': 'BRS', 'base_charge': 160, 'delivery_sla': '3-4 days', 'priority': 6,
        'cities': ['Barisal', 'Pirojpur', 'Jhalokati', 'Bhola', 'Patuakhali', 'Barguna'],
        'postcodes': ['8200', '8300', '8400', '8500', '8600', '8700'],
    },
    {
        'name': 'Rangpur', 'code': 'RNG', 'base_charge': 160, 'delivery_sla': '3-4 days', 'priority': 7,
        'cities': [
            'Rangpur', 'Dinajpur', 'Thakurgaon', 'Panchagarh', 'Nilphamari',
            'Lalmonirhat', 'Kurigram', 'Gaibandha',
        ],
        'postcodes': ['5400', '5200', '5100', '5500', '5300'],
    },
    {
        'name': 'Mymensingh', 'code': 'MYM', 'base_charge': 100, 'delivery_sla': '2-3 days', 'priority': 8,
        'cities': ['Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'],
        'postcodes': ['2200', '2000', '2100', '2400'],
    },
]

WEIGHT_RULES = [
    {'name': '0-1 kg (Global)', 'min_weight': '0', 'max_weight': '1', 'base_cost': '0', 'per_kg_cost': '0'},
    {'name': '1-3 kg (Global)', 'min_weight': '1', 'max_weight': '3', 'base_cost': '20', 'per_kg_cost': '10'},
    {'name': '3-5 kg (Global)', 'min_weight': '3', 'max_weight': '5', 'base_cost': '50', 'per_kg_cost': '15'},
    {'name': '5-10 kg (Global)', 'min_weight': '5', 'max_weight': '10', 'base_cost': '100', 'per_kg_cost': '15'},
    {'name': '10+ kg (Global)', 'min_weight': '10', 'max_weight': None, 'base_cost': '175', 'per_kg_cost': '20'},
]

COURIERS = [
    {'name': 'Pathao',    'slug': 'pathao',    'tracking_url': 'https://pathao.com/track/{tracking_number}'},
    {'name': 'RedX',      'slug': 'redx',      'tracking_url': 'https://redx.com.bd/track/{tracking_number}'},
    {'name': 'Steadfast', 'slug': 'steadfast', 'tracking_url': 'https://steadfast.com.bd/track/{tracking_number}'},
    {'name': 'Sundarban', 'slug': 'sundarban', 'tracking_url': 'https://sundarbanexpress.com/track/{tracking_number}'},
    {'name': 'Paperfly',  'slug': 'paperfly',  'tracking_url': 'https://paperfly.com.bd/track/{tracking_number}'},
]


class Command(BaseCommand):
    help = 'Seed shipping zones, weight rules, and courier providers'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            ShippingZoneCoverage.objects.all().delete()
            ShippingZone.objects.all().delete()
            WeightShippingRule.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared existing zone/coverage/weight data'))

        zone_map = {}
        for z in ZONES:
            zone, created = ShippingZone.objects.update_or_create(
                code=z['code'],
                defaults={
                    'name': z['name'],
                    'base_charge': z['base_charge'],
                    'delivery_sla': z['delivery_sla'],
                    'priority': z['priority'],
                    'is_active': True,
                },
            )
            zone_map[z['code']] = zone
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action} zone: {zone}')

            for city in z['cities']:
                ShippingZoneCoverage.objects.get_or_create(zone=zone, city=city)
            for pc in z['postcodes']:
                ShippingZoneCoverage.objects.get_or_create(zone=zone, postcode=pc)

        for wr in WEIGHT_RULES:
            WeightShippingRule.objects.update_or_create(
                name=wr['name'],
                defaults={
                    'min_weight': wr['min_weight'],
                    'max_weight': wr['max_weight'],
                    'base_cost': wr['base_cost'],
                    'per_kg_cost': wr['per_kg_cost'],
                    'is_active': True,
                    'zone': None,
                },
            )
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(WEIGHT_RULES)} weight rules'))

        for c in COURIERS:
            courier, created = CourierProvider.objects.update_or_create(
                slug=c['slug'],
                defaults={'name': c['name'], 'tracking_url': c['tracking_url'], 'is_active': True},
            )
            if created:
                courier.supported_zones.set(ShippingZone.objects.all())
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action} courier: {courier.name}')

        # Default warehouse
        dhk_zone = zone_map.get('DHK')
        wh, created = Warehouse.objects.update_or_create(
            code='WH-DHK-01',
            defaults={
                'name': 'Dhaka Main Warehouse',
                'city': 'Dhaka',
                'postcode': '1207',
                'zone': dhk_zone,
                'priority': 0,
                'is_active': True,
            },
        )
        if created and dhk_zone:
            from orders.models import WarehouseZoneMapping
            for zone in ShippingZone.objects.all():
                WarehouseZoneMapping.objects.get_or_create(warehouse=wh, zone=zone)

        self.stdout.write(self.style.SUCCESS('Shipping zone setup complete ✓'))