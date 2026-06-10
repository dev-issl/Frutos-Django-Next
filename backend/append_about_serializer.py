import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\serializers.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

from .models import AboutPageContent

class AboutPageContentSerializer(serializers.ModelSerializer):
    hero_image_url_final = serializers.SerializerMethodField()

    class Meta:
        model = AboutPageContent
        fields = ['id', 'hero_section', 'hero_image', 'hero_image_url_final', 'stats', 'values', 'milestones', 'farm_partners', 'team']
        
    def get_hero_image_url_final(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        
        # Fallback to JSON image_url if provided
        hero_section = obj.hero_section or {}
        return hero_section.get('image_url', '')
''')
print("Successfully appended AboutPageContentSerializer")
