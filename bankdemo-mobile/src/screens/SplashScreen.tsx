import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SecurityIcon } from '../components/icons/BankIcons';
import { Brand } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgBase} />
      <View style={styles.bgPurple} />
      <View style={styles.bgAccent} />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <SecurityIcon size={64} color="#fff" />
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>BankDemo</Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>Votre banque, en toute sécurité</Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: textOpacity }]}>Sécurisé par BankDemo</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: Brand.primary },
  bgPurple: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.purple,
    opacity: 0.4,
  },
  bgAccent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.accent,
    opacity: 0.25,
  },
  orb1: {
    position: 'absolute', top: '10%', left: '-20%',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orb2: {
    position: 'absolute', bottom: '5%', right: '-15%',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: { alignItems: 'center', zIndex: 1 },
  logoBox: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36, fontWeight: '800', color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  footer: {
    position: 'absolute', bottom: 48,
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
});
