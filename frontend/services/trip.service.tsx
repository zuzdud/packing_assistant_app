import api from "./api";

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

class TripService {
    async getTrips(status?: string): Promise<Trip[]> {
        const url = status ? `/trips/?status=${status}` : '/trips/';
        const response = await api.get(url);
        console.log("TRIPS RESPONSE:", response.data);
        return response.data.results || response.data;
    }
}

export default new TripService();