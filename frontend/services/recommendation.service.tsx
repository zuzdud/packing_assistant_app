import { GearItem } from './gear.service';
import { Trip } from './trip.service';

interface RecommendationRule {
    category: string;
    items: string[];
    quantity?: (trip: Trip) => number;
    condition?: (trip: Trip) => boolean;
}

class RecommendationService {
    // Rule-based recommendation system
    private rules: RecommendationRule[] = [
        // Base essentials for all trips
        {
            category: 'Clothing - Base Layer',
            items: ['Base layer top', 'Base layer bottom'],
            quantity: (trip) => Math.ceil(trip.duration_days / 2), // Half the days
        },
        {
            category: 'Clothing - Lower Body',
            items: ['Hiking pants', 'Underwear'],
            quantity: (trip) => trip.duration_days, // One per day
        },
        {
            category: 'Accessories',
            items: ['Socks'],
            quantity: (trip) => trip.duration_days + 1, // One extra pair
        },

        // Activity-based recommendations
        {
            category: 'Footwear',
            items: ['Hiking boots', 'Trail running shoes'],
            condition: (trip) =>
                trip.activities.some(a => ['Hiking', 'Backpacking', 'Trail Running'].includes(a)),
        },
        {
            category: 'Trekking',
            items: ['Trekking poles'],
            condition: (trip) =>
                trip.activities.some(a => ['Hiking', 'Backpacking', 'Mountaineering'].includes(a)),
        },
        {
            category: 'Climbing Gear',
            items: ['Climbing harness', 'Climbing helmet', 'Carabiners'],
            condition: (trip) =>
                trip.activities.some(a => ['Rock Climbing', 'Mountaineering'].includes(a)),
        },
        {
            category: 'Water Sports',
            items: ['Life jacket', 'Paddle', 'Dry bag'],
            condition: (trip) =>
                trip.activities.some(a => ['Kayaking', 'Canoeing', 'Rafting'].includes(a)),
        },
        {
            category: 'Winter Sports',
            items: ['Crampons', 'Ice axe', 'Insulated jacket'],
            condition: (trip) =>
                trip.activities.some(a => ['Snowshoeing', 'Winter Camping', 'Mountaineering'].includes(a)) ||
                (trip.expected_temp_max !== null && trip.expected_temp_max < 5),
        },
        {
            category: 'Fishing',
            items: ['Fishing rod', 'Fishing tackle', 'Fishing license'],
            condition: (trip) => trip.activities.includes('Fishing'),
        },
        {
            category: 'Biking',
            items: ['Bike helmet', 'Bike repair kit'],
            condition: (trip) =>
                trip.activities.some(a => ['Mountain Biking', 'Bikepacking'].includes(a)),
        },

        // Overnight/camping trips
        {
            category: 'Shelter',
            items: ['Tent', 'Sleeping bag', 'Sleeping pad'],
            condition: (trip) =>
                trip.duration_days > 1 ||
                trip.activities.some(a => ['Camping', 'Backpacking', 'Wild Camping'].includes(a)),
        },
        {
            category: 'Cooking',
            items: ['Camping stove', 'Fuel', 'Pot', 'Utensils'],
            condition: (trip) =>
                trip.duration_days > 1 ||
                trip.activities.some(a => ['Camping', 'Backpacking'].includes(a)),
        },
        {
            category: 'Food Storage',
            items: ['Food storage bag', 'Bear canister'],
            condition: (trip) => trip.duration_days > 1,
        },

        // Weather-based recommendations
        {
            category: 'Sun Protection',
            items: ['Sunscreen', 'Sunglasses', 'Sun hat'],
            condition: (trip) =>
                trip.expected_weather === 'Sunny' ||
                (trip.expected_temp_max !== null && trip.expected_temp_max > 25),
        },
        {
            category: 'Clothing - Outer Layer',
            items: ['Rain jacket', 'Rain pants'],
            condition: (trip) =>
                trip.expected_weather === 'Rainy' ||
                trip.expected_weather === 'Snowy',
        },
        {
            category: 'Clothing - Insulation',
            items: ['Down jacket', 'Fleece jacket'],
            condition: (trip) =>
                trip.expected_weather === 'Snowy' ||
                (trip.expected_temp_min !== null && trip.expected_temp_min < 10),
        },
        {
            category: 'Handwear',
            items: ['Gloves', 'Mittens'],
            condition: (trip) =>
                trip.expected_weather === 'Snowy' ||
                (trip.expected_temp_min !== null && trip.expected_temp_min < 5),
        },
        {
            category: 'Headwear',
            items: ['Warm beanie'],
            condition: (trip) =>
                (trip.expected_temp_min !== null && trip.expected_temp_min < 10),
        },

        // Essential items for all trips
        {
            category: 'Hydration',
            items: ['Water bottle', 'Hydration bladder'],
        },
        {
            category: 'Water Treatment',
            items: ['Water filter', 'Water purification tablets'],
            condition: (trip) => trip.duration_days > 1,
        },
        {
            category: 'Navigation',
            items: ['Map', 'Compass', 'GPS device'],
        },
        {
            category: 'Lighting',
            items: ['Headlamp', 'Extra batteries'],
        },
        {
            category: 'First Aid',
            items: ['First aid kit'],
        },
        {
            category: 'Emergency',
            items: ['Emergency whistle', 'Emergency blanket'],
        },
        {
            category: 'Fire',
            items: ['Lighter', 'Matches', 'Fire starter'],
            condition: (trip) =>
                trip.activities.some(a => ['Camping', 'Backpacking', 'Wild Camping'].includes(a)),
        },
        {
            category: 'Hygiene',
            items: ['Toilet paper', 'Hand sanitizer', 'Toothbrush', 'Biodegradable soap'],
            condition: (trip) => trip.duration_days > 1,
        },
        {
            category: 'Insect Protection',
            items: ['Insect repellent'],
            condition: (trip) =>
                (trip.expected_temp_max !== null && trip.expected_temp_max > 15) &&
                trip.expected_weather !== 'Snowy',
        },
        {
            category: 'Tools',
            items: ['Multi-tool', 'Knife'],
        },
    ];

