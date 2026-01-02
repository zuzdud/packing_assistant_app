import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};


// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {

    if (config.url?.includes('/auth/refresh/')) {
      return config;
    }

    const token = await AsyncStorage.getItem('access_token');
    // console.log("TOKEN IN ADD AUTH TOKEN", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          { refresh: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );
        console.log("REFRESH RESPONSE DATA", refreshResponse.data);

        const newAccessToken = refreshResponse.data.access;
        const newRefreshToken = refreshResponse.data.refresh; // Some APIs return new refresh token

        // store new token
        await AsyncStorage.setItem("access_token", newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem("refresh_token", newRefreshToken);
        }

        // update axios default headers in memory
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;
        // retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed, logout user
        await AsyncStorage.multiRemove([
          'access_token',
          'refresh_token',
          'user']);
        // You might want to navigate to login screen here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;