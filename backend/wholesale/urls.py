# wholesale/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WholesaleRegisterView,
    WholesaleLoginView,
    WholesaleTokenRefreshView,
    WholesaleProfileView,
    WholesaleProfileImageView,
    ChangePasswordView,
    WholesaleNotificationListView,
    WholesaleNotificationUnreadCountView,
    WholesaleMarkNotificationsReadView,
    WholesaleNotificationDeleteView,  
    WholesaleDailyReportListCreateView,
    WholesaleStatusView,
    WholesaleSendPasswordResetOTPView,
    WholesaleVerifyOTPAndResetPasswordView,
    WholesalePageContentViewSet,
    wholesale_page_content,
    FixDBView,
    WholesaleSupportTicketListCreateView,
    WholesaleSupportTicketDetailView,
    WholesaleSupportTicketReplyView,
    WholesaleSupportTicketMessageDetailView,
    WholesaleSupportTicketTypingView,
)

router = DefaultRouter()
router.register(r'page-content', WholesalePageContentViewSet, basename='wholesale-page-content')

app_name = 'wholesale'

urlpatterns = [
    path('', include(router.urls)),

    # ─── Auth ────────────────────────────────────────────────
    # DB Fix endpoint
    path('fix-db/', FixDBView.as_view(), name='fix-db'),
    
    # Auth endpoints
    path('auth/register/',        WholesaleRegisterView.as_view(),       name='register'),
    path('auth/login/',           WholesaleLoginView.as_view(),          name='login'),
    path('auth/refresh/',         WholesaleTokenRefreshView.as_view(),   name='token-refresh'),
    path('auth/change-password/', ChangePasswordView.as_view(),          name='change-password'),

    # ─── Profile ──────────────────────────────────────────────
    path('profile/',       WholesaleProfileView.as_view(),      name='profile'),
    path('profile/image/', WholesaleProfileImageView.as_view(), name='wholesale-profile-image'),

    # ─── Notifications ────────────────────────────────────────
    path('notifications/',               WholesaleNotificationListView.as_view(),        name='notifications'),
    path('notifications/unread-count/',  WholesaleNotificationUnreadCountView.as_view(), name='notifications-count'),
    path('notifications/mark-read/',     WholesaleMarkNotificationsReadView.as_view(),   name='notifications-mark-read'),
    path('notifications/<int:pk>/delete/', WholesaleNotificationDeleteView.as_view(),    name='notification-delete'),  # ✅ নতুন

    # ─── Daily Reports ────────────────────────────────────────
    path('daily-reports/', WholesaleDailyReportListCreateView.as_view(), name='daily-reports'),

    # ─── Misc ─────────────────────────────────────────────────
    path('status/', WholesaleStatusView.as_view(), name='status'),

    # ─── Password Reset ───────────────────────────────────────
    path('auth/password-reset/send-otp/', WholesaleSendPasswordResetOTPView.as_view(),      name='ws-password-reset-send'),
    path('auth/password-reset/verify/',   WholesaleVerifyOTPAndResetPasswordView.as_view(), name='ws-password-reset-verify'),

    # ─── Support Tickets ──────────────────────────────────────
    path('tickets/', WholesaleSupportTicketListCreateView.as_view(), name='tickets'),
    path('tickets/<int:pk>/', WholesaleSupportTicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<int:ticket_id>/reply/', WholesaleSupportTicketReplyView.as_view(), name='tickets-reply'),
    path('tickets/<int:ticket_id>/messages/<int:msg_id>/', WholesaleSupportTicketMessageDetailView.as_view(), name='tickets-message'),
    path('tickets/<int:ticket_id>/typing/', WholesaleSupportTicketTypingView.as_view(), name='tickets-typing'),


     # Single combined endpoint — Next.js server component uses this (GET only for backwards compat or public)
    path("content/",    wholesale_page_content, name="page-content"),
]