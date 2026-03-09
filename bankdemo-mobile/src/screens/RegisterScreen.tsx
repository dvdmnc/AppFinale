import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowBackIcon, SecurityIcon, CheckIcon } from '../components/icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ui/Toast';
import { authService } from '../services/auth';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ─── Password Rules ─── */
interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Au moins 8 caractères', test: (pw) => pw.length >= 8 },
  { label: 'Une lettre majuscule', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Un chiffre', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Un caractère spécial (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const colors = useThemeColors();
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strength = passed === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : 3;
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort'];
  const strengthColors = ['', Brand.error, Brand.warning, Brand.success];

  if (!password) return null;

  return (
    <View style={pwStyles.container}>
      {/* Strength bar */}
      <View style={pwStyles.barRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              pwStyles.bar,
              { backgroundColor: i <= strength ? strengthColors[strength] : colors.muted },
            ]}
          />
        ))}
        <Text style={[pwStyles.strengthLabel, { color: strengthColors[strength] || colors.mutedForeground }]}>
          {strengthLabels[strength]}
        </Text>
      </View>
      {/* Rules checklist */}
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.label} style={pwStyles.ruleRow}>
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={met ? Brand.success : colors.mutedForeground}
            />
            <Text style={[pwStyles.ruleText, { color: met ? colors.text : colors.mutedForeground }]}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const pwStyles = StyleSheet.create({
  container: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', marginLeft: 8, minWidth: 40 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  ruleText: { fontSize: 13 },
});

import * as LocalAuthentication from 'expo-local-authentication';

export default function RegisterScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Le nom est requis';
    if (!email.trim()) e.email = "L'e-mail est requis";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Format d'e-mail invalide";
    if (!password) e.password = 'Le mot de passe est requis';
    else if (!PASSWORD_RULES.every((r) => r.test(password)))
      e.password = 'Le mot de passe ne respecte pas toutes les règles';
    if (password !== passwordConfirmation) e.passwordConfirmation = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post<{ token: string; user: { id: number; name: string; email: string } }>('/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      });
      await api.setToken(data.token);
      await SecureStore.setItemAsync('bankdemo_credentials', JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }));
      showToast('Compte créé avec succès !', 'success');

      // Check if biometric hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        setShowBiometricSetup(true);
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (err: any) {
      const message = err?.message || "Échec de l'inscription";
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    const success = await authService.biometricUnlock();
    if (success) {
      await authService.setBiometricEnabled(true);
      showToast('Biométrie activée !', 'success');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      showToast('Échec de la vérification biométrique', 'error');
    }
  };

  const handleSkipBiometric = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  if (showBiometricSetup) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.biometricContainer}>
          <View style={[styles.biometricIconBox, { backgroundColor: Brand.primary + '14' }]}>
            <Ionicons name="finger-print-outline" size={48} color={Brand.primary} />
          </View>
          <Text style={[styles.biometricTitle, { color: colors.text }]}>
            Activer la biométrie ?
          </Text>
          <Text style={[styles.biometricDesc, { color: colors.mutedForeground }]}>
            Connectez-vous plus rapidement avec votre empreinte digitale ou Face ID
          </Text>
          <View style={styles.biometricActions}>
            <Button variant="primary" fullWidth onPress={handleEnableBiometric}>
              Activer
            </Button>
            <Button variant="text" fullWidth onPress={handleSkipBiometric}>
              Plus tard
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Premium gradient background */}
      <View style={styles.bgBase} />
      <View style={styles.bgGradient} />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowBackIcon size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoRow}>
              <View style={styles.iconContainer}>
                <SecurityIcon size={28} color="#fff" />
              </View>
              <Text style={styles.logoLabel}>BankDemo</Text>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez BankDemo en quelques étapes
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
            <Input
              label="Nom complet"
              placeholder="Entrez votre nom"
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
              error={errors.name}
              autoCapitalize="words"
              containerStyle={{ marginBottom: Spacing.base }}
            />
            <Input
              label="E-mail"
              placeholder="Entrez votre e-mail"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: '' })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={{ marginBottom: Spacing.base }}
            />
            <Input
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: '' })); }}
              error={errors.password}
              secureTextEntry
              containerStyle={{ marginBottom: Spacing.xs }}
            />
            <PasswordStrengthIndicator password={password} />
            <Input
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              value={passwordConfirmation}
              onChangeText={(t) => { setPasswordConfirmation(t); setErrors((e) => ({ ...e, passwordConfirmation: '' })); }}
              error={errors.passwordConfirmation}
              secureTextEntry
              containerStyle={{ marginBottom: Spacing.xl }}
            />
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleRegister}
            >
              Créer mon compte
            </Button>
          </View>

          {/* Login link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
              Déjà un compte ?{' '}
              <Text style={{ color: Brand.primary, fontWeight: '600' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

          {/* Trust indicator */}
          <View style={styles.trustRow}>
            <SecurityIcon size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.trustText}>
              Chiffrement SSL 256-bit • Sécurisé & Privé
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  /* Premium gradient background */
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a1628' },
  bgGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    backgroundColor: Brand.primary, opacity: 0.85,
    borderBottomRightRadius: 60,
  },
  bgOrb1: {
    position: 'absolute', top: -40, right: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: Brand.purple, opacity: 0.2,
  },
  bgOrb2: {
    position: 'absolute', top: '25%', left: -60, width: 160, height: 160,
    borderRadius: 80, backgroundColor: Brand.accent, opacity: 0.1,
  },
  scrollContent: { padding: Spacing.xl, paddingTop: 56, paddingBottom: 32 },
  backBtn: {
    marginBottom: Spacing.lg, width: 44, height: 44, justifyContent: 'center',
    alignItems: 'center', borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
  },
  headerSection: { marginBottom: Spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg },
  iconContainer: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 21 },
  formCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  loginLink: { alignItems: 'center', marginBottom: Spacing.lg },
  loginText: { fontSize: 14 },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  trustText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  /* Biometric setup */
  biometricContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  biometricIconBox: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  biometricTitle: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  biometricDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
  biometricActions: { width: '100%', gap: Spacing.sm },
});
