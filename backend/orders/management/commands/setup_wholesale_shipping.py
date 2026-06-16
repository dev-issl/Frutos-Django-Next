from django.core.management.base import BaseCommand
from orders.models import ShippingMethod, ShippingTier
from decimal import Decimal

class Command(BaseCommand):
    help = 'Sets up wholesale weight-based shipping rules'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Wholesale Shipping Rules...')

        # Find or create the Wholesale Shipping Method
        method, created = ShippingMethod.objects.get_or_create(
            name="Wholesale Bulk Delivery",
            defaults={
                'description': 'Weight-based bulk delivery for wholesale orders.',
                'price': Decimal('200.00'),
                'preferred_pricing_type': 'weight',
                'is_active': True,
                'is_wholesale_only': True,
                'delivery_estimated_time': '3-5 business days'
            }
        )

        if not created:
            self.stdout.write(f'Shipping Method "{method.name}" already exists. Updating...')
            method.is_wholesale_only = True
            method.preferred_pricing_type = 'weight'
            method.save()

        # Clear existing tiers to recreate them
        method.shipping_tiers.all().delete()

        # Tier 1: 0 - 20 kg = 150 BDT
        ShippingTier.objects.create(
            shipping_method=method,
            pricing_type='weight',
            min_weight=Decimal('0.0'),
            max_weight=Decimal('20.0'),
            base_price=Decimal('150.00'),
            has_incremental_pricing=False,
            priority=10
        )

        # Tier 2: 20.01 - 50 kg = 300 BDT
        ShippingTier.objects.create(
            shipping_method=method,
            pricing_type='weight',
            min_weight=Decimal('20.01'),
            max_weight=Decimal('50.0'),
            base_price=Decimal('300.00'),
            has_incremental_pricing=False,
            priority=10
        )

        # Tier 3: 50.01+ kg = 500 BDT + 20 BDT per 1 kg
        ShippingTier.objects.create(
            shipping_method=method,
            pricing_type='weight',
            min_weight=Decimal('50.01'),
            max_weight=None,
            base_price=Decimal('500.00'),
            has_incremental_pricing=True,
            increment_per_unit=Decimal('20.00'),
            increment_unit_size=Decimal('1.0'),
            priority=10
        )

        self.stdout.write(f'Created {method.name} with 3 weight tiers:')
        self.stdout.write('   - Up to 20kg: 150 BDT')
        self.stdout.write('   - 20.01kg to 50kg: 300 BDT')
        self.stdout.write('   - 50.01kg+: 500 BDT + 20 BDT per extra kg')
        
        self.stdout.write('\nSetup completed successfully!')
        self.stdout.write('Note: You can easily change these Taka amounts from the Django Admin Panel.')
