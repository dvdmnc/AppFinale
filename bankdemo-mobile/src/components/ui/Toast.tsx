import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Radius, Spacing, Shadows } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const TOAST_DURATION = 3000;

const iconMap: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { name: 'checkmark-circle', color: Brand.success, bg: Brand.success + '18' },
  error:   { name: 'close-circle',     color: Brand.error,   bg: Brand.error + '18' },
  info:    { name: 'information-circle', color: Brand.primary, bg: Brand.primary + '18' },
  warning: { name: 'warning',          color: Brand.warning, bg: Brand.warning + '18' },
};

function ToastItem({ toast, onDismiss, isDark }: { toast: Toast; onDismiss: (id: string) => void; isDark?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss(toast.id));
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const config = iconMap[toast.type];

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }], backgroundColor: isDark ? '#1A202C' : '#fff' }]}>
      <View style={[styles.toastIcon, { backgroundColor: config.bg }]}>
        <Ionicons name={config.name} size={20} color={config.color} />
      </View>
      <Text style={[styles.toastText, { color: isDark ? '#F7FAFC' : '#1a1a1a' }]} numberOfLines={2}>{toast.message}</Text>
      <TouchableOpacity onPress={() => onDismiss(toast.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color="#999" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} isDark={scheme === 'dark'} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    width: '100%',
    ...Shadows.dropdown,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
