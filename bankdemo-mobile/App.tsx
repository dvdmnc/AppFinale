import React, { useState } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/ui/Toast';
import { ThemeContext, type ThemePreference } from './src/theme';

export default function App() {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const isDark = preference === 'auto' ? systemScheme === 'dark' : preference === 'dark';

  return (
    <ThemeContext.Provider value={{ preference, setPreference, isDark }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
