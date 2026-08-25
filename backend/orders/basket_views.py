from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Basket, BasketItem
from products.models import Product
from .serializers import BasketSerializer, BasketItemSerializer
from django.shortcuts import get_object_or_404
import uuid

def get_basket_from_request(request):
    """
    Helper function to get or create a basket.
    Looks for a logged-in user first.
    If guest, looks for 'X-Session-ID' in headers.
    """
    if request.user.is_authenticated:
        basket, created = Basket.objects.get_or_create(user=request.user)
        return basket
    else:
        # Get from headers
        session_id_str = request.META.get('HTTP_X_SESSION_ID')
        if not session_id_str:
            # If no session ID provided, create one and return it in the response later,
            # but for now we create a new basket.
            basket = Basket.objects.create()
            return basket
            
        try:
            session_uuid = uuid.UUID(session_id_str)
            basket, created = Basket.objects.get_or_create(session_id=session_uuid, user__isnull=True)
            return basket
        except ValueError:
            # Invalid UUID
            return Basket.objects.create()

class BasketAPIView(APIView):
    """
    GET: Retrieve current basket
    """
    def get(self, request, *args, **kwargs):
        basket = get_basket_from_request(request)
        serializer = BasketSerializer(basket)
        response = Response(serializer.data)
        # Ensure client knows the session ID
        response['X-Session-ID'] = str(basket.session_id)
        return response

class BasketItemAPIView(APIView):
    """
    POST: Add item to basket
    """
    def post(self, request, *args, **kwargs):
        basket = get_basket_from_request(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        product = get_object_or_404(Product, id=product_id)
        
        # Check if item already in basket
        basket_item, created = BasketItem.objects.get_or_create(
            basket=basket,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            # Update quantity
            basket_item.quantity += quantity
            basket_item.save()
            
        serializer = BasketItemSerializer(basket_item)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        response['X-Session-ID'] = str(basket.session_id)
        return response

class BasketItemDetailAPIView(APIView):
    """
    PUT: Update item quantity
    DELETE: Remove item from basket
    """
    def put(self, request, item_id, *args, **kwargs):
        basket = get_basket_from_request(request)
        basket_item = get_object_or_404(BasketItem, id=item_id, basket=basket)
        
        quantity = request.data.get('quantity')
        if quantity is not None:
            try:
                quantity = int(quantity)
                if quantity <= 0:
                    basket_item.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                else:
                    basket_item.quantity = quantity
                    basket_item.save()
            except ValueError:
                return Response({"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST)
                
        serializer = BasketItemSerializer(basket_item)
        return Response(serializer.data)

    def delete(self, request, item_id, *args, **kwargs):
        basket = get_basket_from_request(request)
        basket_item = get_object_or_404(BasketItem, id=item_id, basket=basket)
        basket_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
