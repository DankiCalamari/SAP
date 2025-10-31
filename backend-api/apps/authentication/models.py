import uuid
import bcrypt
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class Store(models.Model):
    """Store model for multi-store support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'stores'


class CustomUserManager(BaseUserManager):
    """Custom user manager for custom User model"""

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser):
    """Custom User model for SAP platform"""
    ROLE_CHOICES = (
        ('cashier', 'Cashier'),
        ('stock_staff', 'Stock Staff'),
        ('manager', 'Store Manager'),
        ('customer', 'Customer'),
        ('admin', 'Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    store_id = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['full_name']

    def set_password(self, raw_password):
        """Hash password using bcrypt"""
        if raw_password:
            self.password_hash = bcrypt.hashpw(
                raw_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

    def check_password(self, raw_password):
        """Check password against bcrypt hash"""
        return bcrypt.checkpw(
            raw_password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['store_id', 'role']),
        ]


class RefreshToken(models.Model):
    """Store refresh tokens for JWT invalidation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token = models.TextField()
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refresh_tokens'
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['expires_at']),
        ]
