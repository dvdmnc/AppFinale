import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, type TextInputProps, type ViewStyle } from 'react-native';
import { useThemeColors, Brand, Radius } from '../../theme';
import { SearchIcon, CloseIcon } from '../icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, style, secureTextEntry, onFocus, onBlur, ...props }, ref) => {
    const colors = useThemeColors();
    const [focused, setFocused] = useState(false);
    const [hideText, setHideText] = useState(secureTextEntry ?? false);

    return (
      <View style={containerStyle}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        <View style={{ position: 'relative' }}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                borderColor: error ? Brand.error : focused ? Brand.primary : colors.border,
                color: colors.text,
                backgroundColor: colors.input,
                paddingRight: secureTextEntry ? 48 : 16,
              },
              style,
            ]}
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={hideText}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setHideText((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={hideText ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

export interface AmountInputProps extends TextInputProps {
  currency?: string;
  error?: string;
}

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
  ({ currency = 'EUR', error, style, ...props }, ref) => {
    const colors = useThemeColors();
    const symbol = currency === 'EUR' ? '€' : '$';

    return (
      <View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountSymbol, { color: colors.mutedForeground }]}>{symbol}</Text>
          <TextInput
            ref={ref}
            style={[
              styles.amountInput,
              { borderColor: error ? Brand.error : colors.border, color: colors.text, backgroundColor: colors.input },
              style,
            ]}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.mutedForeground}
            {...props}
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  },
);

AmountInput.displayName = 'AmountInput';

export function SearchInput({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  ...props
}: InputProps & { onClear?: () => void }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
      <View style={{ marginRight: 8 }}><SearchIcon size={18} color={colors.mutedForeground} /></View>
      <TextInput
        style={[styles.searchText, { color: colors.text }]}
        placeholderTextColor={colors.mutedForeground}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {!!value && onClear && (
        <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
          <CloseIcon size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 48,
  },
  error: { color: Brand.error, fontSize: 13, fontWeight: '500', marginTop: 6 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  amountContainer: { position: 'relative' },
  amountSymbol: {
    position: 'absolute',
    left: 16,
    top: 16,
    fontSize: 28,
    fontWeight: '600',
    zIndex: 1,
  },
  amountInput: {
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  searchText: { flex: 1, fontSize: 16 },
});
