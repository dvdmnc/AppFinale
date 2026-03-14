import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input, AmountInput } from '../components/ui/Input';
import { ArrowBackIcon, PersonAddIcon, CheckIcon, FingerprintIcon, SecurityIcon } from '../components/icons/BankIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/auth';
import * as LocalAuthentication from 'expo-local-authentication';

type Step = 'recipient' | 'amount' | 'confirm' | 'success';

interface SavedRecipient {
  id: number;
  name: string;
  account_number: string;
}

export default function SendMoneyScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const [newRecipientAccount, setNewRecipientAccount] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await authService.isBiometricEnabled();
      if (enabled) {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHW && isEnrolled);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [account, recipientRes] = await Promise.all([
          api.get<{ balance: string }>('/account'),
          api.get<{ data: SavedRecipient[] }>('/recipients'),
        ]);
        setBalance(parseFloat(account.balance));
        setRecipients(recipientRes.data);
      } catch {}
      setLoadingData(false);
    })();
  }, []);

  const fee = 0.5;
  const parsedAmount = parseFloat(amount) || 0;
  const total = parsedAmount + fee;

  const handleAddRecipient = async () => {
    if (!newRecipientName.trim() || !newRecipientAccount.trim()) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    try {
      const created = await api.post<SavedRecipient>('/recipients', {
        name: newRecipientName.trim(),
        account_number: newRecipientAccount.trim(),
      });
      setRecipients((prev) => [...prev, created]);
      setRecipient(created.name);
      setRecipientAccount(created.account_number);
      setShowAddRecipient(false);
      setNewRecipientName('');
      setNewRecipientAccount('');
      showToast('Bénéficiaire ajouté', 'success');
    } catch (err: any) {
      showToast(err?.message || "Erreur lors de l'ajout du bénéficiaire", 'error');
    }
  };

  const handleRecipientNext = () => {
    if (!recipient || recipient.length < 3) {
      setRecipientError('Veuillez entrer un nom de bénéficiaire valide');
      return;
    }
    if (!recipientAccount) {
      setRecipientError('Veuillez sélectionner ou entrer un numéro de compte');
      return;
    }
    setRecipientError('');
    setStep('amount');
  };

  const handleAmountNext = () => {
    if (!amount || parsedAmount <= 0) {
      setAmountError('Veuillez entrer un montant valide');
      return;
    }
    if (parsedAmount + fee > balance) {
      setAmountError(`Solde insuffisant. Disponible : €${balance.toFixed(2)}`);
      return;
    }
    setAmountError('');
    setVerified(false);
    setVerifyPassword('');
    setVerifyError('');
    setStep('confirm');
  };

  const handleVerifyBiometric = async () => {
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const success = await authService.biometricUnlock();
      if (success) {
        setVerified(true);
      } else {
        setVerifyError('Échec de la vérification biométrique');
      }
    } catch {
      setVerifyError('Erreur lors de la vérification');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      setVerifyError('Veuillez entrer votre mot de passe');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await api.post('/verify-password', { password: verifyPassword });
      setVerified(true);
      setVerifyPassword('');
    } catch (err: any) {
      setVerifyError(err?.message || 'Mot de passe incorrect');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSend = async () => {
    if (!verified) {
      showToast('Veuillez vérifier votre identité avant d\'envoyer', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/transactions/send', {
        recipient_account_number: recipientAccount,
        amount: parsedAmount,
        description: note,
      });
      showToast(`€${parsedAmount.toFixed(2)} envoyé à ${recipient}`, 'success');
      setStep('success');
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } catch (err: any) {
      showToast(err?.message || "Échec de l'envoi", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'recipient') navigation.goBack();
    else if (step === 'amount') setStep('recipient');
    else if (step === 'confirm') setStep('amount');
    else navigation.goBack();
  };

  const stepIndex = step === 'recipient' ? 0 : step === 'amount' ? 1 : 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.md }}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ArrowBackIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, flex: 1, marginBottom: 0 }]}>Envoyer de l'argent</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progress}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= stepIndex ? Brand.primary : colors.muted },
              ]}
            />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Step 1: Recipient */}
          {step === 'recipient' && (
            <View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                À qui souhaitez-vous envoyer de l'argent ?
              </Text>
              <Input
                label="Numéro de compte"
                placeholder="Entrez le numéro de compte"
                value={recipientAccount}
                onChangeText={(t) => { setRecipientAccount(t); setRecipientError(''); }}
                error={recipientError}
                autoCapitalize="characters"
                testID="recipient-input"
                containerStyle={{ marginBottom: Spacing.xl }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Vos bénéficiaires</Text>
                <TouchableOpacity onPress={() => setShowAddRecipient(!showAddRecipient)}>
                  <PersonAddIcon size={22} color={Brand.primary} />
                </TouchableOpacity>
              </View>

              {showAddRecipient && (
                <View style={[styles.addRecipientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Input
                    label="Nom"
                    placeholder="Nom du bénéficiaire"
                    value={newRecipientName}
                    onChangeText={setNewRecipientName}
                    containerStyle={{ marginBottom: Spacing.sm }}
                  />
                  <Input
                    label="Numéro de compte"
                    placeholder="Ex: ACC00000002"
                    value={newRecipientAccount}
                    onChangeText={setNewRecipientAccount}
                    containerStyle={{ marginBottom: Spacing.md }}
                  />
                  <Button variant="primary" size="sm" onPress={handleAddRecipient}>
                    Ajouter
                  </Button>
                </View>
              )}

              {loadingData ? (
                <ActivityIndicator color={Brand.primary} style={{ marginTop: 20 }} />
              ) : (
              <View style={{ gap: 8 }}>
                {recipients.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.recipientCard,
                      {
                        backgroundColor: recipientAccount === r.account_number ? Brand.primary + '0A' : colors.card,
                        borderColor: recipientAccount === r.account_number ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setRecipient(r.name); setRecipientAccount(r.account_number); }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.recipientAvatar,
                      { backgroundColor: recipientAccount === r.account_number ? Brand.primary : Brand.primary + '18' },
                    ]}>
                      <Text style={{ color: recipientAccount === r.account_number ? '#fff' : Brand.primary, fontWeight: '600', fontSize: 14 }}>
                        {r.name.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recipientName, { color: colors.text }]}>{r.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' }}>
                        {r.account_number}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              )}
            </View>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Combien souhaitez-vous envoyer ?
              </Text>
              <AmountInput
                currency="EUR"
                placeholder="0.00"
                value={amount}
                onChangeText={(t) => { setAmount(t); setAmountError(''); }}
                error={amountError}
                testID="amount-input"
              />
              <Input
                label="Note (optionnel)"
                placeholder="Motif du virement"
                value={note}
                onChangeText={setNote}
                testID="description-input"
                containerStyle={{ marginTop: Spacing.xl }}
              />
            </View>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Confirmer le transfert</Text>

              {/* Centered hero amount — matching prototype */}
              <View style={styles.heroAmount}>
                <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Vous envoyez</Text>
                <Text style={[styles.heroValue, { color: Brand.primary }]}>€{parsedAmount.toFixed(2)}</Text>
                <Text style={[styles.heroRecipient, { color: colors.mutedForeground }]}>à {recipient}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
                <SummaryRow label="Montant" value={`€${parsedAmount.toFixed(2)}`} colors={colors} />
                <SummaryRow label="Frais" value={`€${fee.toFixed(2)}`} colors={colors} />
                {note ? <SummaryRow label="Note" value={note} colors={colors} /> : null}
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' }]}>Total</Text>
                  <Text style={[styles.summaryValue, { color: Brand.primary, fontWeight: '700', fontSize: 18 }]}>
                    €{total.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Identity verification */}
              <View style={[styles.verifyCard, { backgroundColor: colors.card, borderColor: verified ? Brand.success : colors.border }, Shadows.card]}>
                <View style={styles.verifyHeader}>
                  <SecurityIcon size={20} color={verified ? Brand.success : colors.mutedForeground} />
                  <Text style={[styles.verifyTitle, { color: colors.text }]}>
                    {verified ? 'Identité vérifiée' : 'Vérification requise'}
                  </Text>
                </View>
                {verified ? (
                  <View style={styles.verifiedRow}>
                    <View style={[styles.verifiedBadge, { backgroundColor: Brand.success + '18' }]}>
                      <CheckIcon size={16} color={Brand.success} />
                      <Text style={[styles.verifiedText, { color: Brand.success }]}>Vérifié</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={[styles.verifySubtitle, { color: colors.mutedForeground }]}>
                      Confirmez votre identité pour autoriser ce transfert
                    </Text>
                    {biometricsAvailable && (
                      <TouchableOpacity
                        style={[styles.biometricBtn, { backgroundColor: Brand.primary + '12', borderColor: Brand.primary + '30' }]}
                        onPress={handleVerifyBiometric}
                        disabled={verifyLoading}
                      >
                        <FingerprintIcon size={22} color={Brand.primary} />
                        <Text style={[styles.biometricBtnText, { color: Brand.primary }]}>Vérifier par biométrie</Text>
                      </TouchableOpacity>
                    )}
                    {biometricsAvailable && (
                      <View style={styles.verifyDivider}>
                        <View style={[styles.verifyDividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.verifyDividerText, { color: colors.mutedForeground }]}>ou</Text>
                        <View style={[styles.verifyDividerLine, { backgroundColor: colors.border }]} />
                      </View>
                    )}
                    <Input
                      label="Mot de passe"
                      placeholder="Entrez votre mot de passe"
                      value={verifyPassword}
                      onChangeText={(t) => { setVerifyPassword(t); setVerifyError(''); }}
                      secureTextEntry
                      error={verifyError}
                    />
                    <Button
                      variant="primary"
                      fullWidth
                      loading={verifyLoading}
                      onPress={handleVerifyPassword}
                      style={{ marginTop: Spacing.sm }}
                    >
                      Vérifier le mot de passe
                    </Button>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <Animated.View style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
              <View style={styles.successIcon}>
                <CheckIcon size={40} color={Brand.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Paiement envoyé !</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                €{parsedAmount.toFixed(2)} envoyé à {recipient}
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        {step !== 'success' ? (
          <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              disabled={step === 'confirm' && !verified}
              onPress={
                step === 'recipient' ? handleRecipientNext :
                step === 'amount' ? handleAmountNext :
                handleSend
              }
              testID="send-button"
            >
              {step === 'confirm' ? 'Confirmer & Envoyer' : 'Continuer'}
            </Button>
            {step === 'confirm' && (
              <Button
                variant="text"
                fullWidth
                onPress={() => setStep('amount')}
                style={{ marginTop: Spacing.sm }}
              >
                Annuler
              </Button>
            )}
          </View>
        ) : (
          <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button variant="primary" fullWidth onPress={() => navigation.goBack()}>
              Retour au tableau de bord
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base, borderBottomWidth: 1 },
  backBox: {
    width: 40, height: 40, borderRadius: Radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h1, fontSize: 22 },
  progress: { flexDirection: 'row', gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  content: { padding: Spacing.xl, paddingBottom: 120 },
  stepTitle: { ...Typography.h2, fontSize: 20, marginBottom: Spacing.xl },
  subLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.md },
  recipientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, minHeight: 44,
  },
  recipientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  recipientName: { fontWeight: '600', fontSize: 15 },
  addRecipientCard: {
    borderRadius: Radius.md, borderWidth: 1, padding: Spacing.base, marginBottom: Spacing.base,
  },
  summaryCard: { borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryDivider: { height: 1, marginVertical: 8 },
  successContainer: { alignItems: 'center', paddingTop: 60 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.success + '18',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  successTitle: { ...Typography.h2, marginBottom: 8 },
  successSub: { fontSize: 15 },
  heroAmount: { alignItems: 'center', paddingVertical: Spacing['2xl'], marginBottom: Spacing.xl },
  heroLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  heroValue: { fontSize: 42, fontWeight: '700', letterSpacing: -1 },
  heroRecipient: { fontSize: 15, marginTop: 6, fontWeight: '500' },
  verifyCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg, borderWidth: 1,
  },
  verifyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  verifyTitle: { fontSize: 16, fontWeight: '700' },
  verifySubtitle: { fontSize: 13, marginBottom: Spacing.md },
  verifiedRow: { marginTop: Spacing.xs },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 14, fontWeight: '600' },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.sm,
  },
  biometricBtnText: { fontSize: 15, fontWeight: '600' },
  verifyDivider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm,
  },
  verifyDividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  verifyDividerText: { marginHorizontal: Spacing.sm, fontSize: 12 },
  bottomBar: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
});
