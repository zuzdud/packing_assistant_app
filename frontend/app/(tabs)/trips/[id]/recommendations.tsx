import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle, Package, Plus } from 'lucide-react-native';
import tripService from '../../../../services/trip.service';
import gearService, { GearItem } from '../../../../services/gear.service';
import recommendationService, { RecommendedGear } from '../../../../services/recommendation.service';

export default function RecommendationsScreen() {
    const { id } = useLocalSearchParams();
    const [recommendations, setRecommendations] = useState<RecommendedGear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingItems, setAddingItems] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadRecommendations();
    }, [id]);

    const loadRecommendations = async () => {
        try {
            const [trip, userGear, catalogGear] = await Promise.all([
                tripService.getTrip(Number(id)),
                gearService.getGearItems(),
                gearService.getCatalogItems(),
            ]);

            const recs = recommendationService.generateRecommendations(
                trip,
                userGear,
                catalogGear
            );

            setRecommendations(recs);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            Alert.alert('Error', 'Failed to generate recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const addItemToTrip = async (gearItem: GearItem) => {

        const data: any = {
            name: gearItem.name,
            description: gearItem.description,
            category: gearItem.category,
            weight_grams: gearItem.weight_grams,
        };

        setAddingItems(new Set(addingItems).add(gearItem.id));
        try {
            const response = await gearService.createGearItem(data);

            await tripService.addGearToTrip(Number(id), response.id);
            Alert.alert('Success', 'Item added to trip');
            loadRecommendations();
        } catch (error) {
            Alert.alert('Error', 'Failed to add item');
        } finally {
            const newSet = new Set(addingItems);
            newSet.delete(gearItem.id);
            setAddingItems(newSet);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#dc2626';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#3b82f6';
            default:
                return '#6b7280';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <AlertCircle size={20} color="#dc2626" />;
            case 'medium':
                return <AlertCircle size={20} color="#f59e0b" />;
            default:
                return <CheckCircle size={20} color="#3b82f6" />;
        }
    };

    const renderRecommendation = (rec: RecommendedGear, index: number) => (
        <View key={index} style={styles.recommendationCard}>
            <View style={styles.recHeader}>
                <View style={styles.recHeaderLeft}>
                    {getPriorityIcon(rec.priority)}
                    <View style={styles.recHeaderText}>
                        <Text style={styles.recCategory}>{rec.category}</Text>
                        <Text style={styles.recReason}>{rec.reason}</Text>
                    </View>
                </View>
                <View
                    style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(rec.priority) },
                    ]}
                >
                    <Text style={styles.priorityText}>{rec.priority}</Text>
                </View>
            </View>

            {rec.quantity > 1 && (
                <Text style={styles.quantityText}>Recommended quantity: {rec.quantity}</Text>
            )}

            {rec.source === 'suggestion' && (
                <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionText}>
                        💡 Add items in this category to your gear list first
                    </Text>
                </View>
            )}

            {rec.suggestedItems.length > 0 && (
                <View style={styles.itemsContainer}>
                    {rec.suggestedItems.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            {item.photo ? (
                                <Image source={{ uri: item.photo }} style={styles.itemImage} />
                            ) : (
                                <View style={styles.itemPlaceholder}>
                                    <Package size={24} color="#999" />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {item.weight_grams && (
                                    <Text style={styles.itemWeight}>{item.weight_grams}g</Text>
                                )}
                                <Text style={styles.itemSource}>
                                    {rec.source === 'catalog' ? 'From catalog' : 'Your gear'}
                                </Text>
                            </View>
                            {rec.source === 'catalog' || rec.source === 'user' ? (
                                <TouchableOpacity
                                    style={styles.addItemButton}
                                    onPress={() => addItemToTrip(item)}
                                    disabled={addingItems.has(item.id)}
                                >
                                    {addingItems.has(item.id) ? (
                                        <ActivityIndicator size="small" color="#2d5016" />
                                    ) : (
                                        <Plus size={20} color="#2d5016" />
                                    )}
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2d5016" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gear Recommendations</Text>
                <Text style={styles.subtitle}>
                    Based on your trip activities, weather, and duration
                </Text>
            </View>

            {recommendations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <CheckCircle size={64} color="#10b981" />
                    <Text style={styles.emptyTitle}>You're all set!</Text>
                    <Text style={styles.emptyText}>
                        You have all the recommended gear for this trip.
                    </Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {recommendations.filter((r) => r.priority === 'high').length}
                            </Text>
                            <Text style={styles.statLabel}>High Priority</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>
                                {recommendations.filter((r) => r.priority === 'medium').length}
                            </Text>
                            <Text style={styles.statLabel}>Medium Priority</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{recommendations.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>

                    {recommendations.map((rec, index) => renderRecommendation(rec, index))}
                </View>
            )}
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
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d5016',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    recommendationCard: {
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
    recHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    recHeaderLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    recHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    recCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    recReason: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    quantityText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    suggestionBox: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    suggestionText: {
        fontSize: 13,
        color: '#92400e',
    },
    itemsContainer: {
        marginTop: 12,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
    },
    itemPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    itemWeight: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    itemSource: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    addItemButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
});