import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, Package, Plus, RefreshCw } from 'lucide-react-native';
import tripService from '../../../../services/trip.service';
import gearService from '../../../../services/gear.service';
import recommendationService, { RecommendedGear, SuggestedItem } from '../../../../services/recommendation.service';

export default function RecommendationsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<RecommendedGear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
    const [tripTitle, setTripTitle] = useState('');

    useEffect(() => {
        loadRecommendations();
    }, [id]);

    const loadRecommendations = async () => {
        setIsLoading(true);
        try {
            const response = await recommendationService.getRecommendationsForTrip(Number(id));
            setRecommendations(response.recommendations);
            setTripTitle(response.trip_title);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            Alert.alert('Error', 'Failed to load recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const addCatalogItemToTrip = async (item: SuggestedItem) => {
        // For catalog items, first create in user's gear, then add to trip
        setAddingItems(new Set(addingItems).add(item.id));
        try {
            const gearData = {
                name: item.name,
                description: item.description,
                weight_grams: item.weight || undefined,
            };

            const newGear = await gearService.createGearItem(gearData);
            await tripService.addGearToTrip(Number(id), newGear.id);

            Alert.alert('Success', 'Item added to your gear and trip!');
            await loadRecommendations();
        } catch (error) {
            console.error('Failed to add catalog item:', error);
            Alert.alert('Error', 'Failed to add item');
        } finally {
            const newSet = new Set(addingItems);
            newSet.delete(item.id);
            setAddingItems(newSet);
        }
    };

    const addUserItemToTrip = async (item: SuggestedItem) => {
        // For user items, just add to trip
        setAddingItems(new Set(addingItems).add(item.id));
        try {
            await tripService.addGearToTrip(Number(id), item.id);
            Alert.alert('Success', 'Item added to trip!');
            await loadRecommendations();
        } catch (error) {
            console.error('Failed to add user item:', error);
            Alert.alert('Error', 'Failed to add item');
        } finally {
            const newSet = new Set(addingItems);
            newSet.delete(item.id);
            setAddingItems(newSet);
        }
    };

    const handleAddItem = async (item: SuggestedItem) => {
        if (item.source === 'catalog') {
            await addCatalogItemToTrip(item);
        } else {
            await addUserItemToTrip(item);
        }
    };

    const getPriorityColor = (priority: string) => {
        return recommendationService.getPriorityColor(priority as 'high' | 'medium' | 'low');
    };

    const getPriorityLabel = (priority: string) => {
        return recommendationService.getPriorityLabel(priority as 'high' | 'medium' | 'low');
    };

    const getPriorityIcon = (priority: string) => {
        const color = getPriorityColor(priority);
        switch (priority) {
            case 'high':
                return <AlertCircle size={20} color={color} />;
            case 'medium':
                return <AlertCircle size={20} color={color} />;
            default:
                return <CheckCircle size={20} color={color} />;
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
                    <Text style={styles.priorityText}>
                        {getPriorityLabel(rec.priority)}
                    </Text>
                </View>
            </View>

            {rec.quantity > 1 && (
                <View style={styles.quantityBox}>
                    <Text style={styles.quantityText}>
                        📦 Recommended quantity: {rec.quantity}
                    </Text>
                </View>
            )}

            {rec.source === 'suggestion' && (
                <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionText}>
                        💡 Consider adding items in this category to your gear list
                    </Text>
                    <TouchableOpacity
                        style={styles.addGearButton}
                        onPress={() => router.push('/gear/add')}
                    >
                        <Text style={styles.addGearButtonText}>Add Gear</Text>
                    </TouchableOpacity>
                </View>
            )}

            {rec.suggested_items.length > 0 && (
                <View style={styles.itemsContainer}>
                    {rec.suggested_items.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemIconContainer}>
                                <Package size={24} color="#666" />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {item.description && (
                                    <Text style={styles.itemDescription} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                )}
                                <View style={styles.itemMeta}>
                                    {item.weight && (
                                        <Text style={styles.itemWeight}>⚖️ {item.weight}g</Text>
                                    )}
                                    <Text style={styles.itemSource}>
                                        {item.source === 'catalog' ? '📦 Catalog' : '✅ Your gear'}
                                    </Text>
                                </View>
                                {item.times_used !== undefined && item.times_used > 0 && (
                                    <View style={styles.usageStats}>
                                        <Text style={styles.usageText}>
                                            Used {item.times_used} times
                                        </Text>
                                        {item.avg_rating && (
                                            <Text style={styles.ratingText}>
                                                ⭐ {item.avg_rating.toFixed(1)}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.addItemButton}
                                onPress={() => handleAddItem(item)}
                                disabled={addingItems.has(item.id)}
                            >
                                {addingItems.has(item.id) ? (
                                    <ActivityIndicator size="small" color="#2d5016" />
                                ) : (
                                    <View style={styles.addButtonContent}>
                                        <Plus size={18} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
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
                <Text style={styles.loadingText}>Analyzing trip requirements...</Text>
            </View>
        );
    }

    const grouped = recommendationService.groupByPriority(recommendations);
    const sourceCounts = recommendationService.getSourceCounts(recommendations);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Gear Recommendations</Text>
                        <Text style={styles.tripTitle}>{tripTitle}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={loadRecommendations}
                    >
                        <RefreshCw size={20} color="#2d5016" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>
                    Smart recommendations based on activities, weather, and your gear history
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
                    {/* Stats Overview */}
                    <View style={styles.statsContainer}>
                        <View style={[styles.statBox, styles.statBoxHigh]}>
                            <Text style={[styles.statValue, styles.statValueHigh]}>
                                {grouped.high.length}
                            </Text>
                            <Text style={styles.statLabel}>Essential</Text>
                        </View>
                        <View style={[styles.statBox, styles.statBoxMedium]}>
                            <Text style={[styles.statValue, styles.statValueMedium]}>
                                {grouped.medium.length}
                            </Text>
                            <Text style={styles.statLabel}>Recommended</Text>
                        </View>
                        <View style={[styles.statBox, styles.statBoxLow]}>
                            <Text style={[styles.statValue, styles.statValueLow]}>
                                {grouped.low.length}
                            </Text>
                            <Text style={styles.statLabel}>Optional</Text>
                        </View>
                    </View>

                    {/* Source Stats */}
                    <View style={styles.sourceStats}>
                        <Text style={styles.sourceStatsText}>
                            {sourceCounts.catalog} from catalog • {sourceCounts.user} from your gear • {sourceCounts.suggestion} suggestions
                        </Text>
                    </View>

                    {/* High Priority */}
                    {grouped.high.length > 0 && (
                        <View style={styles.prioritySection}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionHeaderBadge, { backgroundColor: '#dc2626' }]}>
                                    <AlertCircle size={16} color="white" />
                                </View>
                                <Text style={styles.sectionTitle}>Essential Items</Text>
                                <Text style={styles.sectionCount}>({grouped.high.length})</Text>
                            </View>
                            {grouped.high.map((rec, index) => renderRecommendation(rec, index))}
                        </View>
                    )}

                    {/* Medium Priority */}
                    {grouped.medium.length > 0 && (
                        <View style={styles.prioritySection}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionHeaderBadge, { backgroundColor: '#f59e0b' }]}>
                                    <AlertCircle size={16} color="white" />
                                </View>
                                <Text style={styles.sectionTitle}>Recommended Items</Text>
                                <Text style={styles.sectionCount}>({grouped.medium.length})</Text>
                            </View>
                            {grouped.medium.map((rec, index) => renderRecommendation(rec, index))}
                        </View>
                    )}

                    {/* Low Priority */}
                    {grouped.low.length > 0 && (
                        <View style={styles.prioritySection}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionHeaderBadge, { backgroundColor: '#10b981' }]}>
                                    <CheckCircle size={16} color="white" />
                                </View>
                                <Text style={styles.sectionTitle}>Optional Items</Text>
                                <Text style={styles.sectionCount}>({grouped.low.length})</Text>
                            </View>
                            {grouped.low.map((rec, index) => renderRecommendation(rec, index))}
                        </View>
                    )}
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
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    tripTitle: {
        fontSize: 14,
        color: '#2d5016',
        marginTop: 4,
        fontWeight: '600',
    },
    refreshButton: {
        padding: 8,
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
    },
    subtitle: {
        fontSize: 13,
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
        borderWidth: 2,
    },
    statBoxHigh: {
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },
    statBoxMedium: {
        borderColor: '#fed7aa',
        backgroundColor: '#fffbeb',
    },
    statBoxLow: {
        borderColor: '#a7f3d0',
        backgroundColor: '#f0fdf4',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statValueHigh: {
        color: '#dc2626',
    },
    statValueMedium: {
        color: '#f59e0b',
    },
    statValueLow: {
        color: '#10b981',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
    },
    sourceStats: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sourceStatsText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    prioritySection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHeaderBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionCount: {
        fontSize: 14,
        color: '#999',
        marginLeft: 6,
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
        fontSize: 13,
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
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quantityBox: {
        backgroundColor: '#eff6ff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    quantityText: {
        fontSize: 13,
        color: '#1e40af',
        fontWeight: '500',
    },
    suggestionBox: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    suggestionText: {
        fontSize: 13,
        color: '#92400e',
        marginBottom: 8,
    },
    addGearButton: {
        backgroundColor: '#92400e',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    addGearButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    itemsContainer: {
        marginTop: 12,
        gap: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    itemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 2,
    },
    itemWeight: {
        fontSize: 11,
        color: '#666',
    },
    itemSource: {
        fontSize: 11,
        color: '#999',
    },
    usageStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    usageText: {
        fontSize: 11,
        color: '#2d5016',
        fontWeight: '500',
    },
    ratingText: {
        fontSize: 11,
        color: '#2d5016',
        fontWeight: '500',
    },
    addItemButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2d5016',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonContent: {
        justifyContent: 'center',
        alignItems: 'center',
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