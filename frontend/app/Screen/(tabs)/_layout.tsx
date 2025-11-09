// app/Screen/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { registerPushToken } from '@/utils/registerPush';
import { useNotificationListeners } from '../../../hooks/useNotifications';
import { useAuth } from '../../../store/auth';

function AnimatedTabIcon({ name, color, size, focused }: { name: any; color: string; size: number; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.96)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.96,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.8,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);
  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Ionicons name={name} color={color} size={size} />
    </Animated.View>
  );
}

export default function TabLayout() {
  // 🔔 listeners
  useNotificationListeners();

  // 🔐 tu JWT/sesión
  const { t } = useTranslation();
  const { token: authToken } = useAuth();

  // Evitar doble registro
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
          tabBarInactiveTintColor: '#e2e8f0',
          tabBarLabelStyle: { 
            fontSize: 12,
            fontWeight: '700',
            marginTop: 4,
            color: '#ffffff',
            textShadowColor: 'rgba(0, 0, 0, 0.9)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarStyle: {
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderTopColor: 'rgba(148, 163, 184, 0.3)',
            borderTopWidth: 1,
            height: baseH + insets.bottom,
            paddingBottom: Math.max(6, insets.bottom),
            paddingTop: 8,
            position: 'absolute',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          },
        }}
      >
        {/* Tabs visibles */}
        <Tabs.Screen
          name="home"
          options={{ title: t('Inicio'), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name="home-sharp" color={color} size={size} focused={focused} /> }}
        />
        <Tabs.Screen
          name="news"
          options={{ title: t('Noticias'), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name="book-sharp" color={color} size={size} focused={focused} /> }}
        />

        <Tabs.Screen
          name="recap"
          options={{ title: t('Resumen'), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name="stats-chart-sharp" color={color} size={size} focused={focused} /> }}
        />
        <Tabs.Screen
          name="recommendation"
          options={{ title: t('Recomendaciones'), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name="sparkles-sharp" color={color} size={size} focused={focused} /> }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{ title: t('Dashboard'), tabBarIcon: ({ color, size, focused }) => <AnimatedTabIcon name="analytics-sharp" color={color} size={size} focused={focused} /> }}
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
