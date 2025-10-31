from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.loyalty.models import Customer, Discount, Layaway, LayawayItem
from apps.loyalty.serializers import CustomerSerializer, DiscountSerializer, LayawaySerializer
from apps.authentication.permissions import IsManager
from datetime import date


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for customer loyalty management"""
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomerSerializer
    search_fields = ('phone', 'email', 'full_name')
    ordering_fields = ('created_at', 'total_spent', 'loyalty_points')

    def get_queryset(self):
        """Filter customers by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Customer.objects.all()
        return Customer.objects.filter(store_id=store_id)

    def perform_create(self, serializer):
        """Assign store from user"""
        serializer.save(store_id=self.request.user.store_id)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search customer by phone or email"""
        phone = request.query_params.get('phone')
        email = request.query_params.get('email')
        store_id = request.user.store_id

        if not phone and not email:
            return Response(
                {'error': 'Either phone or email parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        query = Customer.objects.filter(store_id=store_id)

        if phone:
            # Support both exact and partial search
            query = query.filter(phone__icontains=phone)

        if email:
            query = query.filter(email__iexact=email)

        serializer = CustomerSerializer(query, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)

    @action(detail='pk', methods=['get'])
    def loyalty_status(self, request, pk=None):
        """Get customer loyalty status"""
        try:
            customer = Customer.objects.get(id=pk, store_id=request.user.store_id)
        except Customer.DoesNotExist:
            return Response(
                {'error': 'Customer not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'customer_id': str(customer.id),
            'phone': customer.phone,
            'name': customer.full_name,
            'loyalty_points': customer.loyalty_points,
            'lifetime_spent': float(customer.total_spent),
            'member_since': customer.created_at.isoformat()
        }, status=status.HTTP_200_OK)


class DiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for discount management"""
    permission_classes = (IsAuthenticated,)
    serializer_class = DiscountSerializer
    filterset_fields = ('discount_type', 'is_active')
    search_fields = ('name', 'code')
    ordering_fields = ('created_at', 'start_date')

    def get_queryset(self):
        """Filter discounts by user's store"""
        store_id = self.request.user.store_id
        if self.request.user.role == 'admin':
            return Discount.objects.all()
        return Discount.objects.filter(store_id=store_id)

    def perform_create(self, serializer):
        """Assign store from user"""
        if self.request.user.role not in ('manager', 'admin'):
            raise PermissionError('Only managers can create discounts')
        serializer.save(store_id=self.request.user.store_id)

    def create(self, request, *args, **kwargs):
        """Override create to check permissions"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can create discounts'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Override update to check permissions"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can update discounts'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to soft-delete discounts"""
        if request.user.role not in ('manager', 'admin'):
            return Response(
                {'error': 'Only managers can delete discounts'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        instance.is_active = False
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get currently available discounts"""
        today = date.today()
        store_id = request.user.store_id

        discounts = Discount.objects.filter(
            store_id=store_id,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        )

        # Filter out discounts that have exceeded max uses
        available = [d for d in discounts if d.max_uses is None or d.times_used < d.max_uses]

        serializer = DiscountSerializer(available, many=True)
        return Response({'results': serializer.data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate discount code and calculate discount amount"""
        code = request.data.get('code') or request.data.get('discount_code')
        product_ids = request.data.get('product_ids', [])
        subtotal = float(request.data.get('subtotal', 0))

        if not code:
            return Response(
                {'error': 'Discount code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            discount = Discount.objects.get(
                code=code,
                store_id=request.user.store_id,
                is_active=True
            )
        except Discount.DoesNotExist:
            return Response({
                'valid': False,
                'message': 'Discount code not found or expired'
            }, status=status.HTTP_200_OK)

        # Check dates
        today = date.today()
        if discount.start_date > today or discount.end_date < today:
            return Response({
                'valid': False,
                'message': 'Discount code expired'
            }, status=status.HTTP_200_OK)

        # Check max uses
        if discount.max_uses and discount.times_used >= discount.max_uses:
            return Response({
                'valid': False,
                'message': 'Discount limit exceeded'
            }, status=status.HTTP_200_OK)

        # Calculate discount amount
        if discount.discount_type == 'percentage':
            discount_amount = subtotal * (discount.discount_value / 100)
        elif discount.discount_type == 'fixed_amount':
            discount_amount = min(float(discount.discount_value), subtotal)
        else:
            discount_amount = 0

        return Response({
            'valid': True,
            'discount_code': code,
            'discount_type': discount.discount_type,
            'discount_amount': float(discount_amount)
        }, status=status.HTTP_200_OK)


class LayawayViewSet(viewsets.ModelViewSet):
    """ViewSet for layaway management"""
    permission_classes = (IsAuthenticated,)
    serializer_class = LayawaySerializer
    filterset_fields = ('status', 'customer_id')
    ordering_fields = ('created_at', 'due_date')

    def get_queryset(self):
        """Filter layaways by user's store"""
        store_id = request.user.store_id
        if request.user.role == 'admin':
            return Layaway.objects.all()
        return Layaway.objects.filter(store_id=store_id)
