import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Brand, Radius, Shadows, Spacing, Typography } from '../theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const MONTHLY_SPENDING_LIMIT = 5000;
const ATM_WITHDRAWAL_LIMIT = 1500;

// Simulated full card number derived from account
function generateCardNumber(accountNumber: string): string {
  const last4 = accountNumber.slice(-4);
  return `4970 1234 5678 ${last4}`;
}

export default function CardScreen() {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [accountNumber, setAccountNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [cardLocked, setCardLocked] = useState(false);
  const [onlinePaymentsLocked, setOnlinePaymentsLocked] = useState(false);
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [atmWithdrawn, setAtmWithdrawn] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinPassword, setPinPassword] = useState('');
  const [pinRevealed, setPinRevealed] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const pinTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Simulated PIN (in a real app this would come from the backend)
  const cardPin = '5291';

  useEffect(() => {
    (async () => {
      try {
        const [account, user] = await Promise.all([
          api.get<{ balance: string; account_number: string }>('/account'),
          api.get<{ name: string }>('/user'),
        ]);
        setAccountNumber(account.account_number);
        setUserName(user.name);
        setMonthlySpent(Math.round(Math.random() * 2000 * 100) / 100);
        setAtmWithdrawn(Math.round(Math.random() * 600 * 100) / 100);
      } catch {}
      setInitialLoading(false);
    })();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fullNumber = accountNumber ? generateCardNumber(accountNumber) : '';
  const maskedNumber = accountNumber
    ? `•••• •••• •••• ${accountNumber.slice(-4)}`
    : '•••• •••• •••• ••••';

  const expiryDate = '12/28';

  const handleToggleCardLock = () => {
    const newVal = !cardLocked;
    setCardLocked(newVal);
    showToast(
      newVal ? 'Carte verrouillée' : 'Carte déverrouillée',
      newVal ? 'info' : 'success',
    );
  };

  const handleToggleOnlinePayments = () => {
    const newVal = !onlinePaymentsLocked;
    setOnlinePaymentsLocked(newVal);
    showToast(
      newVal ? 'Paiements en ligne désactivés' : 'Paiements en ligne activés',
      newVal ? 'info' : 'success',
    );
  };

  const handleToggleDetails = () => {
    setDetailsRevealed((prev) => !prev);
  };

  const handleRevealPin = async () => {
    if (!pinPassword) {
      setPinError('Veuillez entrer votre mot de passe');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      await api.post('/verify-password', { password: pinPassword });
      setShowPinModal(false);
      setPinPassword('');
      setPinRevealed(true);
      showToast('Code PIN révélé pour 30 secondes', 'info');
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
      pinTimerRef.current = setTimeout(() => setPinRevealed(false), 30_000);
    } catch (err: any) {
      setPinError(err.message || 'Mot de passe incorrect');
    } finally {
      setPinLoading(false);
    }
  };

  const spendingPercentage = Math.min(monthlySpent / MONTHLY_SPENDING_LIMIT, 1);
  const atmPercentage = Math.min(atmWithdrawn / ATM_WITHDRAWAL_LIMIT, 1);

  const formatAmount = (amount: number) =>
    amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      <View style={styles.header}>
        <Text style={[Typography.h2, { color: colors.text }]}>Ma carte</Text>
        <View style={[styles.statusChip, { backgroundColor: (cardLocked ? Brand.error : Brand.success) + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: cardLocked ? Brand.error : Brand.success }]} />
          <Text style={{ color: cardLocked ? Brand.error : Brand.success, fontSize: 12, fontWeight: '600' }}>
            {cardLocked ? 'Verrouillée' : 'Active'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visual Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleToggleDetails}>
            <LinearGradient
              colors={cardLocked ? ['#6B7280', '#4B5563'] : [Brand.primary, '#0055CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardVisual}
            >
              {/* Card chip */}
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <MaterialCommunityIcons name="integrated-circuit-chip" size={36} color="#FFD700" />
                </View>
                <MaterialCommunityIcons name="contactless-payment" size={24} color="rgba(255,255,255,0.7)" />
              </View>

              {/* Card number */}
              <Text style={styles.cardNumber}>
                {detailsRevealed ? fullNumber : maskedNumber}
              </Text>

              {/* Card details row */}
              <View style={styles.cardDetailsRow}>
                <View>
                  <Text style={styles.cardDetailLabel}>TITULAIRE</Text>
                  <Text style={styles.cardDetailValue}>{userName.toUpperCase() || 'TITULAIRE'}</Text>
                </View>
                <View>
                  <Text style={styles.cardDetailLabel}>EXPIRE</Text>
                  <Text style={styles.cardDetailValue}>{detailsRevealed ? expiryDate : '••/••'}</Text>
                </View>
                <View>
                  <Text style={styles.cardDetailLabel}>CVV</Text>
                  <Text style={styles.cardDetailValue}>{detailsRevealed ? '847' : '•••'}</Text>
                </View>
              </View>

              {/* Reveal hint */}
              <View style={styles.revealHint}>
                <Ionicons
                  name={detailsRevealed ? 'eye-off-outline' : 'eye-outline'}
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.revealHintText}>
                  {detailsRevealed ? 'Masquer les détails' : 'Afficher les détails'}
                </Text>
              </View>

              {/* Card network logo */}
              <View style={styles.networkLogo}>
                <View style={styles.visaCircle1} />
                <View style={styles.visaCircle2} />
              </View>

              {/* Locked overlay */}
              {cardLocked && (
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={40} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.lockedText}>CARTE VERROUILLÉE</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Card Controls */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contrôles de la carte</Text>
          </View>

          {/* Lock Card Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: (cardLocked ? Brand.error : Brand.success) + '18' }]}>
              <Ionicons
                name={cardLocked ? 'lock-closed' : 'lock-open'}
                size={20}
                color={cardLocked ? Brand.error : Brand.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Verrouiller la carte</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                {cardLocked ? 'Toutes les transactions sont bloquées' : 'La carte est active'}
              </Text>
            </View>
            <Switch
              value={cardLocked}
              onValueChange={handleToggleCardLock}
              trackColor={{ false: colors.muted, true: Brand.error }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { borderColor: colors.border }]} />

          {/* Online Payments Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: (onlinePaymentsLocked ? Brand.error : Brand.primary) + '18' }]}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={onlinePaymentsLocked ? Brand.error : Brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Paiements en ligne</Text>
              <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>
                {onlinePaymentsLocked ? 'Paiements en ligne désactivés' : 'Paiements en ligne activés'}
              </Text>
            </View>
            <Switch
              value={onlinePaymentsLocked}
              onValueChange={handleToggleOnlinePayments}
              trackColor={{ false: colors.muted, true: Brand.error }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* PIN Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="keypad-outline" size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Code PIN</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.pinDots]}>
                {pinRevealed ? (
                  <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: 8 }}>{cardPin}</Text>
                ) : (
                  <Text style={{ fontSize: 24, color: colors.mutedForeground, letterSpacing: 4 }}>••••</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.pinButton, { backgroundColor: pinRevealed ? Brand.error + '15' : Brand.primary + '15' }]}
              onPress={() => {
                if (pinRevealed) {
                  setPinRevealed(false);
                  if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
                } else {
                  setPinError('');
                  setPinPassword('');
                  setShowPinModal(true);
                }
              }}
            >
              <Ionicons name={pinRevealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={pinRevealed ? Brand.error : Brand.primary} />
              <Text style={{ color: pinRevealed ? Brand.error : Brand.primary, fontWeight: '600', fontSize: 14 }}>
                {pinRevealed ? 'Masquer' : 'Voir le PIN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PIN Verification Modal */}
        <Modal visible={showPinModal} onClose={() => setShowPinModal(false)} title="Vérifier votre identité">
          <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
            Pour des raisons de sécurité, veuillez entrer votre mot de passe pour afficher le code PIN.
          </Text>
          {pinError ? (
            <View style={{ backgroundColor: Brand.error + '15', padding: 12, borderRadius: 10, marginBottom: 12 }}>
              <Text style={{ color: Brand.error, fontSize: 13 }}>{pinError}</Text>
            </View>
          ) : null}
          <Input
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
            value={pinPassword}
            onChangeText={setPinPassword}
            secureTextEntry
          />
          <Button
            onPress={handleRevealPin}
            disabled={pinLoading}
            loading={pinLoading}
            style={{ marginTop: 8 }}
          >
            {pinLoading ? 'Vérification...' : 'Vérifier et afficher'}
          </Button>
        </Modal>

        {/* Spending Overview */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={20} color={Brand.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dépenses du mois</Text>
          </View>

          {/* Monthly Spending */}
          <View style={styles.limitBlock}>
            <View style={styles.limitHeader}>
              <View style={styles.limitLabelRow}>
                <Ionicons name="card-outline" size={18} color={Brand.primary} />
                <Text style={[styles.limitLabel, { color: colors.text }]}>Dépenses par carte</Text>
              </View>
              <Text style={[styles.limitAmount, { color: colors.text }]}>
                €{formatAmount(monthlySpent)}
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}> / €{formatAmount(MONTHLY_SPENDING_LIMIT)}</Text>
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${spendingPercentage * 100}%`,
                    backgroundColor: spendingPercentage > 0.8 ? Brand.error : Brand.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.limitRemaining, { color: colors.mutedForeground }]}>
              Restant : €{formatAmount(Math.max(MONTHLY_SPENDING_LIMIT - monthlySpent, 0))}
            </Text>
          </View>

          <View style={[styles.divider, { borderColor: colors.border }]} />

          {/* ATM Withdrawal */}
          <View style={styles.limitBlock}>
            <View style={styles.limitHeader}>
              <View style={styles.limitLabelRow}>
                <MaterialCommunityIcons name="atm" size={18} color={Brand.accent} />
                <Text style={[styles.limitLabel, { color: colors.text }]}>Retraits DAB</Text>
              </View>
              <Text style={[styles.limitAmount, { color: colors.text }]}>
                €{formatAmount(atmWithdrawn)}
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}> / €{formatAmount(ATM_WITHDRAWAL_LIMIT)}</Text>
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${atmPercentage * 100}%`,
                    backgroundColor: atmPercentage > 0.8 ? Brand.error : Brand.accent,
                  },
                ]}
              />
            </View>
            <Text style={[styles.limitRemaining, { color: colors.mutedForeground }]}>
              Restant : €{formatAmount(Math.max(ATM_WITHDRAWAL_LIMIT - atmWithdrawn, 0))}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.base },

  /* Visual Card */
  cardVisual: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    height: 220,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: 50,
    height: 36,
    justifyContent: 'center',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 3,
    textAlign: 'center',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDetailLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardDetailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  revealHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  revealHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  networkLogo: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    flexDirection: 'row',
  },
  visaCircle1: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,90,40,0.8)',
  },
  visaCircle2: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,200,40,0.8)',
    marginLeft: -12,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },

  /* Cards / Sections */
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },

  /* Settings Row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingDesc: { fontSize: 13, marginTop: 2 },
  divider: { borderTopWidth: 1, marginVertical: Spacing.xs },

  /* PIN */
  pinDots: { minWidth: 80 },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  /* Limits / Progress */
  limitBlock: { paddingVertical: Spacing.sm },
  limitHeader: { marginBottom: Spacing.sm },
  limitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  limitLabel: { fontSize: 14, fontWeight: '500' },
  limitAmount: { fontSize: 16, fontWeight: '700' },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  limitRemaining: { fontSize: 12, marginTop: 4 },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
