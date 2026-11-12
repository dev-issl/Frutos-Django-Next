from django.core.management.base import BaseCommand
from website.models import HomePageContent


class Command(BaseCommand):
    help = "Populate or update HomePageContent Customer Reviews (testimonials) and FAQs for Why Choose El Arbol."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite existing testimonials and faqs with default El Arbol content.',
        )

    def handle(self, *args, **options):
        force = options['force']
        instance = HomePageContent.objects.first()
        default_testimonials = HomePageContent.default_testimonials()
        default_faqs = HomePageContent.default_faqs()

        if instance is None:
            HomePageContent.objects.create(
                testimonials=default_testimonials,
                faqs=default_faqs,
            )
            self.stdout.write(self.style.SUCCESS("Created HomePageContent with default testimonials and FAQs."))
            return

        updated_fields = []
        if force or not instance.testimonials:
            instance.testimonials = default_testimonials
            updated_fields.append('testimonials')
        if force or not instance.faqs:
            instance.faqs = default_faqs
            updated_fields.append('faqs')

        if updated_fields:
            instance.save(update_fields=updated_fields)
            self.stdout.write(
                self.style.SUCCESS(f"Updated HomePageContent fields: {', '.join(updated_fields)}")
            )
        else:
            self.stdout.write(self.style.WARNING("Testimonials and FAQs already populated. Pass --force to overwrite."))

