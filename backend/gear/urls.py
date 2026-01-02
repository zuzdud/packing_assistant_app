from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserRegistrationView, CurrentUserView,
    CategoryViewSet, ActivityTypeViewSet,
    UserGearViewSet, TripViewSet,
    GearCatalogViewSet, GearUsageStatsViewSet, get_trip_recommendations, get_weather_forecast
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'activities', ActivityTypeViewSet, basename='activity')
router.register(r'gear', UserGearViewSet, basename='usergear')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'catalog', GearCatalogViewSet, basename='gearcatalog')
router.register(r'stats', GearUsageStatsViewSet, basename='stats')

urlpatterns = [
    # Authentication
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),

    # Router URLs
    path('', include(router.urls)),

    path('weather-forecast/', get_weather_forecast, name='weather_forecast'),
    path('trips/<int:trip_id>/recommendations/',
         get_trip_recommendations, name='trip_recommendations'),
]
