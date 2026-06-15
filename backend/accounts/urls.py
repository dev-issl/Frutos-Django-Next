from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from products.views import WishlistListCreateView, WishlistItemDeleteView, WishlistClearView

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('register/',        views.RegisterView.as_view(),       name='auth-register'),
    path('login/',           views.LoginView.as_view(),          name='auth-login'),
    path('logout/',          views.LogoutView.as_view(),         name='auth-logout'),
    path('token/refresh/',   TokenRefreshView.as_view(),         name='token-refresh'),

    # ── Profile ───────────────────────────────────────────────────────────────
    path('profile/',         views.ProfileView.as_view(),        name='auth-profile'),
    path('avatar/',          views.AvatarUploadView.as_view(),   name='auth-avatar'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),

    # ── Addresses ─────────────────────────────────────────────────────────────
    path('addresses/',           views.AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/',  views.AddressDetailView.as_view(),     name='address-detail'),

    # ── Orders (user's own) ───────────────────────────────────────────────────
    path('orders/',              views.UserOrderHistoryView.as_view(),   name='user-orders'),

    # ── Notifications ─────────────────────────────────────────────────────────
    # IMPORTANT: specific paths MUST come before <int:pk> — Django matches top-down
    path('notifications/',               views.NotificationListView.as_view(),    name='notif-list'),
    path('notifications/mark-read/',     views.NotificationMarkReadView.as_view(), name='notif-mark-read'),
    path('notifications/bulk-delete/',   views.NotificationBulkDeleteView.as_view(), name='notif-bulk-delete'),
    path('notifications/unread-count/',  views.UnreadCountView.as_view(),          name='notif-unread-count'),
    path('notifications/stream/',        views.notification_stream,                name='notif-stream'),
    path('notifications/<int:pk>/',      views.NotificationDeleteView.as_view(),   name='notif-delete'),



    path('wishlist/',                    WishlistListCreateView.as_view(),   name='wishlist-list-create'),
    path('wishlist/<uuid:product_id>/',  WishlistItemDeleteView.as_view(),   name='wishlist-item-delete'),
    path('wishlist/clear/',              WishlistClearView.as_view(),        name='wishlist-clear'),



    path('password-reset/send-otp/', views.SendPasswordResetOTPView.as_view(),       name='password-reset-send-otp'),
    path('password-reset/verify/',   views.VerifyOTPAndResetPasswordView.as_view(),  name='password-reset-verify'),



    # Admin user management
    path('admin/users/',         views.AdminUserListView.as_view(),   name='admin-user-list'),
    path('admin/users/create/',  views.AdminUserCreateView.as_view(), name='admin-user-create'),
    path('admin/users/<str:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),

    path('dashboard/admin/', views.AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    
    # ── Support Tickets ───────────────────────────────────────────────────────
    path('tickets/', views.SupportTicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:ticket_id>/reply/', views.SupportTicketReplyView.as_view(), name='ticket-reply'),
    path('tickets/<int:ticket_id>/messages/<int:msg_id>/', views.SupportTicketMessageDetailView.as_view(), name='ticket-message-detail'),
    path('tickets/<int:ticket_id>/typing/', views.SupportTicketTypingView.as_view(), name='ticket-typing'),
    
    path('admin/tickets/', views.AdminSupportTicketListView.as_view(), name='admin-ticket-list'),
    path('admin/tickets/<int:pk>/', views.AdminSupportTicketDetailView.as_view(), name='admin-ticket-detail'),
    path('admin/tickets/<int:ticket_id>/reply/', views.AdminSupportTicketReplyView.as_view(), name='admin-ticket-reply'),
    path('admin/tickets/<int:ticket_id>/messages/<int:msg_id>/', views.AdminSupportTicketMessageDetailView.as_view(), name='admin-ticket-message-detail'),
    path('admin/tickets/<int:ticket_id>/typing/', views.AdminSupportTicketTypingView.as_view(), name='admin-ticket-typing'),
]