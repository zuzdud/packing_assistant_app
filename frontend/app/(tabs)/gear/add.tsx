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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import gearService, { Category } from '../../../services/gear.service';

export default function AddGearScreen() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        weight_grams: '',
        notes: '',
        purchase_date: '',
    });
    const [photo, setPhoto] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await gearService.getCategories();
            setCategories(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load categories');
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

        setIsLoading(true);
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

            // handle photo upload
            if (photo) {
                const filename = photo.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                data.photo = {
                    uri: photo,
                    name: filename || 'photo.jpg',
                    type,
                };
            }

            await gearService.createGearItem(data);
            Alert.alert('Success', 'Gear item added!');
            router.back();
        } catch (error: any) {
            console.error('Create gear error:', error);
            Alert.alert('Error', 'Failed to add gear item');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Add Gear Item</Text>

                    {/* photo section */}
                    <TouchableOpacity style={styles.photoContainer} onPress={handleImagePick}>
                        {photo ? (
                            <>
                                <Image source={{ uri: photo }} style={styles.photo} />
                                <TouchableOpacity
                                    style={styles.removePhoto}
                                    onPress={() => setPhoto(null)}
                                >
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Camera size={40} color="#999" />
                                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form Fields */}
                    {/* TODO keyboard not obscuring text fields */}
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

                        {/* TODO calendar for date picker */}
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
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Add Gear</Text>
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
    removePhoto: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 6,
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