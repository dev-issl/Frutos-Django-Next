from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import WholesaleUser
import base64
import json



def _get_payload_unverified(token_str):
    """Signature verify না করে শুধু payload decode করো।"""
    try:
        parts = token_str.split('.')
        if len(parts) != 3:
            return {}
        padded = parts[1] + '=' * (4 - len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(padded))
    except Exception:
        return {}
class WholesaleJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token_str = auth_header.split(' ')[1]
        payload = _get_payload_unverified(token_str)

        # Not a wholesale token — let next authenticator try
        if not payload.get('is_wholesale'):
            return None

        # IS a wholesale token — now validate properly
        try:
            token   = UntypedToken(token_str)
            user_id = payload.get('user_id')
            user    = WholesaleUser.objects.get(pk=user_id)
            if not user.is_active:
                raise AuthenticationFailed('Account is disabled.')
            return (user, token)

        except (InvalidToken, TokenError):
            raise AuthenticationFailed('Token expired. Please log in again.')  # ← was: return None
        except WholesaleUser.DoesNotExist:
            raise AuthenticationFailed('User not found.')  # ← was: return None

    def authenticate_header(self, request):
        return 'Bearer realm="api"'