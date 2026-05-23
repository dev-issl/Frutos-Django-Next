# orders/urls.py (সংশোধিত অংশ)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, ShippingMethodViewSet, OrderPaymentViewSet, ShippingMethodListAPIView, 
    CouponViewSet, PaymentAccountsAPIView, ShippingCategoryViewSet, FreeShippingRuleViewSet,
    ShippingTierViewSet,
    analyze_cart_shipping, enhanced_checkout_calculation, debug_orders_api,
    order_invoice
)

# Create router for ViewSets
router = DefaultRouter()

# ── FIX: প্রিফিক্স 'orders' পরিবর্তন করে খালি স্ট্রিং '' দেওয়া হয়েছে ──
# এর ফলে এটি মূল backend/urls.py এর 'api/orders/' পাথের সাথে সরাসরি যুক্ত হবে
router.register(r'', OrderViewSet, basename='order')

router.register(r'order-payments', OrderPaymentViewSet, basename='order-payment')
router.register(r'shipping-methods', ShippingMethodViewSet, basename='shipping-method')
router.register(r'shipping-categories', ShippingCategoryViewSet, basename='shipping-category')
router.register(r'shipping-tiers', ShippingTierViewSet, basename='shipping-tier')
router.register(r'free-shipping-rules', FreeShippingRuleViewSet, basename='free-shipping-rule')
router.register(r'coupons', CouponViewSet, basename='coupon')

app_name = 'orders'

urlpatterns = [ 
    # Order-related API endpoints
    path('', include(router.urls)),
    
    # Additional API endpoints
    path('shipping-methods-list/', ShippingMethodListAPIView.as_view(), name='shipping-methods-list'),
    path('payment/accounts/', PaymentAccountsAPIView.as_view(), name='payment-accounts'),
    
    # Advanced shipping and checkout endpoints
    path('analyze-cart-shipping/', analyze_cart_shipping, name='analyze-cart-shipping'),
    path('enhanced-checkout-calculation/', enhanced_checkout_calculation, name='enhanced-checkout-calculation'),
    
    # Debug endpoint
    path('debug/', debug_orders_api, name='debug-orders'),
    
    # Invoice
    path('invoice/<str:order_number>/', order_invoice, name='order-invoice'),
]