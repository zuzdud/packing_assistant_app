import tripService, { Trip } from "@/services/trip.service";
import { useRouter } from "expo-router";
import { Calendar, MapPin, Package } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text, RefreshControl } from "react-native";

export default function TripListScreen() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleOnPress = () => {
        Alert.alert('Navigation Placeholder', 'Back to login screen.');
    };

    useEffect(() => {
        loadTrips();
    }, []);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTrips();
        setRefreshing(false);
    }, []);

    const loadTrips = async () => {
        try {
            // const statusFilter = filter === 'all' ? undefined : filter;
            const data = await tripService.getTrips();
            setTrips(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load trips');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned':
                return '#3b82f6';
            case 'in_progress':
                return '#f59e0b';
            case 'completed':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'planned':
                return 'Planned';
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    const renderTripItem = ({ item }: { item: Trip }) => (
        <TouchableOpacity
            style={styles.tripCard}
            onPress={handleOnPress}
        >
            <View style={styles.tripHeader}>
                <Text style={styles.tripTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            {item.location && (
                <View style={styles.tripDetail}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.tripDetailText}>{item.location}</Text>
                </View>
            )}

            <View style={styles.tripDetail}>
                <Calendar size={16} color="#666" />
                <Text style={styles.tripDetailText}>
                    {new Date(item.start_date).toLocaleDateString()} -{' '}
                    {new Date(item.end_date).toLocaleDateString()} ({item.duration_days} days)
                </Text>
            </View>

            <View style={styles.tripDetail}>
                <Package size={16} color="#666" />
                <Text style={styles.tripDetailText}>
                    {item.packed_count}/{item.gear_count} packed
                </Text>
            </View>

            {item.activities && item.activities.length > 0 && (
                <View style={styles.activitiesContainer}>
                    {item.activities.slice(0, 3).map((activity, index) => (
                        <View key={index} style={styles.activityChip}>
                            <Text style={styles.activityText}>{activity}</Text>
                        </View>
                    ))}
                    {item.activities.length > 3 && (
                        <Text style={styles.moreActivities}>+{item.activities.length - 3} more</Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            {/* Trip List */}
            <FlatList
                data={trips}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTripItem}
                contentContainerStyle={styles.tripList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Calendar size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No trips yet</Text>
                        <Text style={styles.emptySubtext}>
                            Create your first trip to get started
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tripList: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    tripCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tripTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    tripDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tripDetailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        alignItems: 'center',
    },
    activityChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 4,
    },
    activityText: {
        fontSize: 12,
        color: '#666',
    },
    moreActivities: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },

    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },

});