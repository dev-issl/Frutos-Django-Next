# # orders/urls.py (সংশোধিত অংশ)
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import (
#     OrderViewSet, ShippingMethodViewSet, OrderPaymentViewSet, ShippingMethodListAPIView, 
#     CouponViewSet, PaymentAccountsAPIView, ShippingCategoryViewSet, FreeShippingRuleViewSet,
#     ShippingTierViewSet,
#     analyze_cart_shipping, enhanced_checkout_calculation, debug_orders_api,
#     order_invoice
# )

# # Create router for ViewSets
# router = DefaultRouter()

# # ── FIX: প্রিফিক্স 'orders' পরিবর্তন করে খালি স্ট্রিং '' দেওয়া হয়েছে ──
# # এর ফলে এটি মূল backend/urls.py এর 'api/orders/' পাথের সাথে সরাসরি যুক্ত হবে
# router.register(r'', OrderViewSet, basename='order')

# router.register(r'order-payments', OrderPaymentViewSet, basename='order-payment')
# router.register(r'shipping-methods', ShippingMethodViewSet, basename='shipping-method')
# router.register(r'shipping-categories', ShippingCategoryViewSet, basename='shipping-category')
# router.register(r'shipping-tiers', ShippingTierViewSet, basename='shipping-tier')
# router.register(r'free-shipping-rules', FreeShippingRuleViewSet, basename='free-shipping-rule')
# router.register(r'coupons', CouponViewSet, basename='coupon')

# app_name = 'orders'

# urlpatterns = [ 
#     # Order-related API endpoints
#     path('', include(router.urls)),
    
#     # Additional API endpoints
#     path('shipping-methods-list/', ShippingMethodListAPIView.as_view(), name='shipping-methods-list'),
#     path('payment/accounts/', PaymentAccountsAPIView.as_view(), name='payment-accounts'),
    
#     # Advanced shipping and checkout endpoints
#     path('analyze-cart-shipping/', analyze_cart_shipping, name='analyze-cart-shipping'),
#     path('enhanced-checkout-calculation/', enhanced_checkout_calculation, name='enhanced-checkout-calculation'),
    
#     # Debug endpoint
#     path('debug/', debug_orders_api, name='debug-orders'),
    
#     # Invoice
#     path('invoice/<str:order_number>/', order_invoice, name='order-invoice'),
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet, ShippingMethodViewSet, OrderPaymentViewSet,
    ShippingMethodListAPIView, CouponViewSet, PaymentAccountsAPIView,
    ShippingCategoryViewSet, FreeShippingRuleViewSet, ShippingTierViewSet,
    analyze_cart_shipping, enhanced_checkout_calculation,
    debug_orders_api, order_invoice,
)

from .basket_views import (
    BasketAPIView, BasketItemAPIView, BasketItemDetailAPIView
)
from .checkout_views import (
    CheckoutDeliveryAddressAPIView, CheckoutDeliveryWindowAPIView,
    CheckoutApplyCouponAPIView, CheckoutPaymentMethodAPIView,
    CheckoutSummaryAPIView, CheckoutConfirmAPIView, CheckoutCancelAPIView
)

router = DefaultRouter()

# ← Order last এ register করো — নইলে সব route capture করে
router.register(r'order-payments',      OrderPaymentViewSet,      basename='order-payment')
router.register(r'shipping-methods',    ShippingMethodViewSet,    basename='shipping-method')
router.register(r'shipping-categories', ShippingCategoryViewSet,  basename='shipping-category')
router.register(r'shipping-tiers',      ShippingTierViewSet,      basename='shipping-tier')
router.register(r'free-shipping-rules', FreeShippingRuleViewSet,  basename='free-shipping-rule')
router.register(r'coupons',             CouponViewSet,            basename='coupon')

# New Shipping System ViewSets
from .shipping_views import (
    ShippingZoneViewSet, WeightShippingRuleViewSet, OrderValueShippingRuleViewSet,
    CategoryShippingRuleViewSet as NewCategoryShippingRuleViewSet,
    CourierProviderViewSet, WarehouseViewSet, LeftoverPackShippingRuleViewSet,
)
router.register(r'shipping-zones', ShippingZoneViewSet, basename='shipping-zone')
router.register(r'weight-shipping-rules', WeightShippingRuleViewSet, basename='weight-shipping-rule')
router.register(r'order-value-shipping-rules', OrderValueShippingRuleViewSet, basename='order-value-shipping-rule')
router.register(r'new-category-shipping-rules', NewCategoryShippingRuleViewSet, basename='new-category-shipping-rule')
router.register(r'courier-providers', CourierProviderViewSet, basename='courier-provider')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'leftover-pack-shipping-rules', LeftoverPackShippingRuleViewSet, basename='leftover-pack-shipping-rule')

router.register(r'',                    OrderViewSet,             basename='order')  # ← সবার শেষে

app_name = 'orders'

from .shipping_views import calculate_shipping_v2, detect_zone_api, free_shipping_check

urlpatterns = [
    path('shipping-methods-list/',          ShippingMethodListAPIView.as_view(),    name='shipping-methods-list'),
    path('payment/accounts/',               PaymentAccountsAPIView.as_view(),       name='payment-accounts'),
    path('analyze-cart-shipping/',          analyze_cart_shipping,                  name='analyze-cart-shipping'),
    path('enhanced-checkout-calculation/',  enhanced_checkout_calculation,          name='enhanced-checkout-calculation'),
    
    # New Shipping System API endpoints
    path('shipping/calculate/',             calculate_shipping_v2,                  name='shipping-calculate-v2'),
    path('shipping/detect-zone/',           detect_zone_api,                        name='shipping-detect-zone'),
    path('shipping/free-shipping-check/',   free_shipping_check,                    name='shipping-free-check'),

    # Basket endpoints
    path('basket/', BasketAPIView.as_view(), name='basket'),
    path('basket/items/', BasketItemAPIView.as_view(), name='basket-items'),
    path('basket/items/<int:item_id>/', BasketItemDetailAPIView.as_view(), name='basket-item-detail'),
    
    # Checkout endpoints
    path('checkout/delivery-address/', CheckoutDeliveryAddressAPIView.as_view(), name='checkout-delivery-address'),
    path('checkout/delivery-window/', CheckoutDeliveryWindowAPIView.as_view(), name='checkout-delivery-window'),
    path('checkout/apply-coupon/', CheckoutApplyCouponAPIView.as_view(), name='checkout-apply-coupon'),
    path('checkout/payment-method/', CheckoutPaymentMethodAPIView.as_view(), name='checkout-payment-method'),
    path('checkout/summary/', CheckoutSummaryAPIView.as_view(), name='checkout-summary'),
    path('checkout/confirm/', CheckoutConfirmAPIView.as_view(), name='checkout-confirm'),
    path('checkout/cancel/', CheckoutCancelAPIView.as_view(), name='checkout-cancel'),

    path('debug/',                          debug_orders_api,                       name='debug-orders'),
    path('invoice/<str:order_number>/',     order_invoice,                          name='order-invoice'),
    
    # Include router urls at the very end to prevent the empty prefix (r'') from catching other valid paths
    path('', include(router.urls)),
]