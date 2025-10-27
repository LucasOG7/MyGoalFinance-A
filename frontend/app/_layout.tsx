// app/_layout.tsx
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider, useAuth } from '../store/auth';
import { registerForPush } from '../utils/registerPush';
import '../i18n'; // Initialize i18n

// ─────────────────────────────────────────────
// Handler global: define cómo mostrar notificaciones
// (esto va a nivel de módulo, fuera de componentes)
// ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,

    // Nuevos flags requeridos por el tipo NotificationBehavior (iOS)
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AuthGate() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Forzamos a string para evitar TS2367 y reactividad confiable
  const s0 = String(segments[0] ?? '');
  const s1 = String(segments[1] ?? '');
  const s2 = String(segments[2] ?? '');

  useEffect(() => {
    if (loading) return;

    const inTabs = s0 === 'Screen' && s1 === '(tabs)';
    const isAuthScreen =
      s0 === 'Screen' && (s1 === 'login' || s1 === 'register' || s1 === 'confirm-email');

    // Sin token: bloquear tabs
    if (!token && inTabs) {
      router.replace('/Screen/login');
      return;
    }

    // Con token:
    if (token) {
      // Caso especial: venimos de confirmar email → ir al cuestionario
      if (s0 === 'Screen' && s1 === 'confirm-email') {
        router.replace('/Screen/questionnaire/step1');
        return;
      }
      // Si está en login/register → ir a Home
      if (s0 === 'Screen' && (s1 === 'login' || s1 === 'register')) {
        router.replace('/Screen/(tabs)/home');
        return;
      }
      // Si ya está en tabs o questionnaire, no hacer nada
    }
  }, [s0, s1, token, loading, router]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (token) {
      registerForPush(token).catch((e) => {
        console.log('[push] register failed:', e?.message || e);
      });
    }
  }, [token]);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    // Android: crea el canal de notificaciones una vez
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
