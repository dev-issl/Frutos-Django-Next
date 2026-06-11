# accounts/notifications.py
"""
Utility helpers for creating Notification records.
Import this anywhere in the project — no circular imports.
"""

import logging

logger = logging.getLogger(__name__)

STATUS_MESSAGES = {
    'PENDING':    ('Order Placed 🛍️',   'Your order {order_number} has been placed and is awaiting confirmation.'),
    'PROCESSING': ('Order Processing ⚙️', 'Great news! Your order {order_number} is now being processed and packed.'),
    'SHIPPED':    ('Order Shipped 🚚',   'Your order {order_number} is on its way! It has been shipped.'),
    'DELIVERED':  ('Order Delivered ✅', 'Your order {order_number} has been delivered. Enjoy your purchase!'),
    'CANCELLED':  ('Order Cancelled ❌', 'Your order {order_number} has been cancelled. Contact us if you have questions.'),
}


def send_order_status_notification(order):
    """
    Create a Notification record for the order's user (if any) whenever
    the order status changes.

    Safe to call even if the order has no associated user.
    """
    from .models import Notification

    user = order.user
    if user is None:
        return  # guest order — no notification

    status_key = order.status  # e.g. 'SHIPPED'
    title_tpl, msg_tpl = STATUS_MESSAGES.get(
        status_key,
        ('Order Update ', 'Your order {order_number} status has been updated to {status}.'),
    )

    ctx = {
        'order_number': order.order_number,
        'status':       order.get_status_display(),
    }
    
    # Map status to material symbols
    status_icons = {
        'PENDING':    'shopping_bag',
        'PROCESSING': 'inventory_2',
        'SHIPPED':    'local_shipping',
        'DELIVERED':  'check_circle',
        'CANCELLED':  'cancel',
    }
    icon_name = status_icons.get(status_key, 'local_shipping')

    try:
        Notification.objects.create(
            user=user,
            type='order_update',
            title=title_tpl.format(**ctx),
            message=msg_tpl.format(**ctx),
            metadata={
                'orderNumber': order.order_number,
                'status':      order.status,
                'total':       str(order.total_amount),
                'icon':        icon_name,
            },
        )
        logger.info(
            'Notification created for user=%s order=%s status=%s',
            user.id, order.order_number, status_key,
        )
    except Exception as exc:
        logger.error('Failed to create notification: %s', exc)


def send_admin_notification(notification_type, title, message, metadata=None):
    """
    Create a Notification record for all active superusers.
    """
    from django.contrib.auth import get_user_model
    from .models import Notification

    User = get_user_model()
    # Filter for active users who are either superusers OR have user_type='ADMIN'
    from django.db.models import Q
    admins = User.objects.filter(
        Q(is_superuser=True) | Q(user_type='ADMIN'),
        is_active=True
    ).distinct()
    
    if not admins.exists():
        return

    notifications = []
    for admin in admins:
        notifications.append(
            Notification(
                user=admin,
                type=notification_type,
                title=title,
                message=message,
                metadata=metadata or {}
            )
        )
    
    try:
        Notification.objects.bulk_create(notifications)
        logger.info('Admin notifications created: type=%s count=%d', notification_type, len(notifications))
    except Exception as exc:
        logger.error('Failed to bulk create admin notifications: %s', exc)
