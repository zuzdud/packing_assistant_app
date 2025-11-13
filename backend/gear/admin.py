from django.contrib import admin
from .models import Category, UserGear, Trip, TripGear, GearUsageStats, ActivityType, GearCatalog


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']
    search_fields = ['name']


@admin.register(UserGear)
class UserGearAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'category', 'weight_grams', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['user']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'start_date', 'end_date', 'duration_days', 'status']
    list_filter = ['status', 'start_date']
    search_fields = ['title', 'location']
    raw_id_fields = ['user']


@admin.register(TripGear)
class TripGearAdmin(admin.ModelAdmin):
    list_display = ['gear', 'trip', 'origin', 'packed', 'used', 'quantity']
    list_filter = ['origin', 'packed', 'used']
    raw_id_fields = ['trip', 'gear']


@admin.register(GearUsageStats)
class GearUsageStatsAdmin(admin.ModelAdmin):
    list_display = ['gear', 'user', 'times_packed', 'times_used', 'times_not_used']
    raw_id_fields = ['user', 'gear']


@admin.register(ActivityType)
class ActivityTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(GearCatalog)
class GearCatalogAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'typical_weight_grams', 'popularity_score']
    list_filter = ['category']
    search_fields = ['name', 'description']