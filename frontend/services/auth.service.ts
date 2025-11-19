import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

class AuthService {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register/', data);
    return response.data;
  }

  async login(data: LoginData) {
    const response = await api.post('/auth/login/', data);
    const { access, refresh } = response.data;
    
    // Store tokens
    await AsyncStorage.setItem('access_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    
    // Fetch and store user data
    const user = await this.getCurrentUser();
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { access, refresh, user };
  }

  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me/');
    return response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  }

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();