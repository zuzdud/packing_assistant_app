from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass

from gear.models import Trip, UserGear, GearCatalog, Category, GearUsageStats
import logging
       


@dataclass
class RecommendationRule:
    """Rule for gear recommendation"""
    category: str
    items: List[str]
    quantity: Optional[Callable[[Trip], int]] = None
    condition: Optional[Callable[[Trip], bool]] = None
    priority: str = 'medium'  # high, medium, low


class RecommendationService:
    """Service for generating personalized gear recommendations"""
    
    def __init__(self):
        self.rules = self._initialize_rules()

    def _initialize_rules(self) -> List[RecommendationRule]:
        """Initialize all recommendation rules"""
        return [
            # Base essentials for all trips
            RecommendationRule(
                category='Clothing - Base Layer',
                items=['Base layer top', 'Base layer bottom'],
                quantity=lambda trip: max(1, trip.duration_days // 2),
                priority='medium'
            ),
            RecommendationRule(
                category='Clothing - Lower Body',
                items=['Hiking pants', 'Underwear'],
                quantity=lambda trip: trip.duration_days,
                priority='medium'
            ),
            RecommendationRule(
                category='Accessories',
                items=['Socks'],
                quantity=lambda trip: trip.duration_days + 1,
                priority='medium'
            ),

            # Activity-based recommendations
            RecommendationRule(
                category='Footwear',
                items=['Hiking boots', 'Trail running shoes'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Hiking', 'Backpacking', 'Trail Running']
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Trekking',
                items=['Trekking poles'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Hiking', 'Backpacking', 'Mountaineering']
                ),
                priority='medium'
            ),
            RecommendationRule(
                category='Climbing Gear',
                items=['Climbing harness', 'Climbing helmet', 'Carabiners'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Rock Climbing', 'Mountaineering']
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Water Sports',
                items=['Life jacket', 'Paddle', 'Dry bag'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Kayaking', 'Canoeing', 'Rafting']
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Winter Sports',
                items=['Crampons', 'Ice axe', 'Insulated jacket'],
                condition=lambda trip: (
                    any(a in trip.activities for a in ['Snowshoeing', 'Winter Camping', 'Mountaineering']) or
                    (trip.expected_temp_max is not None and trip.expected_temp_max < 5)
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Fishing',
                items=['Fishing rod', 'Fishing tackle', 'Fishing license'],
                condition=lambda trip: 'Fishing' in trip.activities,
                priority='medium'
            ),
            RecommendationRule(
                category='Biking',
                items=['Bike helmet', 'Bike repair kit'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Mountain Biking', 'Bikepacking']
                ),
                priority='high'
            ),

            # Overnight/camping trips
            RecommendationRule(
                category='Shelter',
                items=['Tent', 'Sleeping bag', 'Sleeping pad'],
                condition=lambda trip: (
                    trip.duration_days > 1 or
                    any(a in trip.activities for a in [
                        'Camping', 'Backpacking', 'Wild Camping'])
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Cooking',
                items=['Camping stove', 'Fuel', 'Pot', 'Utensils'],
                condition=lambda trip: (
                    trip.duration_days > 1 or
                    any(a in trip.activities for a in [
                        'Camping', 'Backpacking'])
                ),
                priority='medium'
            ),
            RecommendationRule(
                category='Food Storage',
                items=['Food storage bag', 'Bear canister'],
                condition=lambda trip: trip.duration_days > 1,
                priority='medium'
            ),

            # Weather-based recommendations
            RecommendationRule(
                category='Sun Protection',
                items=['Sunscreen', 'Sunglasses', 'Sun hat'],
                condition=lambda trip: (
                    'Sunny' in trip.expected_weather or
                    (trip.expected_temp_max is not None and trip.expected_temp_max > 25)
                ),
                priority='medium'
            ),
            RecommendationRule(
                category='Clothing - Outer Layer',
                items=['Rain jacket', 'Rain pants'],
                condition=lambda trip: (
                    'Rainy' in trip.expected_weather or
                    'Snowy' in trip.expected_weather
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Clothing - Insulation',
                items=['Down jacket', 'Fleece jacket'],
                condition=lambda trip: (
                    'Snowy' in trip.expected_weather or
                    (trip.expected_temp_min is not None and trip.expected_temp_min < 10)
                ),
                priority='high'
            ),
            RecommendationRule(
                category='Handwear',
                items=['Gloves', 'Mittens'],
                condition=lambda trip: (
                    'Snowy' in trip.expected_weather or
                    (trip.expected_temp_min is not None and trip.expected_temp_min < 5)
                ),
                priority='medium'
            ),
            RecommendationRule(
                category='Headwear',
                items=['Warm beanie'],
                condition=lambda trip: (
                    trip.expected_temp_min is not None and trip.expected_temp_min < 10
                ),
                priority='medium'
            ),

            # Essential items for all trips
            RecommendationRule(
                category='Hydration',
                items=['Water bottle', 'Hydration bladder'],
                priority='high'
            ),
            RecommendationRule(
                category='Water Treatment',
                items=['Water filter', 'Water purification tablets'],
                condition=lambda trip: trip.duration_days > 1,
                priority='high'
            ),
            RecommendationRule(
                category='Navigation',
                items=['Map', 'Compass', 'GPS device'],
                priority='high'
            ),
            RecommendationRule(
                category='Lighting',
                items=['Headlamp', 'Extra batteries'],
                priority='high'
            ),
            RecommendationRule(
                category='First Aid',
                items=['First aid kit'],
                priority='high'
            ),
            RecommendationRule(
                category='Emergency',
                items=['Emergency whistle', 'Emergency blanket'],
                priority='high'
            ),
            RecommendationRule(
                category='Fire',
                items=['Lighter', 'Matches', 'Fire starter'],
                condition=lambda trip: any(
                    a in trip.activities for a in ['Camping', 'Backpacking', 'Wild Camping']
                ),
                priority='medium'
            ),
            RecommendationRule(
                category='Hygiene',
                items=['Toilet paper', 'Hand sanitizer',
                       'Toothbrush', 'Biodegradable soap'],
                condition=lambda trip: trip.duration_days > 1,
                priority='medium'
            ),
            RecommendationRule(
                category='Insect Protection',
                items=['Insect repellent'],
                condition=lambda trip: (
                    trip.expected_temp_max is not None and
                    trip.expected_temp_max > 15 and
                    'Snowy' not in trip.expected_weather
                ),
                priority='low'
            ),
            RecommendationRule(
                category='Tools',
                items=['Multi-tool', 'Knife'],
                priority='medium'
            ),
        ]

    def generate_recommendations(
        self,
        trip: Trip,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized gear recommendations for a trip

        Args:
            trip: Trip object
            user_id: User ID

        Returns:
            List of recommendation dictionaries
        """
        logger = logging.getLogger(__name__)
        
        logger.info(
            f"Generating recommendations for trip {trip.id}, user {user_id}")
        recommendations = []

        # Get user's gear grouped by category
        user_gear = UserGear.objects.filter(user_id=user_id)
        logger.info(f"Found {user_gear.count()} gear items for user")
        user_gear_by_category = self._group_by_category(user_gear)

        # Get usage stats for personalization
        usage_stats = GearUsageStats.objects.filter(user_id=user_id)

        logger.info(f"Found {usage_stats.count()} usage stats")

        for rule in self.rules:
            # Check if rule condition is met
            if rule.condition and not rule.condition(trip):
                continue

            quantity = rule.quantity(trip) if rule.quantity else 1

            # Get category object
            try:
                category = Category.objects.get(name=rule.category)
            except Category.DoesNotExist:
                # If category doesn't exist, create a generic recommendation
                recommendations.append(self._create_suggestion_recommendation(
                    rule, trip, quantity
                ))
                continue

            category_gear = user_gear_by_category.get(rule.category, [])

            if not category_gear:
                # User doesn't have items in this category
                # Recommend from catalog
                catalog_items = GearCatalog.objects.filter(
                    category=category
                ).order_by('-popularity_score')[:2]

                if catalog_items:
                    recommendations.append({
                        'category': rule.category,
                        'category_id': category.id,
                        'suggested_items': [
                            {
                                'id': item.id,
                                'name': item.name,
                                'description': item.description,
                                'weight': item.typical_weight_grams,
                                'source': 'catalog'
                            }
                            for item in catalog_items
                        ],
                        'reason': self._get_reason_for_recommendation(rule, trip),
                        'quantity': quantity,
                        'priority': rule.priority,
                        'source': 'catalog'
                    })
                else:
                    # No catalog items, just suggest category
                    recommendations.append(self._create_suggestion_recommendation(
                        rule, trip, quantity
                    ))

            elif quantity > len(category_gear):
                # User has some items but might need more
                recommendations.append({
                    'category': rule.category,
                    'category_id': category.id,
                    'suggested_items': [
                        {
                            'id': item.id,
                            'name': item.name,
                            'description': item.description,
                            'weight': item.weight_grams,
                            'source': 'user'
                        }
                        for item in category_gear
                    ],
                    'reason': f'Consider adding {quantity - len(category_gear)} more items',
                    'quantity': quantity,
                    'priority': 'low',
                    'source': 'user'
                })

        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(
            key=lambda x: priority_order.get(x['priority'], 2))

        # Add personalization based on usage stats
        recommendations = self._personalize_recommendations(
            recommendations, usage_stats, trip
        )

        return recommendations

    def _group_by_category(self, gear_queryset) -> Dict[str, List[UserGear]]:
        """Group gear items by category name"""
        result = {}
        for item in gear_queryset:
            category_name = item.category.name if item.category else 'Uncategorized'
            if category_name not in result:
                result[category_name] = []
            result[category_name].append(item)
        return result

    def _create_suggestion_recommendation(
        self,
        rule: RecommendationRule,
        trip: Trip,
        quantity: int
    ) -> Dict[str, Any]:
        """Create a recommendation suggesting a category without specific items"""
        return {
            'category': rule.category,
            'category_id': None,
            'suggested_items': [],
            'reason': self._get_reason_for_recommendation(rule, trip),
            'quantity': quantity,
            'priority': rule.priority,
            'source': 'suggestion'
        }

    def _get_reason_for_recommendation(
        self,
        rule: RecommendationRule,
        trip: Trip
    ) -> str:
        """Generate human-readable reason for recommendation"""

        # Activity-based reasons
        if rule.category == 'Climbing Gear':
            return 'Essential for climbing activities'
        if rule.category == 'Water Sports':
            return 'Required for water activities'
        if rule.category == 'Winter Sports':
            return 'Needed for cold weather or winter activities'
        if rule.category == 'Fishing':
            return 'Required for fishing'
        if rule.category == 'Biking':
            return 'Essential for biking safety'

        # Weather-based reasons
        if rule.category == 'Sun Protection':
            return 'Recommended for sunny weather'
        if rule.category == 'Clothing - Outer Layer' and 'Rainy' in trip.expected_weather:
            return 'Rain protection needed'
        if rule.category == 'Clothing - Insulation':
            return 'Warmth needed for cold temperatures'

        # Duration-based reasons
        if rule.category in ['Shelter', 'Cooking']:
            return 'Required for overnight trips'
        if rule.category == 'Hygiene':
            return 'Essential for multi-day trips'

        # Quantity-based reasons
        if rule.category in ['Accessories', 'Clothing - Lower Body']:
            quantity = rule.quantity(trip) if rule.quantity else 1
            return f'Recommended: {quantity} for {trip.duration_days}-day trip'

        return 'Recommended for your trip'

    def _personalize_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        usage_stats,
        trip: Trip
    ) -> List[Dict[str, Any]]:
        """
        Personalize recommendations based on user's gear usage history
        """
        stats_by_gear = {stat.gear_id: stat for stat in usage_stats}

        for rec in recommendations:
            if rec['source'] == 'user':
                # Add usage information for user's gear
                for item in rec['suggested_items']:
                    stat = stats_by_gear.get(item['id'])
                    if stat:
                        item['times_used'] = stat.times_used
                        item['avg_rating'] = float(
                            stat.avg_usefulness_rating) if stat.avg_usefulness_rating else None
                        item['last_used'] = stat.last_used_date.isoformat(
                        ) if stat.last_used_date else None

                        # Boost priority if gear was highly rated
                        if stat.avg_usefulness_rating and stat.avg_usefulness_rating >= 4:
                            rec['reason'] += ' (highly rated by you)'

        return recommendations


# Singleton instance
recommendation_service = RecommendationService()
