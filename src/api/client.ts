import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getCurrentApiUrl } from '../config/apiConfig';

export const TOKEN_STORAGE_KEY = '@spotlight_token';

let inMemoryToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  inMemoryToken = token;
}

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorizedCallback = callback;
}

const api = axios.create({
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    config.baseURL = getCurrentApiUrl();
    const token = inMemoryToken ?? (await AsyncStorage.getItem(TOKEN_STORAGE_KEY));
    if (token) {
      inMemoryToken = token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && inMemoryToken && onUnauthorizedCallback) {
      const requestUrl = String(error.config?.url ?? '');
      if (!requestUrl.includes('/login')) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
