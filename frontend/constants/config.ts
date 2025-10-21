// constants/config.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDevApiBase() {
  if (Platform.OS === 'web') return 'http://localhost:3000';

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  if (hostUri) {
    const host = String(hostUri).split(':')[0]; // p.ej. "192.168.1.83"
    return `http://${host}:3000`;
  }
  // Fallbacks para simuladores/emuladores
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? resolveDevApiBase();

export const API_PREFIX =
  process.env.EXPO_PUBLIC_API_PREFIX ?? '/api';
