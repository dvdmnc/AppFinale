import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import { Brand, Radius, Shadows, Neutral } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onPress,
  testID,
  style,
}: ButtonProps) {
  const variantStyle = getVariantStyles(variant, useColorScheme() === 'dark');
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: variantStyle.textColor }, sizeTextStyles[size]]}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function FloatingActionButton({
  children,
  onPress,
  testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.fab, Shadows.floating, { bottom: Math.max(insets.bottom, 16) + 8 }]}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: string, isDark: boolean) {
  const map: Record<string, { container: ViewStyle; textColor: string }> = {
    primary: {
      container: { backgroundColor: Brand.primary },
      textColor: '#ffffff',
    },
    secondary: {
      container: {
        backgroundColor: isDark ? Neutral[800] : '#F3F4F6',
        borderWidth: 1,
        borderColor: isDark ? Neutral[700] : '#E5E7EB',
      },
      textColor: isDark ? Neutral[50] : '#374151',
    },
    danger: {
      container: { backgroundColor: Brand.error },
      textColor: '#ffffff',
    },
    text: {
      container: { backgroundColor: 'transparent' },
      textColor: Brand.primary,
    },
  };
  return map[variant] || map.primary;
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8 },
  md: { paddingHorizontal: 24, paddingVertical: 14 },
  lg: { paddingHorizontal: 32, paddingVertical: 18 },
};

const sizeTextStyles: Record<string, { fontSize: number }> = {
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { marginRight: 4 },
  text: { fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
