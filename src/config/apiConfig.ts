import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL_STORAGE_KEY = '@spotlight_api_url';

function detectDefaultApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // No Expo Go em telemóvel físico, Constants.expoConfig.hostUri contém "<IP_DO_PC>:8081"
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

let currentBaseUrl = detectDefaultApiUrl();

export function getDefaultApiUrl(): string {
  return detectDefaultApiUrl();
}

export function getCurrentApiUrl(): string {
  return currentBaseUrl;
}

export async function loadSavedApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      currentBaseUrl = saved.trim().replace(/\/+$/, '');
    } else {
      currentBaseUrl = detectDefaultApiUrl();
    }
  } catch {
    currentBaseUrl = detectDefaultApiUrl();
  }
  return currentBaseUrl;
}

export async function saveApiUrl(url: string): Promise<string> {
  const normalized = url.trim().replace(/\/+$/, '');
  if (!normalized) {
    await AsyncStorage.removeItem(API_URL_STORAGE_KEY);
    currentBaseUrl = detectDefaultApiUrl();
    return currentBaseUrl;
  }

  const withApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  await AsyncStorage.setItem(API_URL_STORAGE_KEY, withApi);
  currentBaseUrl = withApi;
  return currentBaseUrl;
}
