import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\serializers.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

from .models import HomePageContent

class HomePageContentSerializer(serializers.ModelSerializer):
    hero_image_desktop_url = serializers.SerializerMethodField()
    hero_image_mobile_url = serializers.SerializerMethodField()
    leftover_banner_image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomePageContent
        fields = [
            'id', 'hero_section', 'how_it_works', 'steps', 'leftover_banner',
            'hero_image_desktop', 'hero_image_mobile', 'leftover_banner_image',
            'hero_image_desktop_url', 'hero_image_mobile_url', 'leftover_banner_image_url'
        ]
        
    def _get_absolute_url(self, file_field):
        if file_field:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(file_field.url)
            return file_field.url
        return ''
        
    def get_hero_image_desktop_url(self, obj):
        return self._get_absolute_url(obj.hero_image_desktop)

    def get_hero_image_mobile_url(self, obj):
        return self._get_absolute_url(obj.hero_image_mobile)

    def get_leftover_banner_image_url(self, obj):
        return self._get_absolute_url(obj.leftover_banner_image)
''')
print("Successfully appended HomePageContentSerializer")
