import { Tabs } from "expo-router";
import { Package } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2d5016',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
                backgroundColor: 'white',
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
            },
            headerStyle: {
                backgroundColor: '#2d5016',
            },
            headerTintColor: 'white',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}
        >
            <Tabs.Screen name="gear"
                options={{
                    title: 'My Gear',
                    tabBarIcon: ({ color, size }) => (
                        <Package size={size} color={color} />
                    ),
                }} />
        </Tabs>
    )
}