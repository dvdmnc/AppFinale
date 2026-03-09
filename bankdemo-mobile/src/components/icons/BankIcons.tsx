import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Brand } from '../../theme';

export interface IconProps {
  size?: number;
  color?: string;
}

export const SendIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="paper-plane-outline" size={size} color={color} />
);
export const DepositIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <MaterialCommunityIcons name="bank-transfer-in" size={size} color={color} />
);
export const ATMIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <MaterialCommunityIcons name="atm" size={size} color={color} />
);
export const HistoryIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <MaterialIcons name="history" size={size} color={color} />
);
export const BellIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Ionicons name="notifications-outline" size={size} color={color} />
);
export const SecurityIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <MaterialCommunityIcons name="shield-lock-outline" size={size} color={color} />
);
export const MapPinIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="location-outline" size={size} color={color} />
);
export const ThemeIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="color-palette-outline" size={size} color={color} />
);
export const LogoutIcon = ({ size = 24, color = Brand.error }: IconProps) => (
  <MaterialIcons name="logout" size={size} color={color} />
);
export const CheckIcon = ({ size = 24, color = Brand.success }: IconProps) => (
  <Ionicons name="checkmark-circle-outline" size={size} color={color} />
);
export const AlertIcon = ({ size = 24, color = Brand.warning }: IconProps) => (
  <Ionicons name="warning-outline" size={size} color={color} />
);
export const SettingsIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="settings-outline" size={size} color={color} />
);
export const ArrowBackIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="arrow-back" size={size} color={color} />
);
export const SearchIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="search-outline" size={size} color={color} />
);
export const CloseIcon = ({ size = 24, color = '#999' }: IconProps) => (
  <Ionicons name="close" size={size} color={color} />
);
export const CopyIcon = ({ size = 24, color = '#fff' }: IconProps) => (
  <Ionicons name="copy-outline" size={size} color={color} />
);
export const PersonAddIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="person-add-outline" size={size} color={color} />
);
export const FingerprintIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <MaterialCommunityIcons name="fingerprint" size={size} color={color} />
);
export const SunIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="sunny-outline" size={size} color={color} />
);
export const MoonIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="moon-outline" size={size} color={color} />
);
export const RefreshIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="refresh-outline" size={size} color={color} />
);
export const IncomeIcon = ({ size = 24, color = Brand.success }: IconProps) => (
  <Feather name="arrow-down-left" size={size} color={color} />
);
export const ExpenseIcon = ({ size = 24, color = Brand.error }: IconProps) => (
  <Feather name="arrow-up-right" size={size} color={color} />
);
export const TransferIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Feather name="repeat" size={size} color={color} />
);
export const CardIcon = ({ size = 24, color = Brand.primary }: IconProps) => (
  <Ionicons name="card-outline" size={size} color={color} />
);
