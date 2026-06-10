import os

file_path = r'd:\Munna\Munna\icommerce\icommerce\backend\website\views.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

from .serializers import AboutPageContentSerializer

class AboutPageContentViewSet(viewsets.ModelViewSet):
    """API for About Page Content (Singleton)"""
    serializer_class = AboutPageContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return AboutPageContent.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Always return the single instance
        instance, created = AboutPageContent.objects.get_or_create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
        
    def retrieve(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        instance, created = AboutPageContent.objects.get_or_create()
        data = request.data.copy()
        
        # Handle team member images inside JSON array
        team_data = data.get('team')
        if team_data:
            import json
            try:
                team = json.loads(team_data)
                for i in range(len(team)):
                    file_key = f'team_image_{i}'
                    if file_key in request.FILES:
                        image = request.FILES[file_key]
                        from django.core.files.storage import default_storage
                        import uuid
                        ext = image.name.split('.')[-1]
                        filename = f"about/team_{uuid.uuid4().hex}.{ext}"
                        path = default_storage.save(filename, image)
                        team[i]['image_url'] = request.build_absolute_uri(default_storage.url(path))
                data['team'] = json.dumps(team)
            except Exception as e:
                pass

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
''')
print("Successfully appended AboutPageContentViewSet")
