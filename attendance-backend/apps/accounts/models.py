# from django.db import models
# from django.contrib.auth.models import AbstractUser

# class User(AbstractUser):

#     ROLE_CHOICES = (
#         ('ADMIN', 'Admin'),
#         ('ANALYST', 'Analyst'),
#         ('COUNSELLOR', 'Counsellor'),
#         ('STUDENT', 'Student'),
#     )

#     role = models.CharField(max_length=20, choices=ROLE_CHOICES)
#     center = models.ForeignKey(
#         'centers.Center',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True
#     )

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import random

class User(AbstractUser):

    GENDER_CHOICES = (
    ("MALE", "Male"),
    ("FEMALE", "Female"),
    )

    mobile = models.CharField(max_length=15, blank=True, null=True)

    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('ANALYST', 'Analyst'),
        ('COUNSELLOR', 'Counsellor'),
        ('STUDENT', 'Student'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    center = models.ForeignKey(
        'centers.Center',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "ADMIN"

        if self.email:
            self.username = self.email    
        super().save(*args, **kwargs)



class PasswordResetOTP(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))