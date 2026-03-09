import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { authService } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SecurityIcon, FingerprintIcon } from '../components/icons/BankIcons';
import { useToast } from '../components/ui/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      const biometricOn = await authService.isBiometricEnabled();
      if (!biometricOn) return;
      try {
        const success = await authService.biometricLogin();
        if (success) navigation.replace('MainTabs');
      } catch {}
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.login(email, password);
      showToast('Connexion réussie', 'success');
      navigation.replace('MainTabs');
    } catch (e: any) {
      setError(e.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Premium gradient background */}
      <View style={styles.bgBase} />
      <View style={styles.bgPurple} />
      <View style={styles.bgAccent} />

      {/* Decorative geometric elements */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      {/* Header with logo */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <SecurityIcon size={32} color="#fff" />
          </View>
          <Text style={styles.logoText}>BankDemo</Text>
        </View>
        <Text style={styles.welcomeTitle}>Bon retour</Text>
        <Text style={styles.welcomeSub}>Accédez à votre espace bancaire sécurisé</Text>
      </Animated.View>

      {/* Login Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.cardWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.card, { backgroundColor: colors.card, opacity: fadeAnim }, Shadows.modal]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Connexion</Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              Entrez vos identifiants pour continuer
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="E-mail"
              placeholder="yassin@bankdemo.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="email-input"
              containerStyle={{ marginBottom: Spacing.base }}
            />

            <Input
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
              testID="password-input"
              containerStyle={{ marginBottom: Spacing.xl }}
            />

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              testID="login-button"
            >
              Se connecter
            </Button>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Biometric Button */}
            <Button
              variant="secondary"
              fullWidth
              onPress={async () => {
                setLoading(true);
                try {
                  const success = await authService.biometricLogin();
                  if (success) navigation.replace('MainTabs');
                  else setError('Échec de l\'authentification biométrique');
                } catch (e: any) {
                  setError(e.message || 'Biométrie non disponible');
                } finally {
                  setLoading(false);
                }
              }}
              icon={<FingerprintIcon size={18} color={Brand.primary} />}
            >
              Empreinte / Face ID
            </Button>

            {/* Lien inscription */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}
            >
              <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
                Pas encore de compte ?{' '}
                <Text style={{ color: Brand.primary, fontWeight: '600' }}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Trust indicators — below card */}
          <View style={styles.trustRow}>
            <SecurityIcon size={14} color="rgba(255,255,255,0.6)" />
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
  bgPurple: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: Brand.primary, opacity: 0.85,
  },
  bgAccent: {
    position: 'absolute', top: 0, right: 0, width: '60%', height: '40%',
    backgroundColor: Brand.purple, opacity: 0.35,
    borderBottomLeftRadius: 200,
  },
  orb1: {
    position: 'absolute', top: -60, right: -60, width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orb2: {
    position: 'absolute', top: '20%', left: -80, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orb3: {
    position: 'absolute', top: '35%', right: -40, width: 120, height: 120,
    borderRadius: 60, backgroundColor: Brand.accent, opacity: 0.12,
  },
  header: { paddingTop: 72, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing['2xl'] },
  logoBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  welcomeTitle: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  cardWrapper: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  card: {
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, marginBottom: Spacing.xl },
  errorBox: {
    backgroundColor: Brand.error + '14',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Brand.error,
  },
  errorText: { color: Brand.error, fontSize: 14, fontWeight: '500' },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: Spacing.base, fontSize: 13, fontWeight: '500' },
  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingBottom: 16,
  },
  trustText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  registerLink: { alignItems: 'center', marginTop: Spacing.xl },
  registerText: { fontSize: 14 },
});
