from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user(validated_token):
    try:
        user = User.objects.get(id=validated_token["user_id"])
        return user
    except User.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Extract the token from the query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                # This will raise an exception if the token is invalid
                UntypedToken(token)
                
                # Decode the token payload
                decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                scope['user'] = await get_user(decoded_data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"WebSocket token auth failed: {e}")
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        # Call the inner application
        return await self.inner(scope, receive, send)
