import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Brand, Radius, Shadows, Spacing, Typography, useThemeContext } from '../theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { SecurityIcon, ThemeIcon, LogoutIcon, SunIcon, MoonIcon, RefreshIcon, FingerprintIcon, ArrowBackIcon } from '../components/icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { preference, setPreference } = useThemeContext();
  const { showToast } = useToast();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await api.get<{ id: number; name: string; email: string }>('/user');
        setUserName(user.name);
        setUserEmail(user.email);
      } catch {}
      const enabled = await authService.isBiometricEnabled();
      setBiometricsEnabled(enabled);
      const hasHW = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(hasHW && isEnrolled);
      setInitialLoading(false);
    })();
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setPreference(theme);
    showToast(`Thème changé : ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Automatique'}`, 'info');
  };

  const handleToggleBiometrics = async () => {
    const newVal = !biometricsEnabled;
    if (newVal) {
      // Verify biometric authentication before enabling
      const success = await authService.biometricUnlock();
      if (!success) {
        showToast('Échec de la vérification biométrique', 'error');
        return;
      }
    }
    await authService.setBiometricEnabled(newVal);
    setBiometricsEnabled(newVal);
    showToast(
      newVal ? 'Biométrie activée' : 'Biométrie désactivée',
      newVal ? 'success' : 'info',
    );
  };

  const handleRevokeCurrentToken = async () => {
    try {
      await api.post('/revoke-token', {});
      await api.clearToken();
      showToast('Jeton de session révoqué', 'success');
      (navigation.getParent() ?? navigation).reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast('Erreur lors de la révocation', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.post('/revoke-all-tokens', {});
      await api.clearToken();
    } catch {}
    (navigation.getParent() ?? navigation).reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePwError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePwError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      setChangePwError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setChangePwLoading(true);
    setChangePwError('');
    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      });
      showToast('Mot de passe modifié avec succès', 'success');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setChangePwError(err.message || 'Erreur lors du changement');
    } finally {
      setChangePwLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    (navigation.getParent() ?? navigation).reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const themeOptions: { key: 'light' | 'dark' | 'auto'; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: 'Clair', icon: <SunIcon size={24} color={preference === 'light' ? Brand.primary : colors.mutedForeground} /> },
    { key: 'dark', label: 'Sombre', icon: <MoonIcon size={24} color={preference === 'dark' ? Brand.primary : colors.mutedForeground} /> },
    { key: 'auto', label: 'Auto', icon: <RefreshIcon size={24} color={preference === 'auto' ? Brand.primary : colors.mutedForeground} /> },
  ];

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={Brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.md }}>
          <Text style={[Typography.h2, { color: colors.text, flex: 1 }]}>Paramètres</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil</Text>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
              <Text style={styles.avatarText}>{userName ? userName.charAt(0) : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{userEmail}</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <ThemeIcon size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Apparence</Text>
          </View>
          <View style={styles.themeGrid}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeOption,
                  {
                    borderColor: preference === opt.key ? Brand.primary : colors.border,
                    backgroundColor: preference === opt.key ? Brand.primary + '0D' : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange(opt.key)}
                activeOpacity={0.7}
              >
                <View style={{ marginBottom: 8 }}>{opt.icon}</View>
                <Text style={[styles.themeLabel, { color: colors.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <SecurityIcon size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sécurité</Text>
          </View>

          {/* Biometrics Toggle */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Connexion biométrique</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                {biometricsAvailable ? 'Utiliser Face ID / Touch ID' : 'Non disponible sur cet appareil'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: colors.muted, true: Brand.primary }}
              thumbColor="#fff"
              disabled={!biometricsAvailable}
            />
          </View>

          {/* Security Actions */}
          <View style={[styles.divider, { borderColor: colors.border }]} />

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.settingRow, { gap: Spacing.md }]}
            onPress={() => setShowChangePassword(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconBox, { backgroundColor: Brand.primary + '14' }]}>
              <Ionicons name="key-outline" size={20} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Changer le mot de passe</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Modifier votre mot de passe actuel</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { borderColor: colors.border }]} />
          <View style={{ paddingVertical: Spacing.md, gap: Spacing.md }}>
            <Button variant="secondary" fullWidth onPress={handleRevokeCurrentToken}>
              Révoquer le jeton actuel
            </Button>
            <Button variant="danger" fullWidth onPress={() => setShowRevokeAllDialog(true)}>
              Révoquer toutes les sessions
            </Button>
          </View>
        </View>

        {/* Logout */}
        <Button
          variant="danger"
          fullWidth
          icon={<LogoutIcon size={20} />}
          onPress={() => setShowLogoutDialog(true)}
        >
          Déconnexion
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmDialog
        visible={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Déconnexion"
        variant="danger"
      />

      {/* Revoke All Sessions Dialog */}
      <ConfirmDialog
        visible={showRevokeAllDialog}
        onClose={() => setShowRevokeAllDialog(false)}
        onConfirm={handleRevokeAllSessions}
        title="Révoquer toutes les sessions"
        message="Cela vous déconnectera de tous les appareils, y compris celui-ci. Êtes-vous sûr ?"
        confirmText="Tout révoquer"
        variant="danger"
      />

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        onClose={() => { setShowChangePassword(false); setChangePwError(''); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}
        title="Changer le mot de passe"
      >
        <View style={{ gap: Spacing.base }}>
          {changePwError ? (
            <View style={{ backgroundColor: Brand.error + '14', borderRadius: Radius.sm, padding: Spacing.md }}>
              <Text style={{ color: Brand.error, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>{changePwError}</Text>
            </View>
          ) : null}
          <Input
            label="Mot de passe actuel"
            placeholder="Entrez votre mot de passe actuel"
            value={currentPassword}
            onChangeText={(t) => { setCurrentPassword(t); setChangePwError(''); }}
            secureTextEntry
          />
          <Input
            label="Nouveau mot de passe"
            placeholder="Minimum 8 caractères"
            value={newPassword}
            onChangeText={(t) => { setNewPassword(t); setChangePwError(''); }}
            secureTextEntry
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            placeholder="Confirmez votre nouveau mot de passe"
            value={confirmNewPassword}
            onChangeText={(t) => { setConfirmNewPassword(t); setChangePwError(''); }}
            secureTextEntry
          />
          <Button variant="primary" fullWidth loading={changePwLoading} onPress={handleChangePassword}>
            Modifier le mot de passe
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.base },
  backBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.base },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginTop: Spacing.base },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileEmail: { fontSize: 14, marginTop: 2 },
  themeGrid: { flexDirection: 'row', gap: Spacing.md },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  themeLabel: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingDesc: { fontSize: 13 },
  divider: { borderTopWidth: 1, marginVertical: Spacing.xs },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  sessionDevice: { fontSize: 14, fontWeight: '500' },
  sessionLocation: { fontSize: 12, marginTop: 2 },
  currentBadge: { fontSize: 12, fontWeight: '600' },
  suspiciousItem: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  suspiciousHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
});
