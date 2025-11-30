// app/utils/registerPush.ts
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// Behavior (SDK 52/53+ requiere banner/list en iOS)
// ─────────────────────────────────────────────
const behavior: Notifications.NotificationBehavior = {
  shouldShowAlert: true,
  shouldPlaySound: false,
  shouldSetBadge: false,
  shouldShowBanner: true,
  shouldShowList: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => behavior,
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getApiUrl() {
  const extra = (Constants?.expoConfig as any)?.extra?.apiUrl || (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL;
  return extra || process.env.EXPO_PUBLIC_API_URL;
}

function resolvePrefix(url: string) {
  try {
    const u = new URL(url);
    const path = (u.pathname || '').replace(/\/+$/, '');
    const isFunctions = u.hostname.includes('functions.supabase.co');
    if (!isFunctions) return '/api';
    if (path.endsWith('/functions/v1/api')) return '';
    if (path.endsWith('/functions/v1')) return '/api';
    return '/functions/v1/api';
  } catch {
    return '/api';
  }
}

function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFB300',
    });
  }
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

/**
 * Registra el dispositivo en backend /api/push/register
 * authToken: tu JWT (Authorization: Bearer ...)
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  // 👉 Evita registrar en Expo Go (desde SDK 53 no soporta push remotas)
  if ((Constants as any).appOwnership === 'expo') {
    console.log('[push] Skip en Expo Go. Usa un Development Build.');
    return null;
  }

  // 👉 Evita registrar en web
  if (Platform.OS === 'web') {
    console.log('[push] skip register in web');
    return null;
  }

  if (!authToken) throw new Error('Falta authToken');

  await ensureAndroidChannel();

  // 1) Permisos
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permisos de notificaciones denegados');

  // 2) Obtener token de Expo (requiere projectId en app.json -> extra.eas.projectId)
  const projectId =
    (Constants?.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId;
  if (!projectId) throw new Error('Falta extra.eas.projectId en app.json');

  const { data: expoToken } = await Notifications.getExpoPushTokenAsync({ projectId }); // "ExponentPushToken[...]"
  const apiUrl = getApiUrl();
  const prefix = resolvePrefix(apiUrl);

  // 3) Enviar al backend protegido (requireAuth)
  const resp = await fetch(`${apiUrl}${prefix}/push/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: expoToken,
      platform: getPlatform(),
    }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(`Fallo /api/push/register: ${resp.status} ${e?.detail || ''}`);
  }

  return expoToken;
}

// Alias por compatibilidad si importabas registerForPush
export const registerForPush = registerPushToken;

/** Llamar en logout para desactivar este dispositivo */
export async function unregisterPushToken(authToken: string, token: string): Promise<void> {
  if (!authToken || !token) return;
  const apiUrl = getApiUrl();
  const prefix = resolvePrefix(apiUrl);
  await fetch(`${apiUrl}${prefix}/push/unregister`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token }),
  });
}
