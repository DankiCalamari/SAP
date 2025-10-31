from rest_framework import serializers
from apps.authentication.models import User
import re


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role', 'store_id', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint"""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError('Username and password are required')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')

        data['user'] = user
        return data


class RegisterSerializer(serializers.Serializer):
    """Serializer for customer registration"""
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=255)

    def validate_phone(self, value):
        """Validate phone number format"""
        if len(value) < 10:
            raise serializers.ValidationError('Phone number must be at least 10 digits')

        if not re.match(r'^[\d\-\+\s]+$', value):
            raise serializers.ValidationError('Invalid phone number format')

        # Check if phone already exists
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Phone number already registered')

        return value

    def validate_email(self, value):
        """Validate email is unique if provided"""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        """Create new customer user"""
        user = User(
            username=validated_data['phone'],
            email=validated_data.get('email') or None,
            full_name=validated_data['full_name'],
            role='customer'
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer for token refresh endpoint"""
    refresh_token = serializers.CharField()

    def validate(self, data):
        refresh_token = data.get('refresh_token')

        import jwt
        from django.conf import settings

        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise serializers.ValidationError('Refresh token has expired')
        except jwt.InvalidTokenError:
            raise serializers.ValidationError('Invalid refresh token')

        if payload.get('type') != 'refresh':
            raise serializers.ValidationError('Invalid token type')

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found')

        if not user.is_active:
            raise serializers.ValidationError('User is inactive')

        data['user'] = user
        return data
