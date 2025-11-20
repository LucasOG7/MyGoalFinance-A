export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0f172a',
    tint: '#C2F0FF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#C2F0FF',
  },
} as const;

export type ThemeName = keyof typeof Colors;
