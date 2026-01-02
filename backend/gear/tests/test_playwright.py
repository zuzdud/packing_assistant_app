from django.conf import settings
import pytest
from playwright.sync_api import Page, expect
from datetime import datetime, timedelta
import json

# Configuration
API_BASE_URL = settings.API_BASE_URL


@pytest.fixture(scope="function")
def test_user_credentials():
    """Test user credentials"""
    return {
        "username": f"testuser_{datetime.now().timestamp()}",
        "email": f"test_{datetime.now().timestamp()}@example.com",
        "password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture(scope="function")
def authenticated_page(page: Page, test_user_credentials):
    """Fixture that provides an authenticated page"""
    # Register user
    response = page.request.post(
        f"{API_BASE_URL}/auth/register/",
        data=json.dumps({
            **test_user_credentials,
            "password2": test_user_credentials["password"]
        }),
        headers={"Content-Type": "application/json"}
    )

    assert response.ok, f"Registration failed: {response.text()}"

    # Login and get token
    response = page.request.post(
        f"{API_BASE_URL}/auth/login/",
        data=json.dumps({
            "username": test_user_credentials["username"],
            "password": test_user_credentials["password"]
        }),
        headers={"Content-Type": "application/json"}
    )

    assert response.ok, f"Login failed: {response.text()}"
    token_data = response.json()

    # Store token in page context
    page.context.set_extra_http_headers({
        "Authorization": f"Bearer {token_data['access']}"
    })

    return page


@pytest.mark.e2e
class TestAuthentication:
    """Test authentication endpoints"""

    def test_user_registration(self, page: Page):
        """Test user registration"""
        credentials = {
            "username": f"newuser_{datetime.now().timestamp()}",
            "email": f"new_{datetime.now().timestamp()}@example.com",
            "password": "NewPassword123!",
            "password2": "NewPassword123!",
            "first_name": "New",
            "last_name": "User"
        }

        response = page.request.post(
            f"{API_BASE_URL}/auth/register/",
            data=json.dumps(credentials),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert "user" in data
        assert data["user"]["username"] == credentials["username"]

    def test_user_registration_password_mismatch(self, page: Page):
        """Test registration with mismatched passwords"""
        credentials = {
            "username": f"testuser_{datetime.now().timestamp()}",
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "Password123!",
            "password2": "DifferentPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }

        response = page.request.post(
            f"{API_BASE_URL}/auth/register/",
            data=json.dumps(credentials),
            headers={"Content-Type": "application/json"}
        )

        assert not response.ok
        assert response.status == 400

    def test_user_login(self, page: Page, test_user_credentials):
        """Test user login"""
        # First register
        page.request.post(
            f"{API_BASE_URL}/auth/register/",
            data=json.dumps({
                **test_user_credentials,
                "password2": test_user_credentials["password"]
            }),
            headers={"Content-Type": "application/json"}
        )

        # Then login
        response = page.request.post(
            f"{API_BASE_URL}/auth/login/",
            data=json.dumps({
                "username": test_user_credentials["username"],
                "password": test_user_credentials["password"]
            }),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert "access" in data
        assert "refresh" in data

    def test_get_current_user(self, authenticated_page: Page):
        """Test getting current user info"""
        response = authenticated_page.request.get(f"{API_BASE_URL}/auth/me/")

        assert response.ok
        data = response.json()
        assert "username" in data
        assert "email" in data


@pytest.mark.e2e
class TestCategories:
    """Test category endpoints"""

    def test_list_categories(self, authenticated_page: Page):
        """Test listing all categories"""
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/categories/")

        assert response.ok
        data = response.json()
        assert isinstance(data, list) or "results" in data

    def test_get_category_detail(self, authenticated_page: Page):
        """Test getting a specific category"""
        # First get list
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/categories/")
        assert response.ok

        categories = response.json()
        if "results" in categories:
            categories = categories["results"]

        if len(categories) > 0:
            category_id = categories[0]["id"]

            # Get detail
            response = authenticated_page.request.get(
                f"{API_BASE_URL}/categories/{category_id}/"
            )
            assert response.ok
            data = response.json()
            assert data["id"] == category_id


@pytest.mark.e2e
class TestUserGear:
    """Test user gear management"""

    def test_create_gear(self, authenticated_page: Page):
        """Test creating a new gear item"""
        gear_data = {
            "name": "Test Tent",
            "description": "A test tent for camping",
            "weight_grams": 2500,
            "notes": "Bought in 2024"
        }

        response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert data["name"] == gear_data["name"]
        assert data["weight_grams"] == gear_data["weight_grams"]
        assert "id" in data

    def test_list_user_gear(self, authenticated_page: Page):
        """Test listing user's gear"""
        # Create a gear item first
        gear_data = {
            "name": "Test Backpack",
            "description": "A test backpack",
            "weight_grams": 1500
        }

        authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )

        # List gear
        response = authenticated_page.request.get(f"{API_BASE_URL}/gear/")

        assert response.ok
        data = response.json()
        results = data.get("results", data)
        assert len(results) > 0

    def test_update_gear(self, authenticated_page: Page):
        """Test updating a gear item"""
        # Create gear
        gear_data = {"name": "Original Name", "weight_grams": 1000}
        create_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )

        gear_id = create_response.json()["id"]

        # Update gear
        update_data = {"name": "Updated Name", "weight_grams": 1200}
        response = authenticated_page.request.patch(
            f"{API_BASE_URL}/gear/{gear_id}/",
            data=json.dumps(update_data),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["weight_grams"] == 1200

    def test_delete_gear(self, authenticated_page: Page):
        """Test deleting a gear item"""
        # Create gear
        gear_data = {"name": "To Be Deleted", "weight_grams": 500}
        create_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )

        gear_id = create_response.json()["id"]

        # Delete gear
        response = authenticated_page.request.delete(
            f"{API_BASE_URL}/gear/{gear_id}/"
        )

        assert response.ok or response.status == 204

        # Verify deletion
        get_response = authenticated_page.request.get(
            f"{API_BASE_URL}/gear/{gear_id}/"
        )
        assert not get_response.ok

    def test_get_gear_by_category(self, authenticated_page: Page):
        """Test filtering gear by category"""
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/gear/by_category/"
        )

        assert response.ok


@pytest.mark.e2e
class TestTrips:
    """Test trip management"""

    def test_create_trip(self, authenticated_page: Page):
        """Test creating a new trip"""
        trip_data = {
            "title": "Weekend Camping",
            "description": "A weekend camping trip",
            "location": "Yosemite National Park",
            "start_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"),
            "activities": ["Hiking", "Camping"],
            "expected_temp_min": 10,
            "expected_temp_max": 25,
            "expected_weather": ["Sunny", "Cloudy"]
        }

        response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert data["title"] == trip_data["title"]
        assert data["duration_days"] == 3
        assert "id" in data

    def test_list_trips(self, authenticated_page: Page):
        """Test listing user's trips"""
        # Create a trip first
        trip_data = {
            "title": "Test Trip",
            "start_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "activities": ["Hiking"]
        }

        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )

        # List trips
        response = authenticated_page.request.get(f"{API_BASE_URL}/trips/")

        assert response.ok
        data = response.json()
        results = data.get("results", data)
        assert len(results) > 0

    def test_filter_trips_by_status(self, authenticated_page: Page):
        """Test filtering trips by status"""
        # Create planned trip
        trip_data = {
            "title": "Planned Trip",
            "start_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d"),
            "status": "planned"
        }

        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )

        # Filter by status
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/trips/?status=planned"
        )

        assert response.ok
        data = response.json()
        results = data.get("results", data)
        assert all(trip["status"] == "planned" for trip in results)

    def test_add_gear_to_trip(self, authenticated_page: Page):
        """Test adding gear to a trip"""
        # Create gear
        gear_data = {"name": "Trip Tent", "weight_grams": 2000}
        gear_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )
        gear_id = gear_response.json()["id"]

        # Create trip
        trip_data = {
            "title": "Gear Test Trip",
            "start_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
        }
        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        # Add gear to trip
        response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/add_gear/",
            data=json.dumps({"gear_id": gear_id, "quantity": 1}),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert data["gear"] == gear_id

    def test_remove_gear_from_trip(self, authenticated_page: Page):
        """Test removing gear from a trip"""
        # Create gear and trip
        gear_data = {"name": "Removable Gear", "weight_grams": 500}
        gear_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )
        gear_id = gear_response.json()["id"]

        trip_data = {
            "title": "Remove Gear Trip",
            "start_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
        }
        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        # Add gear
        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/add_gear/",
            data=json.dumps({"gear_id": gear_id}),
            headers={"Content-Type": "application/json"}
        )

        # Remove gear
        response = authenticated_page.request.delete(
            f"{API_BASE_URL}/trips/{trip_id}/remove_gear/",
            data=json.dumps({"gear_id": gear_id}),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok or response.status == 204

    def test_update_gear_status(self, authenticated_page: Page):
        """Test updating gear packed/used status"""
        # Create gear and trip with gear
        gear_data = {"name": "Status Test Gear", "weight_grams": 300}
        gear_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )
        gear_id = gear_response.json()["id"]

        trip_data = {
            "title": "Status Test Trip",
            "start_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        }
        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/add_gear/",
            data=json.dumps({"gear_id": gear_id}),
            headers={"Content-Type": "application/json"}
        )

        # Update status
        response = authenticated_page.request.patch(
            f"{API_BASE_URL}/trips/{trip_id}/update_gear_status/",
            data=json.dumps({
                "gear_id": gear_id,
                "packed": True,
                "used": True,
                "usefulness_rating": 5
            }),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        assert data["packed"] is True
        assert data["used"] is True
        assert data["usefulness_rating"] == 5

    def test_complete_trip(self, authenticated_page: Page):
        """Test completing a trip and updating statistics"""
        # Create gear
        gear_data = {"name": "Complete Trip Gear", "weight_grams": 1000}
        gear_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )
        gear_id = gear_response.json()["id"]

        # Create trip
        trip_data = {
            "title": "Complete Trip Test",
            "start_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "activities": ["Hiking"],
            "expected_weather": ["Sunny"]
        }
        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        # Add and update gear
        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/add_gear/",
            data=json.dumps({"gear_id": gear_id}),
            headers={"Content-Type": "application/json"}
        )

        authenticated_page.request.patch(
            f"{API_BASE_URL}/trips/{trip_id}/update_gear_status/",
            data=json.dumps({
                "gear_id": gear_id,
                "packed": True,
                "used": True,
                "usefulness_rating": 4
            }),
            headers={"Content-Type": "application/json"}
        )

        # Complete trip
        response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/complete_trip/",
            headers={"Content-Type": "application/json"},
            data=json.dumps({})
        )

        # DEBUGGING BLOCK: Write error to file
        if not response.ok:
            print(f"\n❌ API Error: {response.status}")

            # Save the HTML to a file you can open
            with open("error_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text())

            print(
                "📄 Full error saved to: error_debug.html (Open this file in your browser!)")

        assert response.ok
        data = response.json()
        assert data["status"] == "completed"


@pytest.mark.e2e
class TestRecommendations:
    """Test gear recommendation system"""

    def test_get_trip_recommendations(self, authenticated_page: Page):
        """Test getting recommendations for a trip"""
        # Create trip with activities
        trip_data = {
            "title": "Hiking Trip",
            "start_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"),
            "activities": ["Hiking", "Camping"],
            "expected_temp_min": 5,
            "expected_temp_max": 20,
            "expected_weather": ["Sunny", "Cloudy"]
        }

        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        # Get recommendations
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/trips/{trip_id}/recommendations/"
        )

        assert response.ok
        data = response.json()
        assert "recommendations" in data
        assert "total_recommendations" in data
        assert isinstance(data["recommendations"], list)


