from django.db import models
from django.conf import settings

class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=100, help_text="e.g., Sales Associate, Packager")
    branch_location = models.CharField(max_length=255, blank=True, null=True, help_text="e.g., Móstoles Centro Branch")
    phone = models.CharField(max_length=20, blank=True, null=True)
    hire_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    break_duration_minutes = models.IntegerField(default=0, help_text="Break time in minutes")
    location = models.CharField(max_length=255, blank=True, null=True)
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
