import factory
from factory.django import DjangoModelFactory
from django.contrib.auth.models import User
from gear.models import Category, UserGear, Trip, TripGear, ActivityType, GearCatalog
from datetime import date, timedelta


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.set_password(extracted)
        else:
            self.set_password('testpass123')


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category
    
    name = factory.Sequence(lambda n: f'Category {n}')
    description = factory.Faker('sentence')
    icon = factory.Faker('emoji')


class UserGearFactory(DjangoModelFactory):
    class Meta:
        model = UserGear
    
    user = factory.SubFactory(UserFactory)
    name = factory.Faker('word')
    description = factory.Faker('sentence')
    category = factory.SubFactory(CategoryFactory)
    weight_grams = factory.Faker('random_int', min=50, max=5000)
    notes = factory.Faker('text', max_nb_chars=100)


class ActivityTypeFactory(DjangoModelFactory):
    class Meta:
        model = ActivityType
    
    name = factory.Sequence(lambda n: f'Activity {n}')
    description = factory.Faker('sentence')
    typical_gear_categories = factory.List([
        factory.Faker('word') for _ in range(3)
    ])


class TripFactory(DjangoModelFactory):
    class Meta:
        model = Trip
    
    user = factory.SubFactory(UserFactory)
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text')
    location = factory.Faker('city')
    start_date = factory.LazyFunction(lambda: date.today() + timedelta(days=7))
    end_date = factory.LazyAttribute(lambda obj: obj.start_date + timedelta(days=3))
    activities = factory.List([
        factory.Faker('word') for _ in range(2)
    ])
    expected_temp_min = factory.Faker('random_int', min=-10, max=15)
    expected_temp_max = factory.Faker('random_int', min=15, max=35)
    expected_weather = factory.List(['Sunny', 'Cloudy'])
    status = 'planned'


class TripGearFactory(DjangoModelFactory):
    class Meta:
        model = TripGear
    
    trip = factory.SubFactory(TripFactory)
    gear = factory.SubFactory(UserGearFactory)
    origin = 'user_added'
    packed = False
    used = False
    quantity = 1


class GearCatalogFactory(DjangoModelFactory):
    class Meta:
        model = GearCatalog
    
    name = factory.Faker('word')
    description = factory.Faker('sentence')
    category = factory.SubFactory(CategoryFactory)
    typical_weight_grams = factory.Faker('random_int', min=50, max=5000)
    common_activities = factory.List(['Hiking', 'Camping'])
    weather_conditions = factory.List(['Sunny'])
    popularity_score = factory.Faker('random_int', min=0, max=100)