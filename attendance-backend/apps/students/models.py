from django.db import models
from accounts.models import User


class Student(models.Model):

    GENDER_CHOICES = (
        ("MALE", "Male"),
        ("FEMALE", "Female"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    mobile = models.CharField(max_length=15)

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,null=True,
    blank=True
    )

    photo = models.TextField(blank=True, null=True)

    batch = models.ForeignKey(
        'batches.Batch',
        on_delete=models.CASCADE
    )

    counsellor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_students'
    )

    def __str__(self):
        return self.user.first_name