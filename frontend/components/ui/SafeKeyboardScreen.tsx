// components/ui/SafeKeyboardScreen.tsx
import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import type { ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  bg?: string;
  bgGradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]]; // Gradiente absoluto
  extraBottomPad?: number;
  withTabBarPadding?: boolean;
  paddingH?: number;
  paddingTop?: number;
  scroll?: boolean;
  headerHeight?: number;
  contentJustify?: ViewStyle['justifyContent'];
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export default function SafeKeyboardScreen({
  children,
  style,
  bg = '#0f172a',
  bgGradientColors,
  extraBottomPad = 0,
  withTabBarPadding = false,
  paddingH = 0,
  paddingTop = 0,
  scroll = false,
  headerHeight,
  contentJustify = 'flex-start',
  contentContainerStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const TAB_BAR_H = 60;
  const bottomPad =
    insets.bottom + (withTabBarPadding ? TAB_BAR_H : 0) + (extraBottomPad ?? 0);

  const kbdOffset =
    Platform.select({ ios: headerHeight ?? 0, android: 0, default: 0 }) ?? 0;

  const Inner = (
    <>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            {
              flexGrow: 1,
              justifyContent: contentJustify,
              paddingHorizontal: paddingH,
              paddingTop: paddingTop + insets.top,
              paddingBottom: bottomPad,
            },
            contentContainerStyle,
          ]}
        >
          <View style={style}>{children}</View>
        </ScrollView>
      ) : (
        <View
          style={[
            {
              flex: 1,
              paddingHorizontal: paddingH,
              paddingTop: paddingTop + insets.top,
              paddingBottom: bottomPad,
              justifyContent: contentJustify,
            },
            style,
          ]}
        >
          {children}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: bg }}>
      {bgGradientColors ? (
        <LinearGradient
          colors={bgGradientColors}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {Platform.OS === 'web' ? (
        // 🚫 En web no usamos KAV para evitar pérdidas de foco
        Inner
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={kbdOffset}
        >
          {Inner}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
