from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.authentication.serializers import (
    LoginSerializer, RegisterSerializer, RefreshTokenSerializer, UserSerializer
)
from apps.authentication.authentication import generate_tokens
from apps.authentication.models import User


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.validated_data['user']
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
            'store_id': str(user.store_id) if user.store_id else None
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        # In JWT, logout is handled by client-side token deletion
        # Optional: Can implement token blacklist if needed
        return Response({'success': True}, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """Token refresh endpoint"""
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.validated_data['user']
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """Customer registration endpoint"""
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        access_token, refresh_token = generate_tokens(user)

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
