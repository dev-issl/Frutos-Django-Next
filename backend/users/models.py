# users/models.py
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'CUSTOMER')
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('SELLER', 'Seller'),
        ('WHOLESALER', 'Wholesaler'),
        ('VENDOR', 'Vendor'),
        ('AFFILIATE', 'Affiliate'),
        ('ADMIN', 'Admin'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    user_type = models.CharField(
        max_length=12,
        choices=USER_TYPE_CHOICES,
        default='CUSTOMER',
        db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True, db_index=True)
    # Frutos-style notification preferences
    notif_order_updates = models.BooleanField(default=True, help_text='Notify on order status changes')
    notif_promotions = models.BooleanField(default=True, help_text='Receive promotional emails')
    notif_price_changes = models.BooleanField(default=True, help_text='Notify when product price changes')
    notif_leftover_packs = models.BooleanField(default=False, help_text='Notify on leftover pack deals')
    
    # Legacy fields for compatibility (can be removed if not needed)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.ImageField(upload_to='users/profiles/', blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    objects = CustomUserManager()
    
    def __str__(self):
        return self.email
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['user_type', 'is_active'], name='user_type_active_idx'),
            models.Index(fields=['-date_joined'], name='user_date_joined_idx'),
        ]


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_addresses', null=True, blank=True, db_index=True)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, verbose_name="State / Province / Region")
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name_plural = "Addresses"
        indexes = [
            models.Index(fields=['user', 'is_default'], name='address_user_default_idx'),
        ]
        
    def __str__(self):
        if self.user:
            return f"{self.user.email}: {self.address_line_1}, {self.city}"
        else:
            return f"Guest: {self.address_line_1}, {self.city}"


class WholesalerProfile(models.Model):
    """Profile for wholesaler users with business information and approval system"""
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wholesaler_profile')
    business_name = models.CharField(max_length=255, help_text="Legal business name")
    business_type = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Type of business (e.g., Import/Export, Retail, Manufacturing)"
    )
    trade_license = models.FileField(
        upload_to='wholesaler/trade_licenses/',
        help_text="Upload trade license or business registration document"
    )
    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_STATUS_CHOICES,
        default='PENDING',
        help_text="Admin approval status for wholesaler account"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_wholesalers',
        help_text="Admin who approved this wholesaler"
    )
    
    class Meta:
        verbose_name = "Wholesaler Profile"
        verbose_name_plural = "Wholesaler Profiles"
        
    def __str__(self):
        return f"{self.business_name} - {self.user.email} ({self.approval_status})"


class AffiliateProfile(models.Model):
    """Profile for affiliate users with referral system and approval"""
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='affiliate_profile')
    referral_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique referral code for affiliate marketing"
    )
    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_STATUS_CHOICES,
        default='PENDING',
        help_text="Admin approval status for affiliate account"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_affiliates',
        help_text="Admin who approved this affiliate"
    )
    
    def save(self, *args, **kwargs):
        """Auto-generate referral code if not provided"""
        if not self.referral_code:
            import string
            import random
            # Generate a unique 8-character referral code
            while True:
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                if not AffiliateProfile.objects.filter(referral_code=code).exists():
                    self.referral_code = code
                    break
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Affiliate Profile"
        verbose_name_plural = "Affiliate Profiles"
        
    def __str__(self):
        return f"{self.user.email} - {self.referral_code} ({self.approval_status})"


