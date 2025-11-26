import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Calendar,
    MapPin,
    Edit,
    Trash2,
    Package,
    CheckCircle,
    Circle,
    Plus,
} from 'lucide-react-native';
import tripService, { Trip, TripGear } from '../../../services/trip.service';

export default function TripDetailScreen() {
    const { id } = useLocalSearchParams();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const handleNavigation = () => {
        Alert.alert('Navigation Placeholder', 'Screen you want to go to is not implemented yet');
    };

    useEffect(() => {
        loadTripDetail();
    }, [id]);

    const loadTripDetail = async () => {
        try {
            const data = await tripService.getTrip(Number(id));
            setTrip(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load trip details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const togglePacked = async (gearId: number, currentStatus: boolean) => {
        try {
            await tripService.updateGearStatus(Number(id), gearId, {
                packed: !currentStatus,
            });
            loadTripDetail();
        } catch (error) {
            Alert.alert('Error', 'Failed to update gear status');
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await tripService.deleteTrip(Number(id));
                        router.back();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete trip');
                    }
                },
            },
        ]);
    };

    const handleCompleteTrip = () => {
        Alert.alert(
            'Complete Trip',
            'Mark this trip as completed? This will update your gear usage statistics.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete',
                    onPress: async () => {
                        try {
                            await tripService.completeTrip(Number(id));
                            loadTripDetail();
                            Alert.alert('Success', 'Trip completed! Usage stats updated.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to complete trip');
                        }
                    },
                },
            ]
        );
    };

    const renderGearItem = (item: TripGear) => (
        <TouchableOpacity
            key={item.id}
            style={styles.gearItem}
            onPress={() => togglePacked(item.gear, item.packed)}
        >
            <View style={styles.gearItemLeft}>
                {item.packed ? (
                    <CheckCircle size={24} color="#10b981" />
                ) : (
                    <Circle size={24} color="#ccc" />
                )}
                {item.gear_photo ? (
                    <Image source={{ uri: item.gear_photo }} style={styles.gearThumbnail} />
                ) : (
                    <View style={styles.gearPlaceholder}>
                        <Package size={20} color="#999" />
                    </View>
                )}
                <View style={styles.gearInfo}>
                    <Text style={styles.gearName}>{item.gear_name}</Text>
                    <Text style={styles.gearCategory}>{item.gear_category}</Text>
                </View>
            </View>
            {item.gear_weight && (
                <Text style={styles.gearWeight}>{item.gear_weight}g</Text>
            )}
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2d5016" />
            </View>
        );
    }

    if (!trip) {
        return null;
    }

    const totalWeight = trip.gear_items
        .filter((item) => item.packed)
        .reduce((sum, item) => sum + (item.gear_weight || 0), 0);

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadTripDetail} />}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{trip.title}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{trip.status.replace('_', ' ')}</Text>
                </View>
            </View>

            {/* Trip Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trip Details</Text>

                {trip.location && (
                    <View style={styles.detailRow}>
                        <MapPin size={20} color="#666" />
                        <Text style={styles.detailText}>{trip.location}</Text>
                    </View>
                )}

                <View style={styles.detailRow}>
                    <Calendar size={20} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(trip.start_date).toLocaleDateString()} -{' '}
                        {new Date(trip.end_date).toLocaleDateString()}
                    </Text>
                </View>

                <Text style={styles.detailText}>Duration: {trip.duration_days} days</Text>

                {trip.description && (
                    <Text style={styles.description}>{trip.description}</Text>
                )}

                {trip.activities && trip.activities.length > 0 && (
                    <View style={styles.activitiesContainer}>
                        {trip.activities.map((activity, index) => (
                            <View key={index} style={styles.activityChip}>
                                <Text style={styles.activityText}>{activity}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {(trip.expected_temp_min || trip.expected_weather) && (
                    <View style={styles.weatherContainer}>
                        {trip.expected_temp_min && trip.expected_temp_max && (
                            <Text style={styles.detailText}>
                                Temp: {trip.expected_temp_min}°C - {trip.expected_temp_max}°C
                            </Text>
                        )}
                        {trip.expected_weather && (
                            <Text style={styles.detailText}>Weather: {trip.expected_weather}</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Packing Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Packing Progress</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {trip.packed_count}/{trip.gear_count}
                        </Text>
                        <Text style={styles.statLabel}>Items Packed</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalWeight}g</Text>
                        <Text style={styles.statLabel}>Total Weight</Text>
                    </View>
                </View>
            </View>

            {/* Gear List */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gear List</Text>
                    <TouchableOpacity
                        style={styles.addGearButton}
                        onPress={() => router.push({ pathname: `/trips/[id]/add-gear`, params: { id: id.toString() } })}
                    >
                        <Plus size={20} color="#2d5016" />
                    </TouchableOpacity>
                </View>

                {trip.gear_items.length === 0 ? (
                    <Text style={styles.emptyText}>No gear added yet</Text>
                ) : (
                    trip.gear_items.map(renderGearItem)
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {trip.status !== 'completed' && (
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteTrip}>
                        <CheckCircle size={20} color="white" />
                        <Text style={styles.buttonText}>Complete Trip</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push({
                        pathname: `/trips/edit/[id]`, params: { id: id.toString() }
                    })}
                >
                    <Edit size={20} color="white" />
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 size={20} color="white" />
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        marginTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        lineHeight: 20,
    },
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
    },
    activityChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    activityText: {
        fontSize: 12,
        color: '#666',
    },
    weatherContainer: {
        marginTop: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d5016',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    gearItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    gearItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gearThumbnail: {
        width: 40,
        height: 40,
        borderRadius: 6,
        marginLeft: 12,
        marginRight: 12,
    },
    gearPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        marginRight: 12,
    },
    gearInfo: {
        flex: 1,
    },
    gearName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    gearCategory: {
        fontSize: 12,
        color: '#999',
    },
    gearWeight: {
        fontSize: 12,
        color: '#666',
    },
    addGearButton: {
        padding: 4,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
    actions: {
        padding: 20,
        gap: 12,
    },
    completeButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#2d5016',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: '#dc2626',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});