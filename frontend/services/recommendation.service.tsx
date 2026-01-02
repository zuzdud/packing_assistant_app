import api from "./api";

export interface RecommendedGear {
    category: string;
    category_id: number | null;
    suggested_items: SuggestedItem[];
    reason: string;
    quantity: number;
    priority: 'high' | 'medium' | 'low';
    source: 'catalog' | 'user' | 'suggestion';
}

export interface SuggestedItem {
    id: number;
    name: string;
    description: string;
    weight: number | null;
    source: 'catalog' | 'user';
    times_used?: number;
    avg_rating?: number;
    last_used?: string;
}

export interface RecommendationResponse {
    trip_id: number;
    trip_title: string;
    recommendations: RecommendedGear[];
    total_recommendations: number;
}

class RecommendationService {
    /**
     * Get gear recommendations for a trip from the backend
     */
    async getRecommendationsForTrip(tripId: number): Promise<RecommendationResponse> {
        const response = await api.get(`/trips/${tripId}/recommendations/`);
        return response.data;
    }

    /**
     * Group recommendations by priority
     */
    groupByPriority(recommendations: RecommendedGear[]): {
        high: RecommendedGear[];
        medium: RecommendedGear[];
        low: RecommendedGear[];
    } {
        return {
            high: recommendations.filter(r => r.priority === 'high'),
            medium: recommendations.filter(r => r.priority === 'medium'),
            low: recommendations.filter(r => r.priority === 'low'),
        };
    }

    /**
     * Get count of recommendations by source
     */
    getSourceCounts(recommendations: RecommendedGear[]): {
        catalog: number;
        user: number;
        suggestion: number;
    } {
        return {
            catalog: recommendations.filter(r => r.source === 'catalog').length,
            user: recommendations.filter(r => r.source === 'user').length,
            suggestion: recommendations.filter(r => r.source === 'suggestion').length,
        };
    }

    /**
     * Get priority color for UI
     */
    getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
        switch (priority) {
            case 'high':
                return '#dc2626'; // red
            case 'medium':
                return '#f59e0b'; // amber
            case 'low':
                return '#10b981'; // green
            default:
                return '#6b7280'; // gray
        }
    }

    /**
     * Get priority label for UI
     */
    getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
        switch (priority) {
            case 'high':
                return 'Essential';
            case 'medium':
                return 'Recommended';
            case 'low':
                return 'Optional';
            default:
                return 'Unknown';
        }
    }
}

export default new RecommendationService();