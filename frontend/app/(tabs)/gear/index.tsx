import gearService, { GearItem } from "@/services/gear.service";
import { useRouter } from "expo-router";
import { Package, Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, TouchableOpacity, View, StyleSheet, Alert, Image, Text, RefreshControl, ActivityIndicator } from "react-native";

export default function GearListScreen() {

    const [gear, setGear] = useState<GearItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const loadData = async () => {
        try {
            const [gearData,] = await Promise.all([
                gearService.getGearItems(),
            ]);
            setGear(gearData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load gear items');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderGearItem = ({ item }: { item: GearItem }) => (
        <TouchableOpacity
            style={styles.gearCard}
            onPress={() => router.push(`/gear/${item.id}`)}
        >
            {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.gearImage} />
            ) : (
                <View style={styles.placeholderImage}>
                    <Package size={40} color="#999" />
                </View>
            )}
            <View style={styles.gearInfo}>
                <Text style={styles.gearName}>{item.name}</Text>
                <Text style={styles.gearCategory}>{item.category_name || 'Uncategorized'}</Text>
                {item.weight_grams && (
                    <Text style={styles.gearWeight}>{item.weight_grams}g</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2d5016" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={gear}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGearItem}
                contentContainerStyle={styles.gearList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Package size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No gear items yet</Text>
                        <Text style={styles.emptySubtext}>
                            Add your first gear item to get started
                        </Text>
                    </View>
                }
            />
            {/* Add Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/gear/add')}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    gearCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    gearImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gearInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    gearName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    gearCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    gearWeight: {
        fontSize: 12,
        color: '#999',
    },
    gearList: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2d5016',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});