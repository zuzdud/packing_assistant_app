import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Package, Plus, Check } from 'lucide-react-native';
import gearService, { GearItem } from '../../../../services/gear.service';
import tripService from '../../../../services/trip.service';

export default function AddGearToTripScreen() {
    const { id } = useLocalSearchParams();
    const [gear, setGear] = useState<GearItem[]>([]);
    const [filteredGear, setFilteredGear] = useState<GearItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGear, setSelectedGear] = useState<Set<number>>(new Set());
    const [existingGearIds, setExistingGearIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        filterGear();
    }, [searchQuery, gear]);

    const loadData = async () => {
        try {
            const [gearData, tripData] = await Promise.all([
                gearService.getGearItems(),
                tripService.getTrip(Number(id)),
            ]);

            // Get IDs of gear already in trip
            const existingIds = new Set(tripData.gear_items.map((item) => item.gear));
            setExistingGearIds(existingIds);
            setGear(gearData);
            setFilteredGear(gearData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load gear');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const filterGear = () => {
        if (!searchQuery.trim()) {
            setFilteredGear(gear);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = gear.filter(
            (item) =>
                item.name.toLowerCase().includes(query) ||
                item.category_name?.toLowerCase().includes(query)
        );
        setFilteredGear(filtered);
    };

    const toggleGear = (gearId: number) => {
        const newSelected = new Set(selectedGear);
        if (newSelected.has(gearId)) {
            newSelected.delete(gearId);
        } else {
            newSelected.add(gearId);
        }
        setSelectedGear(newSelected);
    };

    const handleAddGear = async () => {
        if (selectedGear.size === 0) {
            Alert.alert('Error', 'Please select at least one gear item');
            return;
        }

        setIsAdding(true);
        try {
            // Add each selected gear item to the trip
            await Promise.all(
                Array.from(selectedGear).map((gearId) =>
                    tripService.addGearToTrip(Number(id), gearId)
                )
            );

            Alert.alert('Success', `Added ${selectedGear.size} items to trip`);
            router.back();
        } catch (error: any) {
            console.error('Add gear error:', error);
            Alert.alert('Error', 'Failed to add gear to trip');
        } finally {
            setIsAdding(false);
        }
    };

    const renderGearItem = ({ item }: { item: GearItem }) => {
        const isAlreadyInTrip = existingGearIds.has(item.id);
        const isSelected = selectedGear.has(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.gearCard,
                    isSelected && styles.gearCardSelected,
                    isAlreadyInTrip && styles.gearCardDisabled,
                ]}
                onPress={() => !isAlreadyInTrip && toggleGear(item.id)}
                disabled={isAlreadyInTrip}
            >
                {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.gearImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Package size={32} color="#999" />
                    </View>
                )}

                <View style={styles.gearInfo}>
                    <Text style={styles.gearName}>{item.name}</Text>
                    <Text style={styles.gearCategory}>
                        {item.category_name || 'Uncategorized'}
                    </Text>
                    {item.weight_grams && (
                        <Text style={styles.gearWeight}>{item.weight_grams}g</Text>
                    )}
                </View>

                {isAlreadyInTrip ? (
                    <View style={styles.alreadyAddedBadge}>
                        <Text style={styles.alreadyAddedText}>Added</Text>
                    </View>
                ) : isSelected ? (
                    <View style={styles.checkbox}>
                        <Check size={20} color="white" />
                    </View>
                ) : (
                    <View style={styles.checkboxEmpty} />
                )}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2d5016" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Add Gear to Trip</Text>
                <Text style={styles.subtitle}>
                    {selectedGear.size} item{selectedGear.size !== 1 ? 's' : ''} selected
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={20} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search gear..."
                    placeholderTextColor="#999"
                />
            </View>

            {/* Gear List */}
            <FlatList
                data={filteredGear}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGearItem}
                contentContainerStyle={styles.gearList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Package size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No gear items found</Text>
                    </View>
                }
            />

            {/* Add Button */}
            {selectedGear.size > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                        onPress={handleAddGear}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Plus size={20} color="white" />
                                <Text style={styles.addButtonText}>
                                    Add {selectedGear.size} Item{selectedGear.size !== 1 ? 's' : ''}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    gearList: {
        padding: 16,
        paddingBottom: 100,
    },
    gearCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gearCardSelected: {
        borderColor: '#2d5016',
        backgroundColor: '#f0f7f0',
    },
    gearCardDisabled: {
        opacity: 0.5,
    },
    gearImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gearInfo: {
        flex: 1,
        marginLeft: 12,
    },
    gearName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    gearCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    gearWeight: {
        fontSize: 12,
        color: '#999',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2d5016',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxEmpty: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    alreadyAddedBadge: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    alreadyAddedText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#2d5016',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    addButtonDisabled: {
        backgroundColor: '#999',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});