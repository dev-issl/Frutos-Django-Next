from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CheckoutSession, Order, OrderItem
from .basket_views import get_basket_from_request
from .serializers import CheckoutSessionSerializer
from products.models import Product

def get_checkout_session(request):
    basket = get_basket_from_request(request)
    checkout_session, created = CheckoutSession.objects.get_or_create(basket=basket)
    return checkout_session

class CheckoutDeliveryAddressAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        serializer = CheckoutSessionSerializer(checkout_session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckoutDeliveryWindowAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        # We only update delivery_date and delivery_slot_label
        data = {
            'delivery_date': request.data.get('delivery_date'),
            'delivery_slot_label': request.data.get('delivery_slot_label')
        }
        serializer = CheckoutSessionSerializer(checkout_session, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckoutApplyCouponAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        coupon_code = request.data.get('coupon_code', '')
        
        # Here you would typically validate the coupon code
        # against the Coupon model. For simplicity in the design:
        checkout_session.coupon_code = coupon_code
        checkout_session.save()
        
        return Response({'message': 'Coupon applied', 'coupon_code': coupon_code})

class CheckoutPaymentMethodAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        payment_method = request.data.get('payment_method')
        
        if payment_method:
            checkout_session.payment_method = payment_method
            checkout_session.save()
            return Response({'message': 'Payment method saved', 'payment_method': payment_method})
        return Response({"error": "payment_method is required"}, status=status.HTTP_400_BAD_REQUEST)

class CheckoutSummaryAPIView(APIView):
    def get(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        basket = checkout_session.basket
        
        subtotal = basket.get_subtotal
        # Placeholder for shipping cost logic, assuming free for now
        shipping = 0
        total = subtotal + shipping
        
        return Response({
            'session': CheckoutSessionSerializer(checkout_session).data,
            'basket_items': basket.items.count(),
            'subtotal': subtotal,
            'shipping': shipping,
            'total': total
        })

class CheckoutConfirmAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        basket = checkout_session.basket
        
        if not basket.items.exists():
            return Response({"error": "Basket is empty"}, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. Create the Order
        subtotal = basket.get_subtotal
        
        order = Order.objects.create(
            user=basket.user,
            total_amount=subtotal, # + shipping - discount
            cart_subtotal=subtotal,
            original_subtotal=subtotal,
            status='PENDING',
            payment_status='PENDING',
            
            customer_name=checkout_session.full_name or "Guest",
            customer_email=checkout_session.email_address,
            customer_phone=checkout_session.phone_number,
            
            street_address=checkout_session.street_address,
            city=checkout_session.city,
            postcode=checkout_session.postcode,
            
            delivery_date=checkout_session.delivery_date,
            delivery_slot_label=checkout_session.delivery_slot_label,
            payment_method=checkout_session.payment_method
        )
        
        # 2. Create Order Items
        for basket_item in basket.items.all():
            OrderItem.objects.create(
                order=order,
                product=basket_item.product,
                quantity=basket_item.quantity,
                unit_price=basket_item.get_cost() / basket_item.quantity if basket_item.quantity > 0 else 0
            )
            
        # 3. Clear the basket
        basket.items.all().delete()
        checkout_session.delete()
        
        return Response({
            "status": "success",
            "message": "Order placed successfully",
            "order_id": order.order_number,
            "total_amount": order.total_amount
        })

class CheckoutCancelAPIView(APIView):
    def post(self, request, *args, **kwargs):
        checkout_session = get_checkout_session(request)
        checkout_session.delete()
        return Response({"message": "Checkout session cleared"})
