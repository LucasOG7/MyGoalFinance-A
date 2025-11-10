import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useConnectivity } from '../../hooks/useConnectivity';

type Props = {
  bottomOffset?: number; // distancia desde el borde inferior para ubicar el banner
  showDurationMs?: number; // duración del banner verde al volver en línea
};

export default function ConnectivityBanner({ bottomOffset = 80, showDurationMs = 2200 }: Props) {
  const insets = useSafeAreaInsets();
  const { online } = useConnectivity();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  // Usar ReturnType<typeof setTimeout> es compatible con web (number) y Node (Timeout)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);

  useEffect(() => {
    if (online) {
      // Si volvemos en línea, mostramos verde brevemente y ocultamos
      setMode('online');
      setVisible(true);
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
      ty.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
        ty.value = withTiming(10, { duration: 180, easing: Easing.out(Easing.cubic) });
        setTimeout(() => setVisible(false), 190);
      }, showDurationMs);
    } else {
      // Sin conexión: mostrar rojo persistente
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setMode('offline');
      setVisible(true);
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
      ty.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [online]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const bg = mode === 'offline' ? 'rgba(220,38,38,0.95)' : 'rgba(34,197,94,0.95)';
  const text = mode === 'offline' ? 'Sin conexión' : 'De nuevo en línea';

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        aStyle,
        {
          bottom: bottomOffset + insets.bottom,
        },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: bg }]}> 
        <Text style={styles.txt}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  banner: {
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  txt: {
    color: '#ffffff',
    fontWeight: '700',
  },
});