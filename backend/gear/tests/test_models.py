import pytest
from datetime import date, timedelta
from gear.tests.factories import (
    UserFactory, CategoryFactory, UserGearFactory, 
    TripFactory, TripGearFactory
)
from gear.models import Trip, TripGear


@pytest.mark.django_db
@pytest.mark.unit
class TestCategoryModel:
    """Unit tests for Category model"""
    
    def test_category_creation(self):
        """Test creating a category"""
        category = CategoryFactory(name="Shelter")
        assert category.name == "Shelter"
        assert str(category) == "Shelter"
    
    def test_category_ordering(self):
        """Test categories are ordered by name"""
        CategoryFactory(name="Cooking")
        CategoryFactory(name="Backpacks")
        CategoryFactory(name="Shelter")
        
        from gear.models import Category
        categories = list(Category.objects.all())
        assert categories[0].name == "Backpacks"
        assert categories[1].name == "Cooking"
        assert categories[2].name == "Shelter"


@pytest.mark.django_db
@pytest.mark.unit
class TestUserGearModel:
    """Unit tests for UserGear model"""
    
    def test_gear_creation(self):
        """Test creating a gear item"""
        user = UserFactory()
        category = CategoryFactory(name="Backpacks")
        gear = UserGearFactory(
            user=user,
            name="Osprey Atmos 65L",
            category=category,
            weight_grams=2200
        )
        
        assert gear.name == "Osprey Atmos 65L"
        assert gear.weight_grams == 2200
        assert gear.category.name == "Backpacks"
        assert str(gear) == f"Osprey Atmos 65L ({user.username})"
    
    def test_gear_without_category(self):
        """Test gear can exist without category"""
        gear = UserGearFactory(category=None)
        assert gear.category is None
    
    def test_gear_belongs_to_user(self):
        """Test gear is associated with correct user"""
        user1 = UserFactory()
        user2 = UserFactory()
        gear1 = UserGearFactory(user=user1)
        gear2 = UserGearFactory(user=user2)
        
        assert gear1.user == user1
        assert gear2.user == user2
        assert user1.gear_items.count() == 1
        assert user2.gear_items.count() == 1


@pytest.mark.django_db
@pytest.mark.unit
class TestTripModel:
    """Unit tests for Trip model"""
    
    def test_trip_creation(self):
        """Test creating a trip"""
        user = UserFactory()
        trip = TripFactory(
            user=user,
            title="Weekend Camping",
            start_date=date(2024, 6, 15),
            end_date=date(2024, 6, 17)
        )
        
        assert trip.title == "Weekend Camping"
        assert trip.duration_days == 3
        assert trip.user == user
    
    def test_duration_calculation(self):
        """Test trip duration is calculated correctly"""
        trip = TripFactory(
            start_date=date(2024, 6, 1),
            end_date=date(2024, 6, 5)
        )
        assert trip.duration_days == 5
    
    def test_trip_status_default(self):
        """Test default trip status is 'planned'"""
        trip = TripFactory()
        assert trip.status == 'planned'
    
    def test_trip_activities_as_list(self):
        """Test activities are stored as JSON list"""
        trip = TripFactory(activities=['Hiking', 'Camping', 'Fishing'])
        assert isinstance(trip.activities, list)
        assert len(trip.activities) == 3
        assert 'Hiking' in trip.activities
    
    def test_trip_weather_as_list(self):
        """Test weather conditions are stored as JSON list"""
        trip = TripFactory(expected_weather=['Sunny', 'Cloudy'])
        assert isinstance(trip.expected_weather, list)
        assert 'Sunny' in trip.expected_weather


@pytest.mark.django_db
@pytest.mark.unit
class TestTripGearModel:
    """Unit tests for TripGear model"""
    
    def test_trip_gear_creation(self):
        """Test adding gear to trip"""
        trip = TripFactory()
        gear = UserGearFactory(user=trip.user)
        trip_gear = TripGearFactory(trip=trip, gear=gear)
        
        assert trip_gear.trip == trip
        assert trip_gear.gear == gear
        assert trip_gear.quantity == 1
        assert not trip_gear.packed
        assert not trip_gear.used
    
    def test_trip_gear_unique_constraint(self):
        """Test same gear can't be added to trip twice"""
        trip = TripFactory()
        gear = UserGearFactory(user=trip.user)
        TripGearFactory(trip=trip, gear=gear)
        
        # Try to add same gear again
        with pytest.raises(Exception):  # IntegrityError
            TripGearFactory(trip=trip, gear=gear)
    
    def test_trip_gear_quantity(self):
        """Test gear quantity can be set"""
        trip_gear = TripGearFactory(quantity=3)
        assert trip_gear.quantity == 3
    
    def test_trip_gear_usefulness_rating(self):
        """Test usefulness rating is within valid range"""
        trip_gear = TripGearFactory(usefulness_rating=5)
        assert 1 <= trip_gear.usefulness_rating <= 5
    
    def test_gear_status_tracking(self):
        """Test packed and used status"""
        trip_gear = TripGearFactory(packed=True, used=True)
        assert trip_gear.packed
        assert trip_gear.used


@pytest.mark.django_db
@pytest.mark.unit
class TestTripGearRelationships:
    """Test relationships between Trip and Gear"""
    
    def test_trip_has_multiple_gear_items(self):
        """Test trip can have multiple gear items"""
        trip = TripFactory()
        user = trip.user
        gear1 = UserGearFactory(user=user)
        gear2 = UserGearFactory(user=user)
        gear3 = UserGearFactory(user=user)
        
        TripGearFactory(trip=trip, gear=gear1)
        TripGearFactory(trip=trip, gear=gear2)
        TripGearFactory(trip=trip, gear=gear3)
        
        assert trip.gear_items.count() == 3
    
    def test_gear_used_in_multiple_trips(self):
        """Test same gear can be used in multiple trips"""
        user = UserFactory()
        gear = UserGearFactory(user=user)
        trip1 = TripFactory(user=user)
        trip2 = TripFactory(user=user)
        
        TripGearFactory(trip=trip1, gear=gear)
        TripGearFactory(trip=trip2, gear=gear)
        
        assert gear.trip_usages.count() == 2
    
    def test_delete_trip_deletes_trip_gear(self):
        """Test cascade delete: deleting trip removes trip gear"""
        trip = TripFactory()
        gear = UserGearFactory(user=trip.user)
        trip_gear = TripGearFactory(trip=trip, gear=gear)
        trip_gear_id = trip_gear.id
        
        trip.delete()
        
        assert not TripGear.objects.filter(id=trip_gear_id).exists()
    
    def test_delete_gear_deletes_trip_gear(self):
        """Test cascade delete: deleting gear removes trip gear"""
        trip = TripFactory()
        gear = UserGearFactory(user=trip.user)
        trip_gear = TripGearFactory(trip=trip, gear=gear)
        trip_gear_id = trip_gear.id
        
        gear.delete()
        
        assert not TripGear.objects.filter(id=trip_gear_id).exists()