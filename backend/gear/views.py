from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from .models import (
    Category, UserGear, Trip, TripGear,
    GearUsageStats, ActivityType, GearCatalog
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    CategorySerializer, ActivityTypeSerializer,
    UserGearSerializer, UserGearListSerializer,
    TripSerializer, TripListSerializer, TripGearSerializer,
    GearUsageStatsSerializer, GearCatalogSerializer
)


class UserRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'message': 'User created successfully',
                    'user': UserSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve categories (read-only)"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class ActivityTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve activity types (read-only)"""
    queryset = ActivityType.objects.all()
    serializer_class = ActivityTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserGearViewSet(viewsets.ModelViewSet):
    """CRUD operations for user's gear"""
    serializer_class = UserGearSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own gear
        return UserGear.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return UserGearListSerializer
        return UserGearSerializer

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get gear grouped by category"""
        category_id = request.query_params.get('category_id')
        if category_id:
            gear = self.get_queryset().filter(category_id=category_id)
        else:
            gear = self.get_queryset()
        
        serializer = self.get_serializer(gear, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def usage_stats(self, request, pk=None):
        """Get usage statistics for a specific gear item"""
        gear = self.get_object()
        try:
            stats = GearUsageStats.objects.get(user=request.user, gear=gear)
            serializer = GearUsageStatsSerializer(stats)
            return Response(serializer.data)
        except GearUsageStats.DoesNotExist:
            return Response({'message': 'No usage stats available'}, status=status.HTTP_404_NOT_FOUND)


class TripViewSet(viewsets.ModelViewSet):
    """CRUD operations for trips"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own trips
        queryset = Trip.objects.filter(user=self.request.user)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return TripListSerializer
        return TripSerializer

    @action(detail=True, methods=['post'])
    def add_gear(self, request, pk=None):
        """Add gear item to trip"""
        trip = self.get_object()
        gear_id = request.data.get('gear_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            gear = UserGear.objects.get(id=gear_id, user=request.user)
        except UserGear.DoesNotExist:
            return Response(
                {'error': 'Gear item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        trip_gear, created = TripGear.objects.get_or_create(
            trip=trip,
            gear=gear,
            defaults={
                'origin': 'user_added',
                'quantity': quantity
            }
        )

        if not created:
            return Response(
                {'error': 'Gear already added to this trip'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TripGearSerializer(trip_gear)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def remove_gear(self, request, pk=None):
        """Remove gear item from trip"""
        trip = self.get_object()
        gear_id = request.data.get('gear_id')
        
        try:
            trip_gear = TripGear.objects.get(trip=trip, gear_id=gear_id)
            trip_gear.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TripGear.DoesNotExist:
            return Response(
                {'error': 'Gear not found in this trip'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'])
    def update_gear_status(self, request, pk=None):
        """Update packed/used status of gear in trip"""
        trip = self.get_object()
        gear_id = request.data.get('gear_id')
        
        try:
            trip_gear = TripGear.objects.get(trip=trip, gear_id=gear_id)
            
            # Update fields if provided
            if 'packed' in request.data:
                trip_gear.packed = request.data['packed']
            if 'used' in request.data:
                trip_gear.used = request.data['used']
            if 'usefulness_rating' in request.data:
                trip_gear.usefulness_rating = request.data['usefulness_rating']
            if 'notes' in request.data:
                trip_gear.notes = request.data['notes']
            
            trip_gear.save()
            
            serializer = TripGearSerializer(trip_gear)
            return Response(serializer.data)
        except TripGear.DoesNotExist:
            return Response(
                {'error': 'Gear not found in this trip'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def complete_trip(self, request, pk=None):
        """Mark trip as completed and update usage statistics"""
        trip = self.get_object()
        
        if trip.status == 'completed':
            return Response(
                {'error': 'Trip already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        trip.status = 'completed'
        trip.save()
        
        # Update gear usage statistics
        for trip_gear in trip.gear_items.all():
            stats, created = GearUsageStats.objects.get_or_create(
                user=request.user,
                gear=trip_gear.gear,
                defaults={
                    'times_packed': 0,
                    'times_used': 0,
                    'times_not_used': 0
                }
            )
            
            # Update counters
            if trip_gear.packed:
                stats.times_packed += 1
                if trip_gear.used:
                    stats.times_used += 1
                else:
                    stats.times_not_used += 1
            
            # Update activity usage
            if trip.activities:
                usage_by_activity = stats.usage_by_activity or {}
                for activity in trip.activities:
                    usage_by_activity[activity] = usage_by_activity.get(activity, 0) + 1
                stats.usage_by_activity = usage_by_activity
            
            # Update weather usage
            if trip.expected_weather:
                usage_by_weather = stats.usage_by_weather or {}
                usage_by_weather[trip.expected_weather] = usage_by_weather.get(trip.expected_weather, 0) + 1
                stats.usage_by_weather = usage_by_weather
            
            # Update duration usage
            duration_range = self._get_duration_range(trip.duration_days)
            usage_by_duration = stats.usage_by_duration or {}
            usage_by_duration[duration_range] = usage_by_duration.get(duration_range, 0) + 1
            stats.usage_by_duration = usage_by_duration
            
            # Update average rating
            if trip_gear.usefulness_rating:
                current_ratings = stats.times_packed
                current_avg = float(stats.avg_usefulness_rating or 0)
                new_avg = ((current_avg * (current_ratings - 1)) + trip_gear.usefulness_rating) / current_ratings
                stats.avg_usefulness_rating = round(new_avg, 2)
            
            stats.last_used_date = trip.end_date
            stats.save()
        
        serializer = TripSerializer(trip)
        return Response(serializer.data)

    def _get_duration_range(self, days):
        """Helper to categorize trip duration"""
        if days <= 1:
            return '1_day'
        elif days <= 3:
            return '2-3_days'
        elif days <= 7:
            return '4-7_days'
        else:
            return '8+_days'


class GearCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """Browse gear catalog for inspiration"""
    queryset = GearCatalog.objects.all()
    serializer_class = GearCatalogSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_activity(self, request):
        """Get recommended catalog items for specific activities"""
        activities = request.query_params.getlist('activities')
        if activities:
            # Filter items that match any of the activities
            queryset = self.queryset.filter(common_activities__overlap=activities)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return Response({'error': 'No activities specified'}, status=status.HTTP_400_BAD_REQUEST)


class GearUsageStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """View usage statistics for user's gear"""
    serializer_class = GearUsageStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GearUsageStats.objects.filter(user=self.request.user)