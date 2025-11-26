import tripService, { ActivityType } from "@/services/trip.service";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";

export default function AddTripScreen() {

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        expected_temp_min: '',
        expected_temp_max: '',
        expected_weather: '',
    });
    const [activities, setActivities] = useState<string[]>([]);

    const [availableActivities, setAvailableActivities] = useState<ActivityType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            const data = await tripService.getActivities();
            setAvailableActivities(data);
            if (Array.isArray(data)) {
                setAvailableActivities(data);
            } else {
                console.error('Activities data is not an array:', data);
                setAvailableActivities([]);
            }
        } catch (error) {
            console.error('Failed to load activities');
        }
    };

    const toggleActivity = (activityName: string) => {
        if (activities.includes(activityName)) {
            setActivities(activities.filter((a) => a !== activityName));
        } else {
            setActivities([...activities, activityName]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a trip title');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            Alert.alert('Error', 'Please enter start and end dates');
            return;
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.start_date) || !dateRegex.test(formData.end_date)) {
            Alert.alert('Error', 'Please use date format YYYY-MM-DD');
            return;
        }

        setIsLoading(true);
        try {
            const data: any = {
                title: formData.title,
                description: formData.description,
                location: formData.location,
                start_date: formData.start_date,
                end_date: formData.end_date,
                activities: activities,
            };

            if (formData.expected_temp_min) {
                data.expected_temp_min = parseInt(formData.expected_temp_min);
            }

            if (formData.expected_temp_max) {
                data.expected_temp_max = parseInt(formData.expected_temp_max);
            }

            if (formData.expected_weather) {
                data.expected_weather = formData.expected_weather;
            }

            await tripService.createTrip(data);
            Alert.alert('Success', 'Trip created!');
            router.back();
        } catch (error: any) {
            console.error('Create trip error:', error);
            Alert.alert('Error', 'Failed to create trip');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create New Trip</Text>

                {/* Form Fields */}
                <View style={styles.form}>
                    <Text style={styles.label}>Trip Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        placeholder="e.g., Weekend Camping at Yosemite"
                    />

                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData({ ...formData, location: text })}
                        placeholder="e.g., Yosemite National Park, CA"
                    />

                    <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.start_date}
                        onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                        placeholder="e.g., 2024-06-15"
                    />

                    <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.end_date}
                        onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                        placeholder="e.g., 2024-06-17"
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        placeholder="What are you planning for this trip?"
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.sectionTitle}>Activities</Text>
                    <View style={styles.activitiesContainer}>
                        {availableActivities.map((activity) => (
                            <TouchableOpacity
                                key={activity.id}
                                style={[
                                    styles.activityChip,
                                    activities.includes(activity.name) && styles.activityChipActive,
                                ]}
                                onPress={() => toggleActivity(activity.name)}
                            >
                                <Text
                                    style={[
                                        styles.activityText,
                                        activities.includes(activity.name) && styles.activityTextActive,
                                    ]}
                                >
                                    {activity.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Weather Conditions</Text>

                    <Text style={styles.label}>Expected Min Temperature (°C)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.expected_temp_min}
                        onChangeText={(text) =>
                            setFormData({ ...formData, expected_temp_min: text })
                        }
                        placeholder="e.g., 5"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Expected Max Temperature (°C)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.expected_temp_max}
                        onChangeText={(text) =>
                            setFormData({ ...formData, expected_temp_max: text })
                        }
                        placeholder="e.g., 20"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Expected Weather</Text>
                    <View style={styles.weatherOptions}>
                        {['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'].map((weather) => (
                            <TouchableOpacity
                                key={weather}
                                style={[
                                    styles.weatherChip,
                                    formData.expected_weather === weather && styles.weatherChipActive,
                                ]}
                                onPress={() =>
                                    setFormData({ ...formData, expected_weather: weather })
                                }
                            >
                                <Text
                                    style={[
                                        styles.weatherText,
                                        formData.expected_weather === weather &&
                                        styles.weatherTextActive,
                                    ]}
                                >
                                    {weather}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
                            <Text style={styles.submitButtonText}>Create Trip</Text>
                        )}
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
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    form: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 12,
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
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    activityChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activityChipActive: {
        backgroundColor: '#2d5016',
        borderColor: '#2d5016',
    },
    activityText: {
        fontSize: 14,
        color: '#666',
    },
    activityTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    weatherOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    weatherChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    weatherChipActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    weatherText: {
        fontSize: 14,
        color: '#666',
    },
    weatherTextActive: {
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
});