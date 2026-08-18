from django.db import models
from django.conf import settings

class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    staff_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    role = models.CharField(max_length=100, help_text="e.g., Sales Associate, Packager")
    store = models.ForeignKey('stores.Store', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    phone = models.CharField(max_length=20, blank=True, null=True)
    hire_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Permissions
    can_create_orders = models.BooleanField(default=False)
    can_update_orders = models.BooleanField(default=False)
    can_delete_orders = models.BooleanField(default=False)
    
    can_create_products = models.BooleanField(default=False)
    can_update_products = models.BooleanField(default=False)
    can_delete_products = models.BooleanField(default=False)
    
    # Store plain-text password for admin viewing (requested by user)
    secret_key = models.CharField(max_length=255, blank=True, null=True)

    # Restricted stores for this staff member
    restricted_stores = models.ManyToManyField('stores.Store', blank=True, related_name='restricted_staff')

    # Photo for staff dashboard
    photo = models.ImageField(upload_to='staff_photos/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.staff_id:
            import random
            import string
            # Generate a unique STF-<6 digits> ID
            while True:
                new_id = f"STF-{''.join(random.choices(string.digits, k=6))}"
                if not StaffProfile.objects.filter(staff_id=new_id).exists():
                    self.staff_id = new_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.name} - {self.role}"

class StaffShift(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'Shift in progress'),
        ('COMPLETED', 'Completed'),
        ('DAY_OFF', 'Day Off'),
        ('ABSENT', 'Absent')
    ]
    
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='shifts')
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    break_duration_minutes = models.IntegerField(default=0, help_text="Break time in minutes")
    location = models.CharField(max_length=255, blank=True, null=True)
    store = models.ForeignKey('stores.Store', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_shifts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.staff.user.name} - {self.date} ({self.status})"

class StaffTask(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed')
    ]
    
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    progress_percentage = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Task: {self.title} for {self.staff.user.name}"

class StaffNotification(models.Model):
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif: {self.title} for {self.staff.user.name}"


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_announcements')
    target_all_stores = models.BooleanField(default=False)
    target_stores = models.ManyToManyField('stores.Store', blank=True, related_name='announcements')
    target_staff = models.ManyToManyField(StaffProfile, blank=True, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class AnnouncementFile(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='announcement_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for {self.announcement.title}"

class AnnouncementImage(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='announcement_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.announcement.title}"

class DayOffRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='day_off_requests')
    date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Check if status is changed to APPROVED or REJECTED
        if self.pk:
            old = DayOffRequest.objects.get(pk=self.pk)
            if old.status != self.status:
                if self.status == 'APPROVED':
                    # Create or update StaffShift to be DAY_OFF
                    shift, created = StaffShift.objects.get_or_create(
                        staff=self.staff,
                        date=self.date,
                        defaults={'status': 'DAY_OFF'}
                    )
                    if not created:
                        shift.status = 'DAY_OFF'
                        shift.save()
                
                if self.status in ['APPROVED', 'REJECTED']:
                    # Send notification to staff
                    StaffNotification.objects.create(
                        staff=self.staff,
                        title=f"Day Off Request {self.status.capitalize()}",
                        message=f"Your day off request for {self.date} has been {self.status.lower()}."
                    )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff.user.name} - {self.date} ({self.status})"

class StaffAdminChat(models.Model):
    SENDER_CHOICES = [
        ('STAFF', 'Staff'),
        ('ADMIN', 'Admin')
    ]
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='admin_chats')
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_chats')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} to {'Admin' if self.sender == 'STAFF' else self.staff.user.name}: {self.message[:20]}"

