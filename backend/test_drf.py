import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.http import QueryDict
import json
from website.serializers import HomePageContentSerializer

# Simulate request.data.copy()
q = QueryDict('', mutable=True)
q.update({'hero_section': '{}', 'how_it_works': '{}', 'steps': '[{"id": 1}]', 'leftover_banner': '{}'})

print("Before:", repr(q.get('steps')))

for field in ['hero_section', 'how_it_works', 'steps', 'leftover_banner']:
    if field in q and isinstance(q[field], str):
        try:
            q[field] = json.loads(q[field])
        except json.JSONDecodeError:
            pass

print("After:", repr(q.get('steps')))
print("After type:", type(q.get('steps')))

serializer = HomePageContentSerializer(data=q, partial=True)
if not serializer.is_valid():
    print("ERRORS:", serializer.errors)
else:
    print("VALID!")
