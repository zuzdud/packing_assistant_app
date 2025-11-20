import api from './api';

export interface GearItem {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  weight_grams: number | null;
  photo: string | null;
  purchase_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

class GearService {
    async getGearItems(): Promise<GearItem[]> {
        const response = await api.get('/gear/');
        return response.data.results || response.data;
    }
}

export default new GearService();