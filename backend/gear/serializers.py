from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, UserGear, Trip, TripGear, 
    GearUsageStats, ActivityType, GearCatalog
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon']


class ActivityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityType
        fields = ['id', 'name', 'description', 'typical_gear_categories']


class UserGearSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = UserGear
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'weight_grams', 'photo', 'purchase_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        # Automatically set the user from request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserGearListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = UserGear
        fields = ['id', 'name', 'category_name', 'weight_grams', 'photo']


class TripGearSerializer(serializers.ModelSerializer):
    gear_name = serializers.CharField(source='gear.name', read_only=True)
    gear_photo = serializers.ImageField(source='gear.photo', read_only=True)
    gear_weight = serializers.IntegerField(source='gear.weight_grams', read_only=True)
    gear_category = serializers.CharField(source='gear.category.name', read_only=True)
    
    class Meta:
        model = TripGear
        fields = [
            'id', 'gear', 'gear_name', 'gear_photo', 'gear_weight', 'gear_category',
            'origin', 'packed', 'used', 'quantity', 
            'usefulness_rating', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']


class TripSerializer(serializers.ModelSerializer):
    gear_items = TripGearSerializer(many=True, read_only=True)
    gear_count = serializers.SerializerMethodField()
    packed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = [
            'id', 'title', 'description', 'location',
            'start_date', 'end_date', 'duration_days',
            'activities', 'expected_temp_min', 'expected_temp_max',
            'expected_weather', 'status', 'gear_items',
            'gear_count', 'packed_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['duration_days', 'created_at', 'updated_at']

    def get_gear_count(self, obj):
        return obj.gear_items.count()

    def get_packed_count(self, obj):
        return obj.gear_items.filter(packed=True).count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TripListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    gear_count = serializers.SerializerMethodField()
    packed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = [
            'id', 'title', 'location', 'start_date', 'end_date',
            'duration_days', 'status', 'gear_count', 'packed_count'
        ]

    def get_gear_count(self, obj):
        return obj.gear_items.count()

    def get_packed_count(self, obj):
        return obj.gear_items.filter(packed=True).count()


class GearUsageStatsSerializer(serializers.ModelSerializer):
    gear_name = serializers.CharField(source='gear.name', read_only=True)
    
    class Meta:
        model = GearUsageStats
        fields = [
            'id', 'gear', 'gear_name', 'times_packed', 'times_used',
            'times_not_used', 'avg_usefulness_rating',
            'usage_by_activity', 'usage_by_weather', 'usage_by_duration',
            'last_used_date', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class GearCatalogSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = GearCatalog
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'typical_weight_grams', 'photo', 'common_activities',
            'weather_conditions', 'popularity_score'
        ]