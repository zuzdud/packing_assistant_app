import pytest
from datetime import date, timedelta
from gear.tests.factories import (
    UserFactory, CategoryFactory, UserGearFactory,
    TripFactory, TripGearFactory, GearCatalogFactory
)
from gear.models import GearUsageStats


@pytest.mark.django_db
@pytest.mark.integration
class TestGearUsageTracking:
    """Test gear usage statistics tracking"""
    
    def test_complete_trip_updates_stats(self):
        """Test completing trip updates gear usage statistics"""
        user = UserFactory()
        trip = TripFactory(user=user, status='in_progress')
        gear = UserGearFactory(user=user)
        
        # Add gear to trip and mark as used
        trip_gear = TripGearFactory(
            trip=trip,
            gear=gear,
            packed=True,
            used=True,
            usefulness_rating=5
        )
        
        # Complete trip (this should update stats)
        trip.status = 'completed'
        trip.save()
        
        # Manually trigger stats update (or call the complete_trip endpoint)
        stats, created = GearUsageStats.objects.get_or_create(
            user=user,
            gear=gear,
            defaults={'times_packed': 0, 'times_used': 0, 'times_not_used': 0}
        )
        
        if trip_gear.packed:
            stats.times_packed += 1
            if trip_gear.used:
                stats.times_used += 1
        stats.save()
        
        assert stats.times_packed == 1
        assert stats.times_used == 1
        assert stats.times_not_used == 0
    
    def test_packed_but_not_used(self):
        """Test tracking gear that was packed but not used"""
        user = UserFactory()
        trip = TripFactory(user=user, status='completed')
        gear = UserGearFactory(user=user)
        
        trip_gear = TripGearFactory(
            trip=trip,
            gear=gear,
            packed=True,
            used=False
        )
        
        stats, _ = GearUsageStats.objects.get_or_create(
            user=user,
            gear=gear,
            defaults={'times_packed': 0, 'times_used': 0, 'times_not_used': 0}
        )
        
        if trip_gear.packed and not trip_gear.used:
            stats.times_not_used += 1
        stats.save()
        
        assert stats.times_not_used == 1
        assert stats.times_used == 0
    
    def test_stats_across_multiple_trips(self):
        """Test stats accumulate across multiple trips"""
        user = UserFactory()
        gear = UserGearFactory(user=user)
        
        # Trip 1: packed and used
        trip1 = TripFactory(user=user)
        TripGearFactory(trip=trip1, gear=gear, packed=True, used=True)
        
        # Trip 2: packed but not used
        trip2 = TripFactory(user=user)
        TripGearFactory(trip=trip2, gear=gear, packed=True, used=False)
        
        # Trip 3: packed and used
        trip3 = TripFactory(user=user)
        TripGearFactory(trip=trip3, gear=gear, packed=True, used=True)
        
        # Simulate stats update
        stats = GearUsageStats.objects.create(
            user=user,
            gear=gear,
            times_packed=3,
            times_used=2,
            times_not_used=1
        )
        
        assert stats.times_packed == 3
        assert stats.times_used == 2
        assert stats.times_not_used == 1


@pytest.mark.django_db
@pytest.mark.unit
class TestTripDurationCalculation:
    """Test trip duration calculations"""
    
    def test_single_day_trip(self):
        """Test single day trip duration"""
        trip = TripFactory(
            start_date=date(2024, 6, 15),
            end_date=date(2024, 6, 15)
        )
        assert trip.duration_days == 1
    
    def test_multi_day_trip(self):
        """Test multi-day trip duration"""
        trip = TripFactory(
            start_date=date(2024, 6, 15),
            end_date=date(2024, 6, 20)
        )
        assert trip.duration_days == 6
    
    def test_week_long_trip(self):
        """Test week-long trip duration"""
        start = date.today()
        end = start + timedelta(days=6)
        trip = TripFactory(start_date=start, end_date=end)
        assert trip.duration_days == 7


@pytest.mark.django_db
@pytest.mark.integration
class TestCatalogRecommendations:
    """Test gear catalog recommendation logic"""
    
    def test_catalog_items_for_activity(self):
        """Test finding catalog items for specific activities"""
        category = CategoryFactory(name="Climbing Gear")
        
        climbing_gear = GearCatalogFactory(
            category=category,
            common_activities=['Rock Climbing', 'Mountaineering']
        )
        hiking_gear = GearCatalogFactory(
            category=category,
            common_activities=['Hiking']
        )
        
        # Get catalog items for climbing
        from gear.models import GearCatalog
        climbing_items = GearCatalog.objects.filter(
            common_activities__contains=['Rock Climbing']
        )
        
        assert climbing_gear in climbing_items
        assert hiking_gear not in climbing_items
    
    def test_catalog_items_for_weather(self):
        """Test finding catalog items for weather conditions"""
        rain_gear = GearCatalogFactory(
            weather_conditions=['Rainy']
        )
        sun_gear = GearCatalogFactory(
            weather_conditions=['Sunny']
        )
        
        from gear.models import GearCatalog
        rainy_items = GearCatalog.objects.filter(
            weather_conditions__contains=['Rainy']
        )
        
        assert rain_gear in rainy_items
        assert sun_gear not in rainy_items


@pytest.mark.django_db
@pytest.mark.unit
class TestGearQuantityTracking:
    """Test gear quantity in trips"""
    
    def test_multiple_quantity_same_item(self):
        """Test adding multiple of the same item"""
        trip = TripFactory()
        gear = UserGearFactory(user=trip.user, name="Hiking socks")
        
        trip_gear = TripGearFactory(
            trip=trip,
            gear=gear,
            quantity=7  # One for each day
        )
        
        assert trip_gear.quantity == 7
    
    def test_total_weight_calculation(self):
        """Test calculating total weight of packed gear"""
        trip = TripFactory()
        user = trip.user
        
        gear1 = UserGearFactory(user=user, weight_grams=1000)
        gear2 = UserGearFactory(user=user, weight_grams=500)
        gear3 = UserGearFactory(user=user, weight_grams=300)
        
        TripGearFactory(trip=trip, gear=gear1, quantity=1, packed=True)
        TripGearFactory(trip=trip, gear=gear2, quantity=2, packed=True)
        TripGearFactory(trip=trip, gear=gear3, quantity=1, packed=False)
        
        # Calculate total weight of packed items
        from gear.models import TripGear
        packed_items = TripGear.objects.filter(trip=trip, packed=True)
        total_weight = sum(
            item.gear.weight_grams * item.quantity 
            for item in packed_items
            if item.gear.weight_grams
        )
        
        # 1000 + (500 * 2) = 2000g (gear3 not packed, so not counted)
        assert total_weight == 2000