    /**
     * Generate gear recommendations for a trip based on user's existing gear
     * and catalog items
     */
    generateRecommendations(
        trip: Trip,
        userGear: GearItem[],
        catalogGear: GearItem[]
    ): RecommendedGear[] {
        const recommendations: RecommendedGear[] = [];
        const userGearByCategory = this.groupByCategory(userGear);

        for (const rule of this.rules) {
            // Check if rule condition is met
            if (rule.condition && !rule.condition(trip)) {
                continue;
            }

            const quantity = rule.quantity ? rule.quantity(trip) : 1;
            const categoryGear = userGearByCategory[rule.category] || [];

            // Check if user has items in this category
            if (categoryGear.length === 0) {
                // User doesn't have any items in this category
                // Recommend from catalog or suggest category
                const catalogItems = catalogGear.filter(
                    (item) => item.category_name === rule.category
                );

                if (catalogItems.length > 0) {
                    // Recommend first matching catalog item
                    recommendations.push({
                        category: rule.category,
                        suggestedItems: catalogItems.slice(0, 2), // Top 2 suggestions
                        reason: this.getReasonForRecommendation(rule, trip),
                        quantity,
                        priority: this.getPriority(rule, trip),
                        source: 'catalog',
                    });
                } else {
                    // No catalog items, just suggest the category
                    recommendations.push({
                        category: rule.category,
                        suggestedItems: [],
                        reason: this.getReasonForRecommendation(rule, trip),
                        quantity,
                        priority: this.getPriority(rule, trip),
                        source: 'suggestion',
                    });
                }
            } else if (quantity > categoryGear.length) {
                // User has some items but might need more
                recommendations.push({
                    category: rule.category,
                    suggestedItems: categoryGear,
                    reason: `Consider adding ${quantity - categoryGear.length} more items`,
                    quantity,
                    priority: 'low',
                    source: 'user',
                });
            }
        }

        // Sort by priority
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    private groupByCategory(gear: GearItem[]): Record<string, GearItem[]> {
        return gear.reduce((acc, item) => {
            const category = item.category_name || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, GearItem[]>);
    }

    private getReasonForRecommendation(rule: RecommendationRule, trip: Trip): string {
        // Activity-based reasons
        if (rule.category === 'Climbing Gear') {
            return 'Essential for climbing activities';
        }
        if (rule.category === 'Water Sports') {
            return 'Required for water activities';
        }
        if (rule.category === 'Winter Sports') {
            return 'Needed for cold weather or winter activities';
        }
        if (rule.category === 'Fishing') {
            return 'Required for fishing';
        }
        if (rule.category === 'Biking') {
            return 'Essential for biking safety';
        }

        // Weather-based reasons
        if (rule.category === 'Sun Protection') {
            return 'Recommended for sunny weather';
        }
        if (rule.category === 'Clothing - Outer Layer' && trip.expected_weather === 'Rainy') {
            return 'Rain protection needed';
        }
        if (rule.category === 'Clothing - Insulation') {
            return 'Warmth needed for cold temperatures';
        }

        // Duration-based reasons
        if (rule.category === 'Shelter' || rule.category === 'Cooking') {
            return 'Required for overnight trips';
        }
        if (rule.category === 'Hygiene') {
            return 'Essential for multi-day trips';
        }

        // Quantity-based reasons
        if (rule.category === 'Accessories' || rule.category === 'Clothing - Lower Body') {
            return `Recommended: ${rule.quantity ? rule.quantity(trip) : 1} for ${trip.duration_days}-day trip`;
        }

        return 'Recommended for your trip';
    }

    private getPriority(rule: RecommendationRule, trip: Trip): 'high' | 'medium' | 'low' {
        // High priority for safety items
        if (['First Aid', 'Emergency', 'Navigation', 'Lighting'].includes(rule.category)) {
            return 'high';
        }

        // High priority for activity-specific gear
        if (['Climbing Gear', 'Water Sports', 'Winter Sports'].includes(rule.category)) {
            return 'high';
        }

        // High priority for shelter and warmth in cold weather
        if (rule.category === 'Shelter' ||
            (rule.category === 'Clothing - Insulation' &&
                trip.expected_temp_min !== null &&
                trip.expected_temp_min < 5)) {
            return 'high';
        }

        // Medium priority for comfort and hygiene
        if (['Hygiene', 'Cooking', 'Hydration', 'Water Treatment'].includes(rule.category)) {
            return 'medium';
        }

        // Everything else is low priority
        return 'low';
    }
}

export interface RecommendedGear {
    category: string;
    suggestedItems: GearItem[];
    reason: string;
    quantity: number;
    priority: 'high' | 'medium' | 'low';
    source: 'catalog' | 'user' | 'suggestion';
}

export default new RecommendationService();