import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';

/* ─── Brand palette (design-tokens.json) ─── */
export const Brand = {
  primary: '#0B84FF',
  accent: '#00C2A8',
  success: '#28a745',
  error: '#e03f3f',
  warning: '#ffc107',
  purple: '#8B5CF6',
};

export const Neutral = {
  50: '#F7FAFC',
  100: '#EDF2F7',
  200: '#E2E8F0',
  300: '#CBD5E0',
  400: '#A0AEC0',
  500: '#718096',
  600: '#4A5568',
  700: '#2D3748',
  800: '#1A202C',
  900: '#0F1724',
};

/* ─── Light / Dark palettes ─── */
export const Colors = {
  light: {
    background: '#F7FAFC',
    foreground: '#0F1724',
    card: '#ffffff',
    border: '#E5E7EB',
    input: '#ffffff',
    muted: '#E5E7EB',
    mutedForeground: '#6B7280',
    text: '#0F1724',
    primary: Brand.primary,
    accent: Brand.accent,
    success: Brand.success,
    error: Brand.error,
    warning: Brand.warning,
  },
  dark: {
    background: '#0F1724',
    foreground: '#F7FAFC',
    card: '#1A202C',
    border: '#2D3748',
    input: '#1A202C',
    muted: '#2D3748',
    mutedForeground: '#A0AEC0',
    text: '#F7FAFC',
    primary: Brand.primary,
    accent: Brand.accent,
    success: Brand.success,
    error: Brand.error,
    warning: Brand.warning,
  },
};

/* ─── Typography ─── */
export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

/* ─── Spacing ─── */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

/* ─── Border Radius ─── */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

/* ─── Shadows (cross-platform) ─── */
export const Shadows = {
  card: Platform.select({
    ios: { shadowColor: '#0F1724', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
    android: { elevation: 2 },
  }),
  dropdown: Platform.select({
    ios: { shadowColor: '#0F1724', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
    android: { elevation: 4 },
  }),
  modal: Platform.select({
    ios: { shadowColor: '#0F1724', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 25 },
    android: { elevation: 8 },
  }),
  floating: Platform.select({
    ios: { shadowColor: '#0F1724', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40 },
    android: { elevation: 12 },
  }),
};

/* ─── Theme Context ─── */
export type ThemePreference = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  preference: 'auto',
  setPreference: () => {},
  isDark: false,
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export { ThemeContext };

/* ─── Hook ─── */
export function useThemeColors() {
  const { isDark } = useContext(ThemeContext);
  return isDark ? Colors.dark : Colors.light;
}
