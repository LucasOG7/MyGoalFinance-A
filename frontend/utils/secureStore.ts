import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

async function secureAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getToken(): Promise<string | null> {
  if (await secureAvailable()) {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      // Fallback a AsyncStorage si falla SecureStore
    }
  }
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (await secureAvailable()) {
    try {
      // Usar opciones por defecto para máxima compatibilidad de tipos/SDK
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return;
    } catch {
      // Fallback a AsyncStorage si falla SecureStore
    }
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (await secureAvailable()) {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return;
    } catch {
      // Fallback a AsyncStorage si falla SecureStore
    }
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}