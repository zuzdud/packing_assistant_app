import api from "./api";

export interface ActivityType {
    id: number;
    name: string;
    description: string;
    typical_gear_categories: string[];
}

export interface Trip {
    id: number;
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    activities: string[];
    expected_temp_min: number | null;
    expected_temp_max: number | null;
    expected_weather: string;
    status: 'planned' | 'in_progress' | 'completed';
    gear_items: TripGear[];
    gear_count: number;
    packed_count: number;
    created_at: string;
    updated_at: string;
}

export interface TripGear {
    id: number;
    gear: number;
    gear_name: string;
    gear_photo: string | null;
    gear_weight: number | null;
    gear_category: string;
    origin: 'recommended' | 'user_added';
    packed: boolean;
    used: boolean;
    quantity: number;
    usefulness_rating: number | null;
    notes: string;
    created_at: string;
}

export interface CreateTripData {
    title: string;
    description?: string;
    location?: string;
    start_date: string;
    end_date: string;
    activities?: string[];
    expected_temp_min?: number;
    expected_temp_max?: number;
    expected_weather?: string;
}

class TripService {

    async getActivities(): Promise<ActivityType[]> {
        let url = '/activities/';
        let allActivities: ActivityType[] = [];

        while (url) {
            const response = await api.get(url);

            allActivities = [...allActivities, ...response.data.results];

            url = response.data.next;
        }
        return allActivities;
    }

    async getTrips(status?: string): Promise<Trip[]> {
        const url = status ? `/trips/?status=${status}` : '/trips/';
        const response = await api.get(url);
        console.log("TRIPS RESPONSE:", response.data);
        return response.data.results || response.data;
    }

    async createTrip(data: CreateTripData): Promise<Trip> {
        const response = await api.post('/trips/', data);
        return response.data;
    }
}

export default new TripService();