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
        expected_weather: [] as string[],
    });
    const [activities, setActivities] = useState<string[]>([]);

    const [availableActivities, setAvailableActivities] = useState<ActivityType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingWeather, setIsFetchingWeather] = useState(false);
    const [weatherFetched, setWeatherFetched] = useState(false);

    const router = useRouter();

    useEffect(() => {
        loadActivities();
    }, []);

    // Auto-fetch weather when location and dates are complete
    useEffect(() => {
        const { location, start_date, end_date } = formData;
        if (location && start_date && end_date && !weatherFetched) {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(start_date) && dateRegex.test(end_date)) {
                fetchWeather();
            }
        }
    }, [formData.location, formData.start_date, formData.end_date]);

    const fetchWeather = async () => {
        setIsFetchingWeather(true);
        try {
            const weatherData = await tripService.getWeatherForecast(
                formData.location,
                formData.start_date,
                formData.end_date
            );
            console.log("Weather api response", weatherData);

            if (weatherData.available) {
                setFormData(prev => ({
                    ...prev,
                    expected_temp_min: weatherData.temp_min.toString(),
                    expected_temp_max: weatherData.temp_max.toString(),
                    expected_weather: weatherData.conditions ?? [],
                }));
                setWeatherFetched(true);
                Alert.alert('Weather Loaded', 'Weather forecast has been automatically loaded for your trip!');
            } else {
                Alert.alert('Weather Unavailable', weatherData.message || 'Could not fetch weather data');
            }
        } catch (error) {
            console.error('Weather fetch error:', error);
            Alert.alert('Weather Error', 'Could not fetch weather data. You can continue without it.');
        } finally {
            setIsFetchingWeather(false);
        }
    };

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

                    <View style={styles.weatherSection}>
                        <View style={styles.weatherHeader}>
                            <Text style={styles.sectionTitle}>Weather Conditions</Text>
                            {isFetchingWeather && (
                                <View style={styles.fetchingIndicator}>
                                    <ActivityIndicator size="small" color="#2d5016" />
                                    <Text style={styles.fetchingText}>Fetching weather...</Text>
                                </View>
                            )}
                            {weatherFetched && !isFetchingWeather && (
                                <TouchableOpacity onPress={fetchWeather} style={styles.refreshButton}>
                                    <Text style={styles.refreshText}>🔄 Refresh</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {weatherFetched && !isFetchingWeather && (
                            <View style={styles.weatherInfo}>
                                <View style={styles.tempRow}>
                                    <View style={styles.tempItem}>
                                        <Text style={styles.tempLabel}>Min</Text>
                                        <Text style={styles.tempValue}>{formData.expected_temp_min}°C</Text>
                                    </View>
                                    <View style={styles.tempItem}>
                                        <Text style={styles.tempLabel}>Max</Text>
                                        <Text style={styles.tempValue}>{formData.expected_temp_max}°C</Text>
                                    </View>
                                </View>
                                <View style={styles.conditionsRow}>
                                    <Text style={styles.conditionsLabel}>Expected conditions:</Text>
                                    <View style={styles.conditionsChips}>
                                        {formData.expected_weather.map((condition) => (
                                            <View key={condition} style={styles.conditionChip}>
                                                <Text style={styles.conditionText}>{condition}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {!weatherFetched && !isFetchingWeather && (
                            <Text style={styles.weatherHint}>
                                💡 Enter location and dates to automatically fetch weather forecast
                            </Text>
                        )}
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
    weatherSection: {
        marginTop: 8,
    },
    weatherHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fetchingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fetchingText: {
        fontSize: 14,
        color: '#2d5016',
        fontStyle: 'italic',
    },
    refreshButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#e8f5e9',
    },
    refreshText: {
        fontSize: 14,
        color: '#2d5016',
        fontWeight: '600',
    },
    weatherInfo: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tempRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    tempItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
    },
    tempLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    tempValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    conditionsRow: {
        gap: 8,
    },
    conditionsLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    conditionsChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    conditionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
    },
    conditionText: {
        fontSize: 13,
        color: 'white',
        fontWeight: '600',
    },
    weatherHint: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
        backgroundColor: '#fff9e6',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffd666',
    },
});