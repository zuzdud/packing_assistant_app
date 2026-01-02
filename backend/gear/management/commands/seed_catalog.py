from django.core.management.base import BaseCommand
from gear.models import Category, GearCatalog


class Command(BaseCommand):
    help = 'Seeds the database with common gear catalog items'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding gear catalog...')

        # Get categories
        categories = {cat.name: cat for cat in Category.objects.all()}

        catalog_items = [
            # Shelter
            {'name': 'Backpacking Tent (2-person)', 'category': 'Shelter', 'weight': 2000,
             'activities': ['Backpacking', 'Camping', 'Wild Camping'], 'weather': ['Rainy', 'Sunny', 'Cloudy']},
            {'name': 'Ultralight Tarp', 'category': 'Shelter', 'weight': 400,
             'activities': ['Backpacking', 'Wild Camping'], 'weather': ['Sunny', 'Cloudy']},
            {'name': 'Hammock with Bug Net', 'category': 'Shelter', 'weight': 800,
             'activities': ['Camping', 'Backpacking'], 'weather': ['Sunny', 'Cloudy']},

            # Sleep System
            {'name': 'Sleeping Bag (0°C)', 'category': 'Sleep System', 'weight': 1200,
             'activities': ['Camping', 'Backpacking'], 'weather': ['Cloudy', 'Rainy']},
            {'name': 'Sleeping Bag (-10°C)', 'category': 'Sleep System', 'weight': 1600,
             'activities': ['Winter Camping', 'Mountaineering'], 'weather': ['Snowy']},
            {'name': 'Sleeping Pad (Inflatable)', 'category': 'Sleep System', 'weight': 450,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Camping Pillow', 'category': 'Sleep System', 'weight': 150,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # Backpacks
            {'name': 'Day Pack (20L)', 'category': 'Backpacks', 'weight': 600,
             'activities': ['Hiking', 'Trail Running'], 'weather': []},
            {'name': 'Backpacking Pack (65L)', 'category': 'Backpacks', 'weight': 2200,
             'activities': ['Backpacking', 'Mountaineering'], 'weather': []},

            # Clothing - Base Layer
            {'name': 'Merino Wool Base Layer Top', 'category': 'Clothing - Base Layer', 'weight': 200,
             'activities': ['Hiking', 'Backpacking', 'Mountaineering'], 'weather': []},
            {'name': 'Merino Wool Base Layer Bottom', 'category': 'Clothing - Base Layer', 'weight': 180,
             'activities': ['Hiking', 'Backpacking', 'Mountaineering'], 'weather': []},
            {'name': 'Synthetic Base Layer Top', 'category': 'Clothing - Base Layer', 'weight': 150,
             'activities': ['Hiking', 'Trail Running'], 'weather': []},

            # Clothing - Mid Layer
            {'name': 'Fleece Jacket', 'category': 'Clothing - Mid Layer', 'weight': 400,
             'activities': ['Hiking', 'Camping'], 'weather': ['Cloudy', 'Windy']},
            {'name': 'Synthetic Insulated Jacket', 'category': 'Clothing - Mid Layer', 'weight': 500,
             'activities': ['Mountaineering', 'Winter Camping'], 'weather': ['Snowy', 'Windy']},

            # Clothing - Outer Layer
            {'name': 'Rain Jacket (Waterproof)', 'category': 'Clothing - Outer Layer', 'weight': 300,
             'activities': ['Hiking', 'Backpacking'], 'weather': ['Rainy']},
            {'name': 'Rain Pants', 'category': 'Clothing - Outer Layer', 'weight': 250,
             'activities': ['Hiking', 'Backpacking'], 'weather': ['Rainy']},
            {'name': 'Windbreaker', 'category': 'Clothing - Outer Layer', 'weight': 200,
             'activities': ['Trail Running', 'Hiking'], 'weather': ['Windy']},

            # Clothing - Insulation
            {'name': 'Down Jacket (800-fill)', 'category': 'Clothing - Insulation', 'weight': 350,
             'activities': ['Mountaineering', 'Winter Camping'], 'weather': ['Snowy']},
            {'name': 'Puffy Vest', 'category': 'Clothing - Insulation', 'weight': 250,
             'activities': ['Hiking', 'Camping'], 'weather': ['Cloudy']},

            # Clothing - Lower Body
            {'name': 'Hiking Pants (Convertible)', 'category': 'Clothing - Lower Body', 'weight': 300,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},
            {'name': 'Hiking Shorts', 'category': 'Clothing - Lower Body', 'weight': 150,
             'activities': ['Hiking', 'Trail Running'], 'weather': ['Sunny']},
            {'name': 'Underwear (Merino Wool)', 'category': 'Clothing - Lower Body', 'weight': 50,
             'activities': [], 'weather': []},

            # Footwear
            {'name': 'Hiking Boots (Mid-cut)', 'category': 'Footwear', 'weight': 1200,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},
            {'name': 'Trail Running Shoes', 'category': 'Footwear', 'weight': 600,
             'activities': ['Trail Running', 'Hiking'], 'weather': []},
            {'name': 'Camp Sandals', 'category': 'Footwear', 'weight': 400,
             'activities': ['Camping'], 'weather': ['Sunny']},

            # Headwear
            {'name': 'Sun Hat (Wide Brim)', 'category': 'Headwear', 'weight': 100,
             'activities': ['Hiking'], 'weather': ['Sunny']},
            {'name': 'Warm Beanie', 'category': 'Headwear', 'weight': 80,
             'activities': ['Winter Camping', 'Mountaineering'], 'weather': ['Snowy']},
            {'name': 'Buff/Neck Gaiter', 'category': 'Headwear', 'weight': 50,
             'activities': ['Hiking', 'Trail Running'], 'weather': []},

            # Handwear
            {'name': 'Liner Gloves', 'category': 'Handwear', 'weight': 50,
             'activities': ['Hiking', 'Mountaineering'], 'weather': ['Snowy', 'Windy']},
            {'name': 'Insulated Gloves', 'category': 'Handwear', 'weight': 150,
             'activities': ['Winter Camping', 'Mountaineering'], 'weather': ['Snowy']},

            # Accessories
            {'name': 'Hiking Socks (Merino)', 'category': 'Accessories', 'weight': 70,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},
            {'name': 'Gaiters', 'category': 'Accessories', 'weight': 150,
             'activities': ['Hiking', 'Mountaineering'], 'weather': ['Snowy', 'Rainy']},

            # Cooking
            {'name': 'Camping Stove (Canister)', 'category': 'Cooking', 'weight': 200,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Fuel Canister (110g)', 'category': 'Cooking', 'weight': 200,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Camping Pot (1L)', 'category': 'Cooking', 'weight': 300,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Titanium Spork', 'category': 'Cooking', 'weight': 20,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # Food Storage
            {'name': 'Bear Canister', 'category': 'Food Storage', 'weight': 1000,
             'activities': ['Backpacking', 'Wild Camping'], 'weather': []},
            {'name': 'Food Storage Bag (Odor-proof)', 'category': 'Food Storage', 'weight': 50,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # Hydration
            {'name': 'Water Bottle (1L)', 'category': 'Hydration', 'weight': 150,
             'activities': ['Hiking', 'Camping'], 'weather': []},
            {'name': 'Hydration Bladder (2L)', 'category': 'Hydration', 'weight': 200,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},

            # Water Treatment
            {'name': 'Water Filter (Squeeze)', 'category': 'Water Treatment', 'weight': 100,
             'activities': ['Backpacking', 'Camping'], 'weather': []},
            {'name': 'Water Purification Tablets', 'category': 'Water Treatment', 'weight': 20,
             'activities': ['Backpacking', 'Emergency'], 'weather': []},

            # Navigation
            {'name': 'Topographic Map', 'category': 'Navigation', 'weight': 50,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},
            {'name': 'Compass', 'category': 'Navigation', 'weight': 40,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},
            {'name': 'GPS Device', 'category': 'Navigation', 'weight': 150,
             'activities': ['Hiking', 'Mountaineering'], 'weather': []},

            # Lighting
            {'name': 'Headlamp (LED)', 'category': 'Lighting', 'weight': 80,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Spare Batteries (AAA)', 'category': 'Lighting', 'weight': 50,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # First Aid
            {'name': 'First Aid Kit (Comprehensive)', 'category': 'First Aid', 'weight': 300,
             'activities': [], 'weather': []},
            {'name': 'Blister Kit', 'category': 'First Aid', 'weight': 50,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},

            # Emergency
            {'name': 'Emergency Whistle', 'category': 'Emergency', 'weight': 10,
             'activities': [], 'weather': []},
            {'name': 'Emergency Blanket', 'category': 'Emergency', 'weight': 60,
             'activities': [], 'weather': []},
            {'name': 'Signal Mirror', 'category': 'Emergency', 'weight': 30,
             'activities': ['Backpacking', 'Mountaineering'], 'weather': []},

            # Tools
            {'name': 'Multi-tool', 'category': 'Tools', 'weight': 150,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Pocket Knife', 'category': 'Tools', 'weight': 80,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Repair Kit (Tent/Pad)', 'category': 'Tools', 'weight': 100,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # Fire
            {'name': 'Lighter (Waterproof)', 'category': 'Fire', 'weight': 20,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Waterproof Matches', 'category': 'Fire', 'weight': 30,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Fire Starter', 'category': 'Fire', 'weight': 50,
             'activities': ['Camping', 'Winter Camping'], 'weather': []},

            # Hygiene
            {'name': 'Toilet Paper', 'category': 'Hygiene', 'weight': 50,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Trowel (Backpacking)', 'category': 'Hygiene', 'weight': 80,
             'activities': ['Backpacking', 'Wild Camping'], 'weather': []},
            {'name': 'Biodegradable Soap', 'category': 'Hygiene', 'weight': 100,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Toothbrush & Toothpaste', 'category': 'Hygiene', 'weight': 50,
             'activities': ['Camping', 'Backpacking'], 'weather': []},

            # Sun Protection
            {'name': 'Sunscreen (SPF 50+)', 'category': 'Sun Protection', 'weight': 100,
             'activities': ['Hiking', 'Camping'], 'weather': ['Sunny']},
            {'name': 'Lip Balm (SPF)', 'category': 'Sun Protection', 'weight': 10,
             'activities': ['Hiking', 'Camping'], 'weather': ['Sunny']},
            {'name': 'Sunglasses (UV Protection)', 'category': 'Sun Protection', 'weight': 30,
             'activities': ['Hiking', 'Mountaineering'], 'weather': ['Sunny']},

            # Insect Protection
            {'name': 'Insect Repellent', 'category': 'Insect Protection', 'weight': 100,
             'activities': ['Camping', 'Backpacking'], 'weather': ['Sunny', 'Cloudy']},
            {'name': 'Head Net', 'category': 'Insect Protection', 'weight': 30,
             'activities': ['Camping', 'Backpacking'], 'weather': ['Sunny', 'Cloudy']},

            # Trekking
            {'name': 'Trekking Poles (Pair)', 'category': 'Trekking', 'weight': 500,
             'activities': ['Hiking', 'Backpacking', 'Mountaineering'], 'weather': []},
            {'name': 'Sit Pad', 'category': 'Trekking', 'weight': 50,
             'activities': ['Hiking', 'Backpacking'], 'weather': []},

            # Climbing Gear
            {'name': 'Climbing Harness', 'category': 'Climbing Gear', 'weight': 400,
             'activities': ['Rock Climbing', 'Mountaineering'], 'weather': []},
            {'name': 'Climbing Helmet', 'category': 'Climbing Gear', 'weight': 350,
             'activities': ['Rock Climbing', 'Mountaineering'], 'weather': []},
            {'name': 'Climbing Rope (60m)', 'category': 'Climbing Gear', 'weight': 4000,
             'activities': ['Rock Climbing', 'Mountaineering'], 'weather': []},
            {'name': 'Carabiners (Set of 5)', 'category': 'Climbing Gear', 'weight': 300,
             'activities': ['Rock Climbing', 'Mountaineering'], 'weather': []},

            # Winter Sports
            {'name': 'Crampons', 'category': 'Winter Sports', 'weight': 800,
             'activities': ['Mountaineering', 'Winter Camping'], 'weather': ['Snowy']},
            {'name': 'Ice Axe', 'category': 'Winter Sports', 'weight': 500,
             'activities': ['Mountaineering', 'Winter Camping'], 'weather': ['Snowy']},
            {'name': 'Avalanche Beacon', 'category': 'Winter Sports', 'weight': 250,
             'activities': ['Mountaineering', 'Snowshoeing'], 'weather': ['Snowy']},

            # Water Sports
            {'name': 'Life Jacket (PFD)', 'category': 'Water Sports', 'weight': 600,
             'activities': ['Kayaking', 'Canoeing', 'Rafting'], 'weather': []},
            {'name': 'Paddle', 'category': 'Water Sports', 'weight': 1000,
             'activities': ['Kayaking', 'Canoeing'], 'weather': []},
            {'name': 'Dry Bag (20L)', 'category': 'Water Sports', 'weight': 200,
             'activities': ['Kayaking', 'Canoeing', 'Rafting'], 'weather': []},

            # Fishing
            {'name': 'Fishing Rod (Collapsible)', 'category': 'Fishing', 'weight': 300,
             'activities': ['Fishing'], 'weather': []},
            {'name': 'Fishing Tackle Box', 'category': 'Fishing', 'weight': 500,
             'activities': ['Fishing'], 'weather': []},

            # Biking
            {'name': 'Bike Helmet', 'category': 'Biking', 'weight': 300,
             'activities': ['Mountain Biking', 'Bikepacking'], 'weather': []},
            {'name': 'Bike Repair Kit', 'category': 'Biking', 'weight': 200,
             'activities': ['Mountain Biking', 'Bikepacking'], 'weather': []},

            # Electronics & Power
            {'name': 'Smartphone', 'category': 'Electronics', 'weight': 200,
             'activities': [], 'weather': []},
            {'name': 'Camera', 'category': 'Electronics', 'weight': 500,
             'activities': ['Wildlife Photography'], 'weather': []},
            {'name': 'Power Bank (10000mAh)', 'category': 'Power', 'weight': 250,
             'activities': ['Camping', 'Backpacking'], 'weather': []},
            {'name': 'Solar Panel (Portable)', 'category': 'Power', 'weight': 400,
             'activities': ['Backpacking', 'Bikepacking'], 'weather': ['Sunny']},
        ]

        created_count = 0
        for item_data in catalog_items:
            category_name = item_data['category']
            if category_name not in categories:
                self.stdout.write(self.style.WARNING(
                    f'  Category not found: {category_name}'))
                continue

            item, created = GearCatalog.objects.get_or_create(
                name=item_data['name'],
                defaults={
                    'category': categories[category_name],
                    'typical_weight_grams': item_data['weight'],
                    'common_activities': item_data['activities'],
                    'weather_conditions': item_data['weather'],
                    'popularity_score': len(item_data['activities']) * 10,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  Created: {item.name}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Created {created_count} catalog items'))
        self.stdout.write(self.style.SUCCESS(
            '✅ Gear catalog seeding completed!'))
