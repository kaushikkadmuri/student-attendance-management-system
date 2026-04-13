from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone


class Attendance(models.Model):

    REQUIRED_MIN_DURATION = timedelta(hours=4)  # Example: 4 hours

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE
    )
    date = models.DateField(default=timezone.now)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)
    is_present = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:

            check_in_datetime = datetime.combine(self.date, self.check_in)
            check_out_datetime = datetime.combine(self.date, self.check_out)

            duration = check_out_datetime - check_in_datetime
            self.total_duration = duration

            if duration >= self.REQUIRED_MIN_DURATION:
                self.is_present = True
            else:
                self.is_present = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.user.first_name} - {self.date}"
