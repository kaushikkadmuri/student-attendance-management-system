from django.db import models
from accounts.models import User

class Batch(models.Model):
    name = models.CharField(max_length=100)

    center = models.ForeignKey(
        'centers.Center',
        on_delete=models.CASCADE
    )

    analyst = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role': 'ANALYST'}
    )

    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.name} - {self.center.name}"

