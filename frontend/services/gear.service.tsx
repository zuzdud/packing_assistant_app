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

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface CreateGearData {
  name: string;
  description?: string;
  category?: number;
  weight_grams?: number;
  photo?: any;
  purchase_date?: string;
  notes?: string;
}

class GearService {
  async getGearItemsByCategory(categoryId: number): Promise<GearItem[]> {
    const response = await api.get(`/gear/by_category/?category_id=${categoryId}`);
    console.log("GEAR by category RESPONSE:", response.data);
    return response.data;
  }

  async updateGearItem(id: number, data: Partial<CreateGearData>): Promise<GearItem> {
    if (data.photo) {
      const formData = new FormData();
      (Object.keys(data) as (keyof CreateGearData)[]).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      const response = await api.patch(`/gear/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const response = await api.patch(`/gear/${id}/`, data);
    return response.data;
  }

  async deleteGearItem(id: number): Promise<void> {
    await api.delete(`/gear/${id}/`);
  }

  async getGearUsageStats(id: number) {
    const response = await api.get(`/gear/${id}/usage_stats/`);
    return response.data;
  }

  async getGearItem(id: number): Promise<GearItem> {
    const response = await api.get(`/gear/${id}/`);
    return response.data;
  }

  async getGearItems(): Promise<GearItem[]> {
    const response = await api.get('/gear/');
    return response.data.results || response.data;
  }

  async getCategories(): Promise<Category[]> {
    let url = '/categories/';
    let allCategories: Category[] = [];

    while (url) {
      const response = await api.get(url);

      allCategories = [...allCategories, ...response.data.results];

      url = response.data.next;
    }
    return allCategories;
  }

  async createGearItem(data: CreateGearData): Promise<GearItem> {
    if (data.photo) {
      const formData = new FormData();
      (Object.keys(data) as (keyof CreateGearData)[]).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value as any);
        }
      });
      const response = await api.post('/gear/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    const response = await api.post('/gear/', data);
    return response.data;
  }
}

export default new GearService();