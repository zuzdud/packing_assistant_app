from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class UserGear(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='gear_items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True)
    weight_grams = models.IntegerField(
        null=True, blank=True, validators=[MinValueValidator(0)])
    photo = models.ImageField(upload_to='gear_photos/', null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'category']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Trip(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='trips')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Trip details
    location = models.CharField(max_length=200, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.IntegerField(editable=False)

    # Activities stored as JSON array
    activities = models.JSONField(default=list, blank=True)

    # Weather conditions
    expected_temp_min = models.IntegerField(
        null=True, blank=True, help_text="Temperature in Celsius")
    expected_temp_max = models.IntegerField(
        null=True, blank=True, help_text="Temperature in Celsius")
    expected_weather = models.JSONField(
        default=list, blank=True, help_text="List of weather conditions")

    # Status
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='planned')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'start_date']),
        ]

    def save(self, *args, **kwargs):
        # Calculate duration automatically
        if self.start_date and self.end_date:
            self.duration_days = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.start_date}"


class TripGear(models.Model):
    ORIGIN_CHOICES = [
        ('recommended', 'Recommended'),
        ('user_added', 'User Added'),
    ]

    trip = models.ForeignKey(
        Trip, on_delete=models.CASCADE, related_name='gear_items')
    gear = models.ForeignKey(
        UserGear, on_delete=models.CASCADE, related_name='trip_usages')

    origin = models.CharField(
        max_length=20, choices=ORIGIN_CHOICES, default='recommended')
    packed = models.BooleanField(default=False)
    used = models.BooleanField(default=False)
    quantity = models.IntegerField(
        default=1, validators=[MinValueValidator(1)])

    # Post-trip feedback
    usefulness_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['trip', 'gear']
        indexes = [
            models.Index(fields=['trip', 'packed']),
            models.Index(fields=['trip', 'used']),
        ]

    def __str__(self):
        return f"{self.gear.name} for {self.trip.title}"


class GearUsageStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    gear = models.ForeignKey(UserGear, on_delete=models.CASCADE)

    times_packed = models.IntegerField(default=0)
    times_used = models.IntegerField(default=0)
    times_not_used = models.IntegerField(default=0)
    avg_usefulness_rating = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True)

    # Context-based usage stored as JSON
    usage_by_activity = models.JSONField(default=dict, blank=True, null=True)
    usage_by_weather = models.JSONField(default=dict, blank=True, null=True)
    usage_by_duration = models.JSONField(default=dict, blank=True, null=True)

    last_used_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'gear']
        verbose_name_plural = "Gear usage statistics"

    def __str__(self):
        return f"Stats for {self.gear.name} ({self.user.username})"


class ActivityType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    typical_gear_categories = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class GearCatalog(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True)
    typical_weight_grams = models.IntegerField(null=True, blank=True)
    photo = models.ImageField(
        upload_to='catalog_photos/', null=True, blank=True)

    common_activities = models.JSONField(default=list, blank=True)
    weather_conditions = models.JSONField(default=list, blank=True)

    popularity_score = models.IntegerField(default=0)

    class Meta:
        ordering = ['-popularity_score', 'name']

    def __str__(self):
        return self.name
