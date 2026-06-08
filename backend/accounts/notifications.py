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
        ('Order Update 📦', 'Your order {order_number} status has been updated to {status}.'),
    )

    ctx = {
        'order_number': order.order_number,
        'status':       order.get_status_display(),
    }

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
            },
        )
        logger.info(
            'Notification created for user=%s order=%s status=%s',
            user.id, order.order_number, status_key,
        )
    except Exception as exc:
        logger.error('Failed to create notification: %s', exc)
