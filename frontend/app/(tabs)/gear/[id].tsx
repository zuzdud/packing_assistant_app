import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Edit, Trash2, TrendingUp } from 'lucide-react-native';
import gearService, { GearItem } from '../../../services/gear.service';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams();
  const [gear, setGear] = useState<GearItem | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadGearDetail();
  }, [id]);

  const loadGearDetail = async () => {
    try {
      const gearData = await gearService.getGearItem(Number(id));
      setGear(gearData);

      // Try to load usage stats (might not exist yet)
      try {
        const statsData = await gearService.getGearUsageStats(Number(id));
        setStats(statsData);
      } catch (error) {
        // Stats don't exist yet, that's okay
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load gear details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Gear',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gearService.deleteGearItem(Number(id));
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete gear item');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  if (!gear) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      {gear.photo ? (
        <Image source={{ uri: gear.photo }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Package size={80} color="#999" />
        </View>
      )}

      {/* Main Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{gear.name}</Text>
            <Text style={styles.category}>{gear.category_name || 'Uncategorized'}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {gear.weight_grams && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{gear.weight_grams}g</Text>
            </View>
          )}

          {gear.purchase_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date</Text>
              <Text style={styles.detailValue}>
                {new Date(gear.purchase_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {gear.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{gear.description}</Text>
            </View>
          )}

          {gear.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{gear.notes}</Text>
            </View>
          )}
        </View>

        {/* Usage Stats */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#2d5016" />
              <Text style={styles.sectionTitle}>Usage Statistics</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.times_packed}</Text>
                <Text style={styles.statLabel}>Times Packed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.times_used}</Text>
                <Text style={styles.statLabel}>Times Used</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.times_not_used}</Text>
                <Text style={styles.statLabel}>Not Used</Text>
              </View>
            </View>

            {stats.avg_usefulness_rating && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Average Rating</Text>
                <Text style={styles.detailValue}>
                  {stats.avg_usefulness_rating}/5.0
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/gear/edit/${id}`)}
          >
            <Edit size={20} color="white" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={20} color="white" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
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
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2d5016',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    flex: 1,
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