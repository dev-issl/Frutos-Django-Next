import datetime
from django.utils import timezone
from users.models import User
from staff.models import StaffProfile, StaffShift, StaffTask, StaffNotification

def create_dummy_data():
    email = "munnahowlader06@gmail.com"
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"User {email} not found.")
        return

    # Ensure StaffProfile exists
    profile, created = StaffProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'SALES ASSOCIATE',
            'branch_location': 'Móstoles Centro Branch',
            'phone': '+34 600 123 456'
        }
    )

    # Delete existing to prevent duplicates
    StaffShift.objects.filter(staff=profile).delete()
    StaffNotification.objects.filter(staff=profile).delete()
    StaffTask.objects.filter(staff=profile).delete()

    # Create Shifts for a week
    today = timezone.now().date()
    # Monday of current week
    start_of_week = today - datetime.timedelta(days=today.weekday())

    shifts_data = [
        {'days_offset': 0, 'status': 'DAY_OFF'}, # Monday
        {'days_offset': 1, 'status': 'SCHEDULED', 'start': '09:00', 'end': '15:00', 'break': 30},
        {'days_offset': 2, 'status': 'SCHEDULED', 'start': '08:00', 'end': '17:00', 'break': 60},
        {'days_offset': 3, 'status': 'SCHEDULED', 'start': '08:00', 'end': '17:00', 'break': 60},
        {'days_offset': 4, 'status': 'SCHEDULED', 'start': '08:00', 'end': '17:00', 'break': 60},
        {'days_offset': 5, 'status': 'SCHEDULED', 'start': '09:00', 'end': '17:00', 'break': 60},
        {'days_offset': 6, 'status': 'DAY_OFF'}, # Sunday
    ]

    for data in shifts_data:
        shift_date = start_of_week + datetime.timedelta(days=data['days_offset'])
        if data['status'] == 'DAY_OFF':
            StaffShift.objects.create(
                staff=profile,
                date=shift_date,
                status='DAY_OFF'
            )
        else:
            StaffShift.objects.create(
                staff=profile,
                date=shift_date,
                status='SCHEDULED',
                start_time=datetime.datetime.strptime(data['start'], "%H:%M").time(),
                end_time=datetime.datetime.strptime(data['end'], "%H:%M").time(),
                break_duration_minutes=data['break'],
                location='El Árbol Móstoles Centro'
            )

    # Create Notifications
    now = timezone.now()
    StaffNotification.objects.create(
        staff=profile,
        title="Price update: Avocados now €3.20/kg",
        message="Effective immediately for Móstoles store.",
    )
    # Since auto_now_add is true on created_at, we just update it after creation
    n1 = StaffNotification.objects.last()
    n1.created_at = now - datetime.timedelta(hours=2)
    n1.save()

    StaffNotification.objects.create(
        staff=profile,
        title="Shift Change Approved",
        message="Your request for April 15th has been confirmed.",
    )
    n2 = StaffNotification.objects.last()
    n2.created_at = now - datetime.timedelta(days=1)
    n2.save()

    StaffNotification.objects.create(
        staff=profile,
        title="New Inventory: Organic Honey",
        message="12 units arrived at loading dock B.",
    )
    n3 = StaffNotification.objects.last()
    n3.created_at = now - datetime.timedelta(days=3)
    n3.save()

    # Create Tasks
    StaffTask.objects.create(
        staff=profile,
        title="Restock Organic Produce",
        description="Ensure the organic section is fully stocked before noon.",
        status='PENDING'
    )
    StaffTask.objects.create(
        staff=profile,
        title="Update Price Tags",
        description="Update tags for the new Avocados pricing.",
        status='IN_PROGRESS'
    )

    print("Dummy data created successfully!")

create_dummy_data()
