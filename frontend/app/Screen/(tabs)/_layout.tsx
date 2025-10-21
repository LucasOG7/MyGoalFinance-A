// app/Screen/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { registerPushToken } from '@/utils/registerPush';
import { useNotificationListeners } from '../../../hooks/useNotifications';
import { useAuth } from '../../../store/auth';

export default function TabLayout() {
  // 🔔 listeners
  useNotificationListeners();

  // 🔐 tu JWT/sesión
  const { token: authToken } = useAuth();

  // evita doble registro
  const registeredRef = useRef(false);
  useEffect(() => {
    if (!authToken || registeredRef.current) return;
    registeredRef.current = true;
    registerPushToken(authToken).catch((e: any) => {
      console.log('[push] register error', e?.message || e);
      registeredRef.current = false;
    });
  }, [authToken]);

  const insets = useSafeAreaInsets();
  const baseH = Platform.OS === 'android' ? 60 : 58;

  return (
    // Respetar status bar con fondo consistente
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar style="light" />
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: '#ffb300',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#0b1324',
            height: baseH + insets.bottom,
            paddingBottom: Math.max(8, insets.bottom),
            paddingTop: 6,
          },
        }}
      >
        {/* Tabs visibles */}
        <Tabs.Screen
          name="home"
          options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="news"
          options={{ title: 'Noticias', tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" color={color} size={size} /> }}
        />

        <Tabs.Screen
          name="recap"
          options={{ title: 'Resumen', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="recommendation"
          options={{ title: 'Recomendado', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size} /> }}
        />

        {/* Rutas ocultas */}
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="chatbot" options={{ href: null }} />
        <Tabs.Screen name="goals" options={{ href: null }} />
        <Tabs.Screen name="transactions" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}
