from django.db import models

class Center(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)

    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    allowed_radius = models.IntegerField(default=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

