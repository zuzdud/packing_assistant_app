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
    Trash2,
    Package,
    CheckCircle,
    Circle,
    Plus,
    Lightbulb,
    PauseCircle,
    PlayCircle,
    CheckCheck,
    Pencil,
} from 'lucide-react-native';
import tripService, { Trip, TripGear } from '../../../services/trip.service';

export default function TripDetailScreen() {
    const { id } = useLocalSearchParams();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showUsedColumn, setShowUsedColumn] = useState(false);
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
            setShowUsedColumn(data.status === 'in_progress');
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

    const toggleUsed = async (gearId: number, currentStatus: boolean) => {
        try {
            await tripService.updateGearStatus(Number(id), gearId, {
                used: !currentStatus,
            });
            loadTripDetail();
        } catch (error) {
            Alert.alert('Error', 'Failed to update gear status');
        }
    };

    const handleDeleteGear = (gearId: number, gearName: string) => {
        Alert.alert(
            'Remove Gear',
            `Remove "${gearName}" from this trip?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await tripService.removeGearFromTrip(Number(id), gearId);
                            loadTripDetail();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove gear');
                        }
                    },
                },
            ]
        );
    };

    const changeStatus = async (newStatus: 'planned' | 'in_progress' | 'completed') => {
        if (!trip) return;

        if (newStatus === 'in_progress') {
            setShowUsedColumn(true);
            Alert.alert(
                'Mark in progress',
                'You will now be able to mark items as used. After completing trip, usage stats will be updated to improve future recommendations.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            try {
                                await tripService.updateTrip(Number(id), { status: newStatus } as any);
                                loadTripDetail();
                            } catch (error) {
                                Alert.alert('Error', 'Failed to update trip status');
                            }
                        },
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
            return;
        }

        if (newStatus === 'completed') {
            setShowUsedColumn(true);
            Alert.alert(
                'Complete trip',
                'Your usage stats will be updated to improve future recommendations.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            try {
                                await tripService.completeTrip(Number(id));
                                loadTripDetail();
                            } catch (error) {
                                Alert.alert('Error', 'Failed to update trip status');
                            }
                        },
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
            return;
        }

        try {
            await tripService.updateTrip(Number(id), { status: newStatus } as any);
            loadTripDetail();
        } catch (error) {
            Alert.alert('Error', 'Failed to update trip status');
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'planned':
                return <PauseCircle size={20} color="white" />;
            case 'in_progress':
                return <PlayCircle size={20} color="white" />;
            case 'completed':
                return <CheckCheck size={20} color="white" />;
            default:
                return null;
        }
    };

    const renderGearItem = (item: TripGear) => (
        <View key={item.id} style={styles.gearItem}>
            <TouchableOpacity
                key={item.id}
                style={styles.gearItemLeft}
                onPress={() => togglePacked(item.gear, item.packed)}
            >

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
                    {item.quantity >= 1 && (
                        <Text style={styles.quantityBadge}>Qty: {item.quantity}</Text>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.gearItemRight}>
                {item.gear_weight && (
                    <Text style={styles.gearWeight}>{item.gear_weight}g</Text>
                )}

                {showUsedColumn && (
                    <TouchableOpacity

                        onPress={() => toggleUsed(item.gear, item.used)}
                    >
                        {item.used ? (
                            <CheckCircle size={20} color="#10b981" />
                        ) : (
                            <Circle size={20} color="#ccc" />
                        )}
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.deleteGearButton}
                    onPress={() => handleDeleteGear(item.gear, item.gear_name)}
                >
                    <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </View>
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

                {/* Status Selector */}
                <View style={styles.statusSelector}>
                    <TouchableOpacity
                        style={[
                            styles.statusOption,
                            { backgroundColor: trip.status === 'planned' ? '#3b82f6' : '#f0f0f0' },
                        ]}
                        onPress={() => changeStatus('planned')}
                    >
                        {trip.status === 'planned' && getStatusIcon('planned')}
                        <Text
                            style={[
                                styles.statusOptionText,
                                { color: trip.status === 'planned' ? 'white' : '#666' },
                            ]}
                        >
                            Planned
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusOption,
                            { backgroundColor: trip.status === 'in_progress' ? '#f59e0b' : '#f0f0f0' },
                        ]}
                        onPress={() => changeStatus('in_progress')}
                    >
                        {trip.status === 'in_progress' && getStatusIcon('in_progress')}
                        <Text
                            style={[
                                styles.statusOptionText,
                                { color: trip.status === 'in_progress' ? 'white' : '#666' },
                            ]}
                        >
                            In Progress
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusOption,
                            { backgroundColor: trip.status === 'completed' ? '#10b981' : '#f0f0f0' },
                        ]}
                        onPress={() => changeStatus('completed')}
                    >
                        {trip.status === 'completed' && getStatusIcon('completed')}
                        <Text
                            style={[
                                styles.statusOptionText,
                                { color: trip.status === 'completed' ? 'white' : '#666' },
                            ]}
                        >
                            Completed
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Trip Details */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trip Details</Text>
                    <TouchableOpacity
                        style={styles.addGearButton}
                        onPress={() => router.push({
                            pathname: `/trips/edit/[id]`, params: { id: id.toString() }
                        })}
                    >
                        <Pencil size={20} color="#2d5016" />
                    </TouchableOpacity>
                </View>

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

            {/* Recommendations Button */}
            <TouchableOpacity
                style={styles.recommendationsButton}
                onPress={() => router.push({ pathname: `/trips/[id]/recommendations`, params: { id: id.toString() } })}
            >
                <Lightbulb size={20} color="#2d5016" />
                <Text style={styles.recommendationsButtonText}>
                    Get Packing Recommendations
                </Text>
            </TouchableOpacity>

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

            {/* Delete trip button */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 size={20} color="white" />
                    <Text style={styles.buttonText}>Delete trip</Text>
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
    recommendationsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    recommendationsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d5016',
    },
    gearItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteGearButton: {
        padding: 4,
    },
    quantityBadge: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
    },

    statusSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    statusOption: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    statusOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },

});