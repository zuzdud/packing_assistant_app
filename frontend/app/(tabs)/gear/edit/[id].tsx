import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import gearService, { Category, GearItem } from '../../../../services/gear.service';

export default function EditGearScreen() {
    const { id } = useLocalSearchParams();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        weight_grams: '',
        notes: '',
        purchase_date: '',
    });
    const [photo, setPhoto] = useState<string | null>(null);
    const [photoChanged, setPhotoChanged] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [gear, categoriesData] = await Promise.all([
                gearService.getGearItem(Number(id)),
                gearService.getCategories(),
            ]);

            setFormData({
                name: gear.name,
                description: gear.description || '',
                category: gear.category?.toString() || '',
                weight_grams: gear.weight_grams?.toString() || '',
                notes: gear.notes || '',
                purchase_date: gear.purchase_date || '',
            });
            setPhoto(gear.photo);
            setCategories(categoriesData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load gear details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
            setPhotoChanged(true);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera permissions');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
            setPhotoChanged(true);
        }
    };

    const handleImagePick = () => {
        setShowPhotoOptions(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter a gear name');
            return;
        }

        setIsSaving(true);
        try {
            const data: any = {
                name: formData.name,
                description: formData.description,
                notes: formData.notes,
            };

            if (formData.category) {
                data.category = parseInt(formData.category);
            }

            if (formData.weight_grams) {
                data.weight_grams = parseInt(formData.weight_grams);
            }

            if (formData.purchase_date) {
                data.purchase_date = formData.purchase_date;
            }

            // Only include photo if it was changed
            if (photoChanged) {
                if (photo && photo.startsWith('file://')) {
                    const filename = photo.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename || '');
                    const type = match ? `image/${match[1]}` : 'image/jpeg';

                    data.photo = {
                        uri: photo,
                        name: filename || 'photo.jpg',
                        type,
                    };
                } else if (!photo) {
                    // Photo was removed
                    data.photo = null;
                }
            }

            await gearService.updateGearItem(Number(id), data);
            Alert.alert('Success', 'Gear item updated!');
            router.back();
        } catch (error: any) {
            console.error('Update gear error:', error);
            Alert.alert('Error', 'Failed to update gear item');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2d5016" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Edit Gear Item</Text>

                    {/* Photo Section */}
                    <TouchableOpacity style={styles.photoContainer} onPress={handleImagePick}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Camera size={40} color="#999" />
                                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="e.g., Osprey Atmos 65L"
                        />

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.pickerContainer}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.categoryScroll}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.categoryOption,
                                        !formData.category && styles.categoryOptionActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, category: '' })}
                                >
                                    <Text
                                        style={[
                                            styles.categoryOptionText,
                                            !formData.category && styles.categoryOptionTextActive,
                                        ]}
                                    >
                                        None
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryOption,
                                            formData.category === cat.id.toString() &&
                                            styles.categoryOptionActive,
                                        ]}
                                        onPress={() =>
                                            setFormData({ ...formData, category: cat.id.toString() })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.categoryOptionText,
                                                formData.category === cat.id.toString() &&
                                                styles.categoryOptionTextActive,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.label}>Weight (grams)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.weight_grams}
                            onChangeText={(text) =>
                                setFormData({ ...formData, weight_grams: text })
                            }
                            placeholder="e.g., 1500"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Purchase Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.purchase_date}
                            onChangeText={(text) =>
                                setFormData({ ...formData, purchase_date: text })
                            }
                            placeholder="e.g., 2024-01-15"
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) =>
                                setFormData({ ...formData, description: text })
                            }
                            placeholder="Brief description..."
                            multiline
                            numberOfLines={3}
                        />

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            placeholder="Additional notes..."
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
            {showPhotoOptions && (
                <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoOptions(false)}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowPhotoOptions(false);
                                takePhoto();
                            }}
                        >
                            <Text style={styles.modalText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalButton} onPress={() => {
                            setShowPhotoOptions(false);
                            pickImage();
                        }}>
                            <Text style={styles.modalText}>Choose from Library</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalButton} onPress={() => {
                            setPhoto(null);
                            setPhotoChanged(true);
                            setShowPhotoOptions(false);
                        }}>
                            <Text style={[styles.modalText, { color: 'red' }]}>Remove Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton]}
                            onPress={() => setShowPhotoOptions(false)}
                        >
                            <Text style={styles.modalText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            )
            }
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
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    photoContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
    form: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        marginBottom: 16,
    },
    categoryScroll: {
        flexGrow: 0,
    },
    categoryOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    categoryOptionActive: {
        backgroundColor: '#2d5016',
        borderColor: '#2d5016',
    },
    categoryOptionText: {
        fontSize: 14,
        color: '#666',
    },
    categoryOptionTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#2d5016',
    },
    submitButtonDisabled: {
        backgroundColor: '#999',
    },
    submitButtonText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalCard: {
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalButton: {
        paddingVertical: 14,
    },
    modalText: {
        fontSize: 18,
        textAlign: 'center',
    }

});