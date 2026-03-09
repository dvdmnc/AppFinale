import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Brand } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import DepositScreen from '../screens/DepositScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import ATMMapScreen from '../screens/ATMMapScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CardScreen from '../screens/CardScreen';
import SplashScreen from '../screens/SplashScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Card: undefined;
  TransactionHistory: undefined;
  ATMMap: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  SendMoney: undefined;
  Deposit: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Card"
        component={CardScreen}
        options={{
          tabBarLabel: 'Carte',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'card' : 'card-outline'} size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ATMMap"
        component={ATMMapScreen}
        options={{
          tabBarLabel: 'DAB',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'location' : 'location-outline'} size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
      <Stack.Screen name="Deposit" component={DepositScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
