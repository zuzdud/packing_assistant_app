import pytest
from django.core.management import call_command


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """Load initial data for all tests"""
    with django_db_blocker.unblock():
        # Load categories and activities
        call_command('seed_data')


@pytest.fixture
def sample_categories(db):
    """Fixture providing sample categories"""
    from gear.tests.factories import CategoryFactory
    return CategoryFactory.create_batch(5)


@pytest.fixture
def sample_activities(db):
    """Fixture providing sample activities"""
    from gear.tests.factories import ActivityTypeFactory
    return ActivityTypeFactory.create_batch(5)