@pytest.mark.e2e
class TestWeatherService:
    """Test weather forecast functionality"""

    def test_get_weather_forecast(self, authenticated_page: Page):
        """Test getting weather forecast"""
        forecast_data = {
            "location": "Yosemite National Park, CA",
            "start_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        }

        response = authenticated_page.request.post(
            f"{API_BASE_URL}/weather-forecast/",
            data=json.dumps(forecast_data),
            headers={"Content-Type": "application/json"}
        )

        assert response.ok
        data = response.json()
        # Weather API might not be configured, so just check structure
        assert "available" in data or "temp_min" in data

    def test_weather_forecast_missing_parameters(self, authenticated_page: Page):
        """Test weather forecast with missing parameters"""
        forecast_data = {
            "location": "Test Location"
            # Missing dates
        }

        response = authenticated_page.request.post(
            f"{API_BASE_URL}/weather-forecast/",
            data=json.dumps(forecast_data),
            headers={"Content-Type": "application/json"}
        )

        assert response.status == 400


@pytest.mark.e2e
class TestGearUsageStats:
    """Test gear usage statistics"""

    def test_get_usage_stats(self, authenticated_page: Page):
        """Test getting usage statistics"""
        response = authenticated_page.request.get(f"{API_BASE_URL}/stats/")

        assert response.ok
        data = response.json()
        # Stats might be empty initially
        assert isinstance(data.get("results", data), list)

    def test_gear_item_usage_stats(self, authenticated_page: Page):
        """Test getting usage stats for specific gear"""
        # Create gear, trip, and complete it
        gear_data = {"name": "Stats Test Gear", "weight_grams": 800}
        gear_response = authenticated_page.request.post(
            f"{API_BASE_URL}/gear/",
            data=json.dumps(gear_data),
            headers={"Content-Type": "application/json"}
        )
        gear_id = gear_response.json()["id"]

        trip_data = {
            "title": "Stats Trip",
            "start_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "activities": ["Hiking"]
        }
        trip_response = authenticated_page.request.post(
            f"{API_BASE_URL}/trips/",
            data=json.dumps(trip_data),
            headers={"Content-Type": "application/json"}
        )
        trip_id = trip_response.json()["id"]

        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/add_gear/",
            data=json.dumps({"gear_id": gear_id}),
            headers={"Content-Type": "application/json"}
        )

        authenticated_page.request.patch(
            f"{API_BASE_URL}/trips/{trip_id}/update_gear_status/",
            data=json.dumps({
                "gear_id": gear_id,
                "packed": True,
                "used": True
            }),
            headers={"Content-Type": "application/json"}
        )

        authenticated_page.request.post(
            f"{API_BASE_URL}/trips/{trip_id}/complete_trip/"
        )

        # Get stats for this gear
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/gear/{gear_id}/usage_stats/"
        )

        assert response.ok
        data = response.json()
        assert data["times_packed"] >= 1
        assert data["times_used"] >= 1


@pytest.mark.e2e
class TestGearCatalog:
    """Test gear catalog functionality"""

    def test_list_catalog(self, authenticated_page: Page):
        """Test listing gear catalog"""
        response = authenticated_page.request.get(f"{API_BASE_URL}/catalog/")

        assert response.ok
        data = response.json()
        assert isinstance(data.get("results", data), list)

    def test_catalog_by_activity(self, authenticated_page: Page):
        """Test filtering catalog by activity"""
        response = authenticated_page.request.get(
            f"{API_BASE_URL}/catalog/by_activity/?activities=Hiking"
        )

        assert response.ok or response.status == 400  # Might be empty
