import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\models.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

class HomePageContent(models.Model):
    """Singleton model for the public Home Page content"""
    hero_section = models.JSONField(default=dict, blank=True)
    how_it_works = models.JSONField(default=dict, blank=True)
    steps = models.JSONField(default=list, blank=True)
    leftover_banner = models.JSONField(default=dict, blank=True)
    
    hero_image_desktop = models.ImageField(upload_to='homepage/hero/', blank=True, null=True)
    hero_image_mobile = models.ImageField(upload_to='homepage/hero/', blank=True, null=True)
    leftover_banner_image = models.ImageField(upload_to='homepage/leftover/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Home Page Content"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and HomePageContent.objects.exists():
            return HomePageContent.objects.first()
        return super().save(*args, **kwargs)
''')
print("Successfully appended HomePageContent")
