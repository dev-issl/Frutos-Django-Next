import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\views.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

from .models import HomePageContent
from .serializers import HomePageContentSerializer

class HomePageContentViewSet(viewsets.ModelViewSet):
    """API for Home Page Content (Singleton)"""
    serializer_class = HomePageContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return HomePageContent.objects.all()
    
    def list(self, request, *args, **kwargs):
        instance, created = HomePageContent.objects.get_or_create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
        
    def retrieve(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        instance, created = HomePageContent.objects.get_or_create()
        data = request.data.copy()
        
        # Handle file uploads if they exist in the request
        if 'hero_image_desktop' in request.FILES:
            data['hero_image_desktop'] = request.FILES['hero_image_desktop']
        if 'hero_image_mobile' in request.FILES:
            data['hero_image_mobile'] = request.FILES['hero_image_mobile']
        if 'leftover_banner_image' in request.FILES:
            data['leftover_banner_image'] = request.FILES['leftover_banner_image']
            
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
''')
print("Successfully appended HomePageContentViewSet")
