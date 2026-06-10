import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\models.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

class AboutPageContent(BaseModel):
    """Singleton model for the About Us page content"""
    # The default data structures map to the frontend FALLBACK data
    
    def default_hero():
        return {
            'badge': 'Our story',
            'title': 'Rooted in quality,<br /><em style="font-style: italic; color: #00694c">growing for the future.</em>',
            'image_url': ''
        }
    
    def default_stats():
        return [
            {'value': '6+', 'label': 'Years of service'},
            {'value': '40+', 'label': 'Local farm partners'},
            {'value': '8', 'label': 'Store locations'},
            {'value': '98%', 'label': 'Customer satisfaction'},
        ]
        
    def default_values():
        return [
            {'icon_name': 'Leaf', 'title': 'Rooted in sustainability', 'body': 'Every product we source follows strict environmental criteria.'},
            {'icon_name': 'Users', 'title': 'Community first', 'body': 'We believe in fair prices for farmers and fair prices for customers.'},
            {'icon_name': 'Award', 'title': 'Uncompromising quality', 'body': 'From harvest to doorstep in under 48 hours.'},
            {'icon_name': 'MapPin', 'title': 'Transparent provenance', 'body': 'Every product carries a story — the farm, the region, the farmer.'},
        ]
        
    def default_milestones():
        return [
            {'year': '2018', 'event': 'Founded in Madrid with three farm partners and a single market stall.'},
            {'year': '2019', 'event': 'Opened our first physical store in Chamberí; launched home delivery across Madrid.'},
            {'year': '2021', 'event': 'Expanded to Barcelona and Sevilla; introduced the Leftover Pack programme.'},
            {'year': '2023', 'event': 'Reached 40 partner farms across Spain; launched the El Árbol digital platform.'},
            {'year': '2024', 'event': '8 store locations, 50,000+ happy customers, and still growing.'},
        ]
        
    def default_farm_partners():
        return [
            {'name': 'Hacienda del Sol', 'region': 'Almería', 'specialty': 'Heirloom tomatoes & peppers'},
            {'name': 'Finca La Paloma', 'region': 'Huelva', 'specialty': 'Strawberries & stone fruit'},
            {'name': 'Rancho Verde', 'region': 'Murcia', 'specialty': 'Avocados & citrus'},
            {'name': 'Serra dei Fiori', 'region': 'Liguria', 'specialty': 'Fresh herbs & greens'},
            {'name': 'Huerta La Vega', 'region': 'Murcia', 'specialty': 'Spinach & root vegetables'},
            {'name': 'Les Herbes du Midi', 'region': 'Provence', 'specialty': 'Wild-harvested herbs'},
        ]
        
    def default_team():
        return [
            {'name': 'Sofía Martínez', 'role': 'Co-founder & CEO', 'initials': 'SM', 'origin': 'Madrid'},
            {'name': 'Lucas Ferreira', 'role': 'Co-founder & Head of Sourcing', 'initials': 'LF', 'origin': 'Porto'},
            {'name': 'Ana Delgado', 'role': 'Head of Operations', 'initials': 'AD', 'origin': 'Sevilla'},
            {'name': 'Tomás Ruiz', 'role': 'Head of Technology', 'initials': 'TR', 'origin': 'Barcelona'},
        ]

    stats = models.JSONField(default=default_stats, help_text="List of stats objects {value, label}")
    values = models.JSONField(default=default_values, help_text="List of value objects {icon_name, title, body}")
    milestones = models.JSONField(default=default_milestones, help_text="List of timeline milestone objects {year, event}")
    farm_partners = models.JSONField(default=default_farm_partners, help_text="List of farm partners {name, region, specialty}")
    team = models.JSONField(default=default_team, help_text="List of team members {name, role, initials, origin}")
    hero_section = models.JSONField(default=default_hero, help_text="Hero section data {badge, title, image_url}")
    hero_image = models.ImageField(upload_to='about/', null=True, blank=True, help_text="Upload image for hero section (overrides image_url in JSON)")

    class Meta:
        verbose_name = "About Page Content"
        verbose_name_plural = "About Page Content"

    def __str__(self):
        return "About Page Content"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and AboutPageContent.objects.exists():
            return AboutPageContent.objects.first()
        return super().save(*args, **kwargs)
''')
print("Successfully appended AboutPageContent")
