
# wholesale/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import WholesaleUser, WholesaleDocument, WholesaleNotification, ApplicationStatus

class WholesaleDocumentInline(admin.TabularInline):
    model = WholesaleDocument
    extra = 0
    readonly_fields = ('uploaded_at',)


class WholesaleNotificationInline(admin.TabularInline):
    model = WholesaleNotification
    extra = 1
    fields = ('type', 'title', 'message', 'is_read', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    max_num = 10


@admin.register(WholesaleUser)
class WholesaleUserAdmin(UserAdmin):
    # list_display তে প্রোফাইল ইমেজ প্রিভিউ যোগ করা হয়েছে
    list_display = (
        'profile_tag', 'business_name', 'email', 'contact_name',
        'business_type', 'monthly_volume', 'status_badge',
        'total_orders', 'total_spent_display', 'applied_at',
    )
    list_filter = ('status', 'business_type', 'monthly_volume', 'is_active', 'applied_at')
    search_fields = ('business_name', 'email', 'contact_name', 'postcode')
    ordering = ('-applied_at',)
    
    # readonly_fields এ ইমেজের প্রিভিউ ট্যাগ যোগ করা হয়েছে
    readonly_fields = ('id', 'profile_tag_large', 'applied_at', 'approved_at', 'total_orders', 'total_spent', 'last_login')
    list_per_page = 30
    actions = ['approve_applications', 'reject_applications', 'suspend_users']

    fieldsets = (
        ('Business Information', {
            'fields': (
                'profile_image', 'profile_tag_large', 'business_name', 
                'contact_name', 'email', 'phone', 'postcode',
                'business_type', 'monthly_volume'
            )
        }),
        ('Application Status', {
            'fields': ('status', 'applied_at', 'approved_at', 'id')
        }),
        ('Account Manager', {
            'fields': ('account_manager_name', 'account_manager_email'),
            'classes': ('collapse',),
        }),
        ('Statistics', {
            'fields': ('total_orders', 'total_spent'),
            'classes': ('collapse',),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Admin Notes', {
            'fields': ('admin_notes',),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2',
                'business_name', 'contact_name', 'profile_image', 
                'phone', 'business_type', 'monthly_volume', 'postcode',
                'status',
            ),
        }),
    )

    inlines = [WholesaleDocumentInline, WholesaleNotificationInline]

    # --- কাস্টম মেথডসমূহ ---

    def profile_tag(self, obj):
        """লিস্ট ভিউতে ছোট থাম্বনেইল দেখানোর জন্য"""
        if obj.profile_image:
            return format_html('<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />', obj.profile_image.url)
        return "-"
    profile_tag.short_description = 'Avatar'

    def profile_tag_large(self, obj):
        """ডিটেইল ভিউতে বড় ইমেজ দেখানোর জন্য"""
        if obj.profile_image:
            return format_html('<img src="{}" style="max-width: 200px; border-radius: 10px;" />', obj.profile_image.url)
        return "No image uploaded"
    profile_tag_large.short_description = 'Image Preview'

    def status_badge(self, obj):
        colors = {
            'pending': '#F59E0B',
            'approved': '#10B981',
            'rejected': '#EF4444',
            'suspended': '#6B7280',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;border-radius:12px;'
            'font-size:11px;font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def total_spent_display(self, obj):
        return f"€{obj.total_spent:,.2f}"
    total_spent_display.short_description = 'Total Spent'
    total_spent_display.admin_order_field = 'total_spent'

    # --- অ্যাকশন মেথডসমূহ ---

    @admin.action(description='Approve selected applications')
    def approve_applications(self, request, queryset):
        updated = 0
        for user in queryset.filter(status__in=['pending', 'rejected']):
            user.status = ApplicationStatus.APPROVED
            user.approved_at = timezone.now()
            user.save(update_fields=['status', 'approved_at'])
            
            WholesaleNotification.objects.create(
                user=user,
                type=WholesaleNotification.Type.APPLICATION,
                title='Application Approved! 🎉',
                message=f'Congratulations! Your wholesale account for {user.business_name} '
                        f'has been approved. You can now access wholesale pricing and place orders.',
            )
            updated += 1
        self.message_user(request, f'{updated} application(s) approved.')

    @admin.action(description='Reject selected applications')
    def reject_applications(self, request, queryset):
        updated = queryset.filter(status='pending').update(status=ApplicationStatus.REJECTED)
        self.message_user(request, f'{updated} application(s) rejected.')

    @admin.action(description='Suspend selected users')
    def suspend_users(self, request, queryset):
        updated = queryset.filter(status='approved').update(status=ApplicationStatus.SUSPENDED)
        self.message_user(request, f'{updated} user(s) suspended.')


@admin.register(WholesaleNotification)
class WholesaleNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user__business_name', 'title', 'message')
    ordering = ('-created_at',)
    raw_id_fields = ('user',)


# wholesale content

"""
wholesale/admin.py

Admin registrations for the wholesale landing-page content models.
Existing auth-related admin (WholesaleAccount, etc.) should stay — add this below.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import WholesalePageContent

@admin.register(WholesalePageContent)
class WholesalePageContentAdmin(admin.ModelAdmin):
    list_display = ["id", "updated_at"]
    readonly_fields = ["updated_at"]