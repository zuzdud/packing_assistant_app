from django.core.management.base import BaseCommand
from gear.models import Category, ActivityType


class Command(BaseCommand):
    help = 'Seeds the database with initial categories and activities'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding categories...')
        categories_data = [
            {'name': 'Shelter', 'description': 'Tents, tarps, bivies', 'icon': 'tent'},
            {'name': 'Sleep System', 'description': 'Sleeping bags, pads, pillows', 'icon': 'bed'},
            {'name': 'Backpacks', 'description': 'Daypacks and multi-day packs', 'icon': 'backpack'},
            {'name': 'Clothing - Base Layer', 'description': 'Base layer tops and bottoms', 'icon': 'shirt'},
            {'name': 'Clothing - Mid Layer', 'description': 'Fleece, insulated layers', 'icon': 'layers'},
            {'name': 'Clothing - Outer Layer', 'description': 'Rain jackets, windbreakers', 'icon': 'cloud-rain'},
            {'name': 'Clothing - Insulation', 'description': 'Down and synthetic jackets', 'icon': 'shield'},
            {'name': 'Clothing - Lower Body', 'description': 'Pants, shorts, underwear', 'icon': 'user'},
            {'name': 'Footwear', 'description': 'Boots, shoes, sandals', 'icon': 'footprints'},
            {'name': 'Headwear', 'description': 'Hats, beanies, buffs', 'icon': 'crown'},
            {'name': 'Handwear', 'description': 'Gloves and mittens', 'icon': 'hand'},
            {'name': 'Accessories', 'description': 'Gaiters, socks, etc.', 'icon': 'package'},
            {'name': 'Cooking', 'description': 'Stoves, pots, utensils', 'icon': 'cooking-pot'},
            {'name': 'Food Storage', 'description': 'Bear canisters, bags', 'icon': 'container'},
            {'name': 'Hydration', 'description': 'Water bottles, bladders', 'icon': 'droplet'},
            {'name': 'Water Treatment', 'description': 'Filters, purifiers', 'icon': 'filter'},
            {'name': 'Navigation', 'description': 'Maps, compass, GPS', 'icon': 'compass'},
            {'name': 'Lighting', 'description': 'Headlamps, flashlights', 'icon': 'flashlight'},
            {'name': 'First Aid', 'description': 'Medical supplies', 'icon': 'heart-pulse'},
            {'name': 'Emergency', 'description': 'Emergency shelter, signals', 'icon': 'siren'},
            {'name': 'Tools', 'description': 'Multi-tools, knives, repair kits', 'icon': 'wrench'},
            {'name': 'Fire', 'description': 'Lighters, matches, fire starters', 'icon': 'flame'},
            {'name': 'Hygiene', 'description': 'Toiletries, towels', 'icon': 'spray-can'},
            {'name': 'Sun Protection', 'description': 'Sunscreen, lip balm, sunglasses', 'icon': 'sun'},
            {'name': 'Insect Protection', 'description': 'Repellent, head nets', 'icon': 'bug'},
            {'name': 'Electronics', 'description': 'Phones, cameras, chargers', 'icon': 'smartphone'},
            {'name': 'Power', 'description': 'Power banks, solar panels', 'icon': 'battery-charging'},
            {'name': 'Climbing Gear', 'description': 'Ropes, harnesses, carabiners', 'icon': 'mountain'},
            {'name': 'Water Sports', 'description': 'Paddles, PFDs, dry bags', 'icon': 'waves'},
            {'name': 'Winter Sports', 'description': 'Crampons, ice axes, avalanche gear', 'icon': 'snowflake'},
            {'name': 'Biking', 'description': 'Helmets, repair tools', 'icon': 'bike'},
            {'name': 'Fishing', 'description': 'Rods, tackle, licenses', 'icon': 'fish'},
            {'name': 'Trekking', 'description': 'Trekking poles, sit pads', 'icon': 'hiking'},
            {'name': 'Camp Comfort', 'description': 'Chairs, games, books', 'icon': 'armchair'},
            {'name': 'Miscellaneous', 'description': 'Other items', 'icon': 'box'},
        ]

        created_count = 0
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'icon': cat_data['icon']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created category: {category.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'✓ Created {created_count} new categories'))

        # Seed Activities
        self.stdout.write('\nSeeding activities...')
        activities_data = [
            {
                'name': 'Hiking',
                'description': 'Day hiking on trails',
                'typical_gear_categories': ['Backpacks', 'Footwear', 'Hydration', 'Navigation', 'First Aid']
            },
            {
                'name': 'Backpacking',
                'description': 'Multi-day hiking with overnight stays',
                'typical_gear_categories': ['Backpacks', 'Shelter', 'Sleep System', 'Cooking', 'Water Treatment']
            },
            {
                'name': 'Camping',
                'description': 'Car camping or base camping',
                'typical_gear_categories': ['Shelter', 'Sleep System', 'Cooking', 'Camp Comfort']
            },
            {
                'name': 'Wild Camping',
                'description': 'Backcountry camping',
                'typical_gear_categories': ['Shelter', 'Sleep System', 'Cooking', 'Water Treatment', 'Navigation']
            },
            {
                'name': 'Rock Climbing',
                'description': 'Sport and trad climbing',
                'typical_gear_categories': ['Climbing Gear', 'Footwear', 'First Aid']
            },
            {
                'name': 'Mountaineering',
                'description': 'High-altitude mountain climbing',
                'typical_gear_categories': ['Climbing Gear', 'Winter Sports', 'Navigation', 'Emergency']
            },
            {
                'name': 'Bouldering',
                'description': 'Low-height rock climbing without ropes',
                'typical_gear_categories': ['Climbing Gear', 'Footwear']
            },
            {
                'name': 'Kayaking',
                'description': 'Paddling in kayaks',
                'typical_gear_categories': ['Water Sports', 'Hydration', 'Sun Protection']
            },
            {
                'name': 'Canoeing',
                'description': 'Paddling in canoes',
                'typical_gear_categories': ['Water Sports', 'Hydration', 'Food Storage']
            },
            {
                'name': 'Rafting',
                'description': 'White water rafting',
                'typical_gear_categories': ['Water Sports', 'Emergency']
            },
            {
                'name': 'Stand-up Paddleboarding',
                'description': 'SUP on lakes and oceans',
                'typical_gear_categories': ['Water Sports', 'Sun Protection']
            },
            {
                'name': 'Fishing',
                'description': 'Recreational fishing',
                'typical_gear_categories': ['Fishing', 'Sun Protection', 'Hydration']
            },
            {
                'name': 'Alpine Skiing',
                'description': 'Downhill skiing',
                'typical_gear_categories': ['Winter Sports', 'Clothing - Insulation', 'Handwear']
            },
            {
                'name': 'Cross-country Skiing',
                'description': 'Nordic skiing',
                'typical_gear_categories': ['Winter Sports', 'Clothing - Base Layer', 'Clothing - Mid Layer']
            },
            {
                'name': 'Snowboarding',
                'description': 'Snowboarding on slopes',
                'typical_gear_categories': ['Winter Sports', 'Clothing - Insulation', 'Handwear']
            },
            {
                'name': 'Snowshoeing',
                'description': 'Winter hiking with snowshoes',
                'typical_gear_categories': ['Winter Sports', 'Trekking', 'Clothing - Insulation']
            },
            {
                'name': 'Winter Camping',
                'description': 'Camping in snow and cold',
                'typical_gear_categories': ['Shelter', 'Sleep System', 'Winter Sports', 'Cooking']
            },
            {
                'name': 'Trail Running',
                'description': 'Running on trails',
                'typical_gear_categories': ['Footwear', 'Hydration', 'Clothing - Base Layer']
            },
            {
                'name': 'Mountain Biking',
                'description': 'Off-road cycling',
                'typical_gear_categories': ['Biking', 'First Aid', 'Hydration']
            },
            {
                'name': 'Bikepacking',
                'description': 'Multi-day bike touring',
                'typical_gear_categories': ['Biking', 'Backpacks', 'Shelter', 'Sleep System']
            },
            {
                'name': 'Beach Camping',
                'description': 'Camping at beaches',
                'typical_gear_categories': ['Shelter', 'Sleep System', 'Sun Protection']
            },
            {
                'name': 'Wildlife Photography',
                'description': 'Outdoor photography',
                'typical_gear_categories': ['Electronics', 'Backpacks', 'Clothing - Outer Layer']
            },
        ]

        created_count = 0
        for act_data in activities_data:
            activity, created = ActivityType.objects.get_or_create(
                name=act_data['name'],
                defaults={
                    'description': act_data['description'],
                    'typical_gear_categories': act_data['typical_gear_categories']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  Created activity: {activity.name}'))
        
        self.stdout.write(self.style.SUCCESS(f' Created {created_count} new activities'))
        self.stdout.write(self.style.SUCCESS('\n Database seeding completed!'))