class VendorProfile(models.Model):
    """
    Profile for vendor users with Bangladesh business information and approval system.
    Vendors can create shops, add products, manage orders, and more.
    """
    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]

    BUSINESS_TYPE_CHOICES = [
        ('sole_proprietorship', 'Sole Proprietorship (একমালিকানা)'),
        ('partnership', 'Partnership (অংশীদারি)'),
        ('limited_company', 'Private Limited Company (প্রাইভেট লিমিটেড)'),
        ('public_limited', 'Public Limited Company'),
        ('cooperative', 'Cooperative Society'),
        ('other', 'Other'),
    ]

    DIVISION_CHOICES = [
        ('dhaka', 'Dhaka (ঢাকা)'),
        ('chittagong', 'Chittagong (চট্টগ্রাম)'),
        ('rajshahi', 'Rajshahi (রাজশাহী)'),
        ('khulna', 'Khulna (খুলনা)'),
        ('barisal', 'Barisal (বরিশাল)'),
        ('sylhet', 'Sylhet (সিলেট)'),
        ('rangpur', 'Rangpur (রংপুর)'),
        ('mymensingh', 'Mymensingh (ময়মনসিংহ)'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')

    # Personal Information
    phone = models.CharField(max_length=20, help_text="Mobile number (e.g., 01XXXXXXXXX)")
    alt_phone = models.CharField(max_length=20, blank=True, null=True, help_text="Alternative phone number")

    # Address
    address_line = models.CharField(max_length=255, help_text="Street address / Area")
    city = models.CharField(max_length=100, help_text="City / District")
    division = models.CharField(max_length=20, choices=DIVISION_CHOICES, help_text="Division")
    postal_code = models.CharField(max_length=10, blank=True, null=True, help_text="Postal / ZIP code")

    # Business Information
    business_name = models.CharField(max_length=255, help_text="Registered business name")
    business_type = models.CharField(max_length=30, choices=BUSINESS_TYPE_CHOICES, default='sole_proprietorship')
    business_description = models.TextField(blank=True, null=True, help_text="Describe your business and products")
    business_domain = models.URLField(blank=True, null=True, help_text="Business website URL (optional)")
    business_logo = models.ImageField(upload_to='vendors/logos/', help_text="Business logo (required)")
    business_banner = models.ImageField(upload_to='vendors/banners/', blank=True, null=True, help_text="Business banner image")

    # Bangladesh-specific documents
    trade_license = models.FileField(upload_to='vendors/trade_licenses/', help_text="Trade license document")
    trade_license_number = models.CharField(max_length=100, blank=True, null=True, help_text="Trade license number")
    tin_certificate = models.FileField(upload_to='vendors/tin/', blank=True, null=True, help_text="TIN certificate (optional)")
    tin_number = models.CharField(max_length=50, blank=True, null=True, help_text="TIN number")
    nid_front = models.FileField(upload_to='vendors/nid/', help_text="National ID card front side")
    nid_back = models.FileField(upload_to='vendors/nid/', help_text="National ID card back side")
    nid_number = models.CharField(max_length=20, help_text="National ID number")
    bin_number = models.CharField(max_length=50, blank=True, null=True, help_text="BIN number (for VAT registered businesses)")
    bank_statement = models.FileField(upload_to='vendors/bank/', blank=True, null=True, help_text="Recent bank statement (optional)")

    # Bank Information
    bank_name = models.CharField(max_length=100, blank=True, null=True, help_text="Bank name")
    bank_account_name = models.CharField(max_length=100, blank=True, null=True, help_text="Account holder name")
    bank_account_number = models.CharField(max_length=50, blank=True, null=True, help_text="Bank account number")
    bank_branch = models.CharField(max_length=100, blank=True, null=True, help_text="Bank branch name")
    bank_routing_number = models.CharField(max_length=20, blank=True, null=True, help_text="Routing number")
    mobile_banking_number = models.CharField(max_length=20, blank=True, null=True, help_text="bKash / Nagad / Rocket number")

    # Approval
    approval_status = models.CharField(max_length=12, choices=APPROVAL_STATUS_CHOICES, default='PENDING', db_index=True)
    rejection_reason = models.TextField(blank=True, null=True, help_text="Reason for rejection (admin use)")
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_vendors', help_text="Admin who approved this vendor"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Vendor Profile"
        verbose_name_plural = "Vendor Profiles"
        indexes = [
            models.Index(fields=['approval_status', 'created_at'], name='vendor_status_created_idx'),
        ]

    def __str__(self):
        return f"{self.business_name} - {self.user.email} ({self.approval_status})"

    @property
    def is_approved(self):
        return self.approval_status == 'APPROVED'


class VendorTicket(models.Model):
    """Support tickets created by vendors for admin assistance"""
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

    vendor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vendor_tickets')
    subject = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='GENERAL')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    admin_response = models.TextField(blank=True, null=True)
    responded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='responded_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)


class PasswordResetOTP(models.Model):
    """OTP tokens for password reset"""
    import random
    
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.email}"
    
    @staticmethod
    def generate_otp():
        """Generate a 6-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @classmethod
    def create_otp(cls, email):
        """Create a new OTP for the given email"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Delete old unused OTPs for this email
        cls.objects.filter(email=email, is_used=False).delete()
        
        otp = cls.objects.create(
            email=email,
            otp=cls.generate_otp(),
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        return otp
    
    def is_valid(self):
        """Check if OTP is still valid"""
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Vendor Ticket"
        verbose_name_plural = "Vendor Tickets"

    def __str__(self):
        return f"Ticket #{self.pk} - {self.subject} ({self.status})"


class Notification(models.Model):
    """Notifications for admin dashboard (vendor product actions, etc.)"""
    NOTIFICATION_TYPES = [
        ('PRODUCT_CREATED', 'Product Created'),
        ('PRODUCT_UPDATED', 'Product Updated'),
        ('PRODUCT_DELETED', 'Product Deleted'),
        ('VENDOR_REGISTERED', 'Vendor Registered'),
        ('TICKET_CREATED', 'Ticket Created'),
        ('ORDER_PLACED', 'Order Placed'),
    ]

    type = models.CharField(max_length=25, choices=NOTIFICATION_TYPES, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True, default='')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='triggered_notifications', null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"[{self.type}] {self.title}"
