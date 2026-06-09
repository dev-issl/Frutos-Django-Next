from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


# ─── UserProfile 

class UserProfile(models.Model):
    user         = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    avatar       = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_url   = models.URLField(blank=True)
    phone        = models.CharField(max_length=50, blank=True)
    bio          = models.TextField(blank=True)

    # Notification preferences
    notif_order_updates  = models.BooleanField(default=True)
    notif_promotions     = models.BooleanField(default=True)
    notif_price_changes  = models.BooleanField(default=True)
    notif_leftover_packs = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'accounts'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}'s profile"

    @property
    def resolved_avatar(self):
        if self.avatar:
            return self.avatar.url
        return self.avatar_url or ''


# ─── Address 

class Address(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label      = models.CharField(max_length=50, default='Home')
    street     = models.CharField(max_length=300)
    city       = models.CharField(max_length=100)
    postcode   = models.CharField(max_length=20)
    country    = models.CharField(max_length=100, default='Ireland')
    phone      = models.CharField(max_length=50, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering  = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.label} — {self.street}, {self.city}"

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(
                user=self.user, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ─── Notification 

class Notification(models.Model):
    TYPE_CHOICES = [
        ('order_update',  'Order Update'),
        ('promo',         'Promotional Offer'),
        ('price_change',  'Price Change'),
        ('leftover_pack', 'Leftover Pack Available'),
        ('ticket_reply',  'Support Ticket Reply'),
    ]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    is_read    = models.BooleanField(default=False, db_index=True)
    # Extra data: order_number, product_id, product_slug, etc.
    metadata   = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        app_label = 'accounts'
        ordering  = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.title}"

    @property
    def icon(self):
        if isinstance(self.metadata, dict) and 'icon' in self.metadata:
            return self.metadata['icon']
        return {
            'order_update':  'local_shipping',
            'promo':         'local_offer',
            'price_change':  'trending_down',
            'leftover_pack': 'inventory_2',
            'ticket_reply':  'support_agent',
        }.get(self.type, 'notifications')


# Auto-create profile when a User is created
from django.apps import apps

def _setup_user_profile_signal():
    """Setup signal after apps are ready"""
    User = apps.get_model(settings.AUTH_USER_MODEL)
    post_save.disconnect(create_user_profile, sender=User)
    post_save.connect(create_user_profile, sender=User)

@receiver(post_save)
def create_user_profile(sender, instance, created, **kwargs):
    if created and sender.__name__ == 'User':
        UserProfile.objects.get_or_create(user=instance)



import uuid
from django.utils import timezone

class PasswordResetOTP(models.Model):
    email      = models.EmailField(db_index=True)
    otp        = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    class Meta:
        app_label = 'accounts'

    def is_valid(self):
        return not self.is_used and (timezone.now() - self.created_at).seconds < 600  # 10 min


# ─── SupportTicket 

class SupportTicket(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    CATEGORY_CHOICES = [
        ('GENERAL', 'General'),
        ('TECHNICAL', 'Technical'),
        ('PAYMENT', 'Payment'),
        ('ACCOUNT', 'Account'),
        ('ORDER', 'Order'),
        ('PRODUCT', 'Product'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='GENERAL')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    admin_response = models.TextField(blank=True, null=True)
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='responded_support_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['-created_at']
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"

    def __str__(self):
        return f"Ticket #{self.id} by {self.user.email} - {self.subject}"


class SupportTicketImage(models.Model):
    ticket = models.ForeignKey(SupportTicket, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='support_tickets/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['created_at']


class SupportTicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='ticket_messages', on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['created_at']

class SupportTicketMessageAttachment(models.Model):
    message = models.ForeignKey(SupportTicketMessage, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='support_tickets/message_attachments/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['created_at']


@receiver(post_save, sender=SupportTicketMessage)
def notify_on_ticket_message(sender, instance, created, **kwargs):
    if created:
        ticket = instance.ticket
        # If the sender is an admin (or not the ticket owner), notify the user
        if instance.sender != ticket.user:
            Notification.objects.create(
                user=ticket.user,
                type='ticket_reply',
                title=f'New reply on Ticket #{ticket.id}',
                message=f'You received a new response regarding: {ticket.subject}',
                metadata={'ticket_id': ticket.id, 'icon': 'support_agent'}
            )
        else:
            # We update the ticket's updated_at timestamp when a user replies so admins see it's active
            ticket.save(update_fields=['updated_at'])