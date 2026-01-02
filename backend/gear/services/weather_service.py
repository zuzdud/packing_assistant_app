import requests
from datetime import datetime, timedelta
from django.conf import settings
from typing import Optional, Dict, List


class WeatherService:
    """
    Service to fetch weather forecasts using OpenWeatherMap API
    Free tier: 1000 calls/day, 5-day forecast
    """

    BASE_URL = "https://api.openweathermap.org/data/2.5"

    def __init__(self):
        self.api_key = getattr(settings, 'OPENWEATHER_API_KEY', None)

    def get_weather_forecast(
        self,
        location: str,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[Dict]:
        """
        Get weather forecast for a location and date range.
        Returns predicted weather conditions and temperature range.
        """
        if not self.api_key:
            return None

        try:
            # Get coordinates from location name
            coords = self._geocode_location(location)
            if not coords:
                print("no coords")
                return None

            # Get weather forecast
            forecast = self._get_forecast(coords['lat'], coords['lon'])
            if not forecast:
                print("noforecats")
                return None

            # Filter forecast for trip dates
            trip_forecast = self._filter_forecast_by_dates(
                forecast,
                start_date,
                end_date
            )

            return trip_forecast

        except Exception as e:
            print(f"Weather API error: {e}")
            return None

    def _geocode_location(self, location: str) -> Optional[Dict]:
        """Convert location name to coordinates"""
        url = f"http://api.openweathermap.org/geo/1.0/direct"
        params = {
            'q': location,
            'limit': 1,
            'appid': self.api_key
        }

        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data:
                return {
                    'lat': data[0]['lat'],
                    'lon': data[0]['lon'],
                    'name': data[0]['name']
                }
        return None

    def _get_forecast(self, lat: float, lon: float) -> Optional[Dict]:
        """Get 5-day weather forecast"""
        url = f"{self.BASE_URL}/forecast"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric'  # Celsius
        }

        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            return response.json()
        return None

    def _filter_forecast_by_dates(
        self,
        forecast: Dict,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Filter forecast data to match trip dates and aggregate weather conditions
        """
        forecasts = forecast.get('list', [])

        # Filter forecasts within date range
        trip_forecasts = []
        for item in forecasts:
            forecast_time = datetime.fromtimestamp(item['dt'])
            if start_date.date() <= forecast_time.date() <= end_date.date():
                trip_forecasts.append(item)

        if not trip_forecasts:
            return {
                'available': False,
                'message': 'Weather forecast not available for these dates'
            }

        # Aggregate data
        temps = [f['main']['temp'] for f in trip_forecasts]
        conditions = [f['weather'][0]['main'] for f in trip_forecasts]

        # Map OpenWeatherMap conditions to our simplified categories
        weather_mapping = {
            'Clear': 'Sunny',
            'Clouds': 'Cloudy',
            'Rain': 'Rainy',
            'Drizzle': 'Rainy',
            'Snow': 'Snowy',
            'Thunderstorm': 'Rainy',
            'Mist': 'Cloudy',
            'Fog': 'Cloudy',
            'Haze': 'Cloudy'
        }

        # Get unique weather conditions
        unique_conditions = set()
        for condition in conditions:
            mapped = weather_mapping.get(condition, 'Cloudy')
            unique_conditions.add(mapped)

        # Check for windy conditions (wind speed > 8 m/s)
        max_wind = max([f['wind']['speed'] for f in trip_forecasts])
        if max_wind > 8:
            unique_conditions.add('Windy')

        return {
            'available': True,
            'temp_min': int(min(temps)),
            'temp_max': int(max(temps)),
            'conditions': list(unique_conditions),
            'forecast_details': [
                {
                    'date': datetime.fromtimestamp(f['dt']).strftime('%Y-%m-%d'),
                    'temp': f['main']['temp'],
                    'condition': weather_mapping.get(f['weather'][0]['main'], 'Cloudy'),
                    'description': f['weather'][0]['description']
                }
                # Every 6 hours (skip some for brevity)
                for f in trip_forecasts[::2]
            ]
        }


weather_service = WeatherService()
