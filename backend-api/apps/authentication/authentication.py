import jwt
import datetime
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from apps.authentication.models import User


class JWTAuthentication(BaseAuthentication):
    """Custom JWT authentication for SAP platform"""

    def authenticate(self, request):
        """Authenticate request using JWT token"""
        auth_header = request.META.get('HTTP_AUTHORIZATION')

        if not auth_header:
            return None

        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                raise AuthenticationFailed('Invalid authentication header format')
        except ValueError:
            raise AuthenticationFailed('Invalid authentication header')

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')

        if not user.is_active:
            raise AuthenticationFailed('User is inactive')

        return (user, None)

    def authenticate_header(self, request):
        return 'Bearer'


def generate_tokens(user):
    """Generate access and refresh tokens for user"""
    now = datetime.datetime.utcnow()

    # Access token
    access_payload = {
        'user_id': str(user.id),
        'username': user.username,
        'role': user.role,
        'store_id': str(user.store_id) if user.store_id else None,
        'exp': now + datetime.timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        'iat': now,
        'type': 'access'
    }

    access_token = jwt.encode(
        access_payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    # Refresh token
    refresh_payload = {
        'user_id': str(user.id),
        'exp': now + datetime.timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        'iat': now,
        'type': 'refresh'
    }

    refresh_token = jwt.encode(
        refresh_payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return access_token, refresh_token
