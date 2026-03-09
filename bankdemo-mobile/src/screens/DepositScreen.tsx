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
  ActivityIndicator,
} from 'react-native';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, AmountInput } from '../components/ui/Input';
import { ArrowBackIcon, DepositIcon, CheckIcon } from '../components/icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'source' | 'amount' | 'confirm' | 'processing' | 'success';

interface DepositSource {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  maskedAccount: string;
}

const SOURCES: DepositSource[] = [
  { id: 'bank', label: 'Virement bancaire', sublabel: 'Depuis un compte externe', icon: 'business-outline', maskedAccount: 'FR76 •••• •••• •••• 4821' },
  { id: 'card', label: 'Carte bancaire', sublabel: 'Visa / Mastercard', icon: 'card-outline', maskedAccount: '•••• •••• •••• 5934' },
];

export default function DepositScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('source');
  const [selectedSource, setSelectedSource] = useState<DepositSource | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [txRef, setTxRef] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Connexion au serveur...');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const account = await api.get<{ balance: string }>('/account');
        setBalance(parseFloat(account.balance));
      } catch {}
    })();
  }, []);

  const parsedAmount = parseFloat(amount) || 0;

  const handleSelectSource = (source: DepositSource) => {
    setSelectedSource(source);
    setStep('amount');
  };

  const handleAmountNext = () => {
    if (!amount || parsedAmount <= 0) {
      setAmountError('Veuillez entrer un montant valide');
      return;
    }
    if (parsedAmount > 50000) {
      setAmountError('Le montant maximum est de €50,000');
      return;
    }
    setAmountError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setStep('processing');
    setProcessingMsg('Connexion au serveur...');
    progressAnim.setValue(0);

    // Animate progress bar over 3 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Cycle processing messages
    const msgs = ['Vérification du compte...', 'Traitement du dépôt...', 'Finalisation...'];
    const timers: ReturnType<typeof setTimeout>[] = [];
    msgs.forEach((msg, i) => timers.push(setTimeout(() => setProcessingMsg(msg), (i + 1) * 900)));

    setLoading(true);
    try {
      const res = await api.post<{ balance?: string }>('/transactions/deposit', {
        amount: parsedAmount,
        description: description || `Dépôt - ${selectedSource?.label}`,
      });
      // Wait for animation to finish
      await new Promise<void>((r) => setTimeout(r, 3000));
      timers.forEach(clearTimeout);
      const ref = `TXN-${Date.now()}`;
      setTxRef(ref);
      setNewBalance(res.balance ? parseFloat(res.balance) : (balance ?? 0) + parsedAmount);
      showToast(`Dépôt de €${parsedAmount.toFixed(2)} effectué`, 'success');
      // Animate success entrance
      successScale.setValue(0);
      successOpacity.setValue(0);
      setStep('success');
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } catch (err: any) {
      timers.forEach(clearTimeout);
      showToast(err?.message || 'Échec du dépôt', 'error');
      setStep('confirm');
      progressAnim.setValue(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'amount') setStep('source');
    else if (step === 'confirm') setStep('amount');
    else navigation.goBack();
  };

  const stepIndex = step === 'source' ? 0 : step === 'amount' ? 1 : step === 'confirm' ? 2 : 3;

  // --- Step Indicator ---
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Source', 'Montant', 'Confirmation'].map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            { backgroundColor: i <= stepIndex ? Brand.primary : colors.muted },
          ]}>
            {i < stepIndex ? (
              <Ionicons name="checkmark" size={12} color="#fff" />
            ) : (
              <Text style={{ color: i === stepIndex ? '#fff' : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>
                {i + 1}
              </Text>
            )}
          </View>
          <Text style={{ color: i <= stepIndex ? colors.text : colors.mutedForeground, fontSize: 11, fontWeight: '600', marginTop: 4 }}>
            {label}
          </Text>
          {i < 2 && (
            <View style={[styles.stepLine, { backgroundColor: i < stepIndex ? Brand.primary : colors.muted }]} />
          )}
        </View>
      ))}
    </View>
  );

  // --- Source Selection ---
  const renderSourceStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>D'où provient le dépôt ?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Sélectionnez la source de votre dépôt
      </Text>
      <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
        {SOURCES.map((source) => (
          <TouchableOpacity
            key={source.id}
            style={[
              styles.sourceCard,
              { backgroundColor: colors.card, borderColor: selectedSource?.id === source.id ? Brand.primary : colors.border },
              Shadows.card,
            ]}
            onPress={() => handleSelectSource(source)}
            activeOpacity={0.8}
          >
            <View style={[styles.sourceIcon, { backgroundColor: Brand.primary + '14' }]}>
              <Ionicons name={source.icon as any} size={22} color={Brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceLabel, { color: colors.text }]}>{source.label}</Text>
              <Text style={[styles.sourceSub, { color: colors.mutedForeground }]}>{source.sublabel}</Text>
              {source.maskedAccount ? (
                <Text style={[styles.sourceMasked, { color: colors.mutedForeground }]}>{source.maskedAccount}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // --- Amount Entry ---
  const renderAmountStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sourceSelectedBadge}>
        <Ionicons name={selectedSource?.icon as any} size={16} color={Brand.primary} />
        <Text style={{ color: Brand.primary, fontSize: 13, fontWeight: '600' }}>{selectedSource?.label}</Text>
      </View>

      <Text style={[styles.stepTitle, { color: colors.text }]}>Combien souhaitez-vous déposer ?</Text>

      {balance !== null && (
        <Text style={[styles.balanceText, { color: colors.mutedForeground }]}>
          Solde actuel : €{balance.toFixed(2)}
        </Text>
      )}

      <AmountInput
        currency="EUR"
        placeholder="0.00"
        value={amount}
        onChangeText={(t) => { setAmount(t); setAmountError(''); }}
        error={amountError}
      />

      <Input
        label="Description (optionnel)"
        placeholder="Ex: Salaire, Virement reçu..."
        value={description}
        onChangeText={setDescription}
        containerStyle={{ marginTop: Spacing.xl }}
      />

      {/* Quick amount chips */}
      <View style={styles.chipRow}>
        {[50, 100, 200, 500].map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { setAmount(String(v)); setAmountError(''); }}
          >
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>€{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // --- Confirmation ---
  const renderConfirmStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Confirmer votre dépôt</Text>
      <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
        Vérifiez les détails avant de confirmer
      </Text>

      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Source</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedSource?.label}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Montant</Text>
          <Text style={[styles.summaryAmount, { color: Brand.success }]}>+€{parsedAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Description</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {description || `Dépôt - ${selectedSource?.label}`}
          </Text>
        </View>
        {balance !== null && (
          <>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Nouveau solde</Text>
              <Text style={[styles.summaryValue, { color: colors.text, fontWeight: '700' }]}>
                €{(balance + parsedAmount).toFixed(2)}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  // --- Processing ---
  const renderProcessingStep = () => {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <View style={styles.processingContainer}>
        <View style={[styles.processingIconRing, { borderColor: Brand.primary + '30' }]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.text, marginTop: Spacing.xl }]}>Traitement en cours...</Text>
        <Text style={[styles.processingStatus, { color: Brand.primary }]}>{processingMsg}</Text>
        <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, marginTop: Spacing.sm }]}>
          Veuillez patienter pendant que nous traitons votre dépôt
        </Text>
        <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={[styles.processingAmount, { color: colors.text }]}>€{parsedAmount.toFixed(2)}</Text>
      </View>
    );
  };

  // --- Success / Receipt ---
  const renderSuccessStep = () => (
    <Animated.View style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
      <View style={[styles.successIcon, { backgroundColor: Brand.success + '18' }]}>
        <CheckIcon size={40} color={Brand.success} />
      </View>
      <Text style={[styles.successTitle, { color: colors.text }]}>Dépôt effectué !</Text>
      <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
        €{parsedAmount.toFixed(2)} ajouté à votre compte
      </Text>

      {/* Receipt card */}
      <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Référence</Text>
          <Text style={[styles.receiptValue, { color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>{txRef}</Text>
        </View>
        <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Source</Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>{selectedSource?.label}</Text>
        </View>
        {selectedSource?.maskedAccount ? (
          <>
            <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Compte</Text>
              <Text style={[styles.receiptValue, { color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 }]}>{selectedSource.maskedAccount}</Text>
            </View>
          </>
        ) : null}
        <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Montant</Text>
          <Text style={[styles.receiptValue, { color: Brand.success, fontWeight: '700', fontSize: 16 }]}>+€{parsedAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Date</Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={[styles.receiptDivider, { backgroundColor: colors.border }]} />
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Statut</Text>
          <View style={styles.receiptStatusBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Brand.success} />
            <Text style={{ color: Brand.success, fontSize: 13, fontWeight: '600' }}>Complété</Text>
          </View>
        </View>
      </View>

      {newBalance !== null && (
        <View style={[styles.newBalanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>NOUVEAU SOLDE</Text>
          <Text style={{ color: Brand.success, fontSize: 28, fontWeight: '700', marginTop: 4 }}>€{newBalance.toFixed(2)}</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {step !== 'processing' && step !== 'success' && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.md }}>
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ArrowBackIcon size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text, flex: 1, marginBottom: 0 }]}>Dépôt</Text>
          </View>
          {renderStepIndicator()}
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'source' && renderSourceStep()}
          {step === 'amount' && renderAmountStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      {step === 'amount' && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button variant="primary" fullWidth onPress={handleAmountNext}>
            Continuer
          </Button>
        </View>
      )}
      {step === 'confirm' && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button variant="primary" fullWidth loading={loading} onPress={handleConfirm}>
            Confirmer le dépôt
          </Button>
        </View>
      )}
      {step === 'success' && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button variant="primary" fullWidth onPress={() => navigation.goBack()}>
            Retour au tableau de bord
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base, borderBottomWidth: 1 },
  backBox: {
    width: 40, height: 40, borderRadius: Radius.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.h1, fontSize: 22 },
  content: { padding: Spacing.xl, paddingBottom: 120 },
  stepContent: {},
  stepTitle: { ...Typography.h2, fontSize: 20, marginBottom: Spacing.sm },
  stepSubtitle: { fontSize: 14, marginBottom: Spacing.md },
  balanceText: { fontSize: 14, marginBottom: Spacing.xl },

  /* Step Indicator */
  stepIndicator: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 0 },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLine: {
    position: 'absolute', top: 12, left: '60%', right: '-40%',
    height: 2,
    zIndex: -1,
  },

  /* Source Cards */
  sourceCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base, borderRadius: Radius.lg,
    borderWidth: 1, gap: Spacing.md,
  },
  sourceIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceLabel: { fontSize: 15, fontWeight: '600' },
  sourceSub: { fontSize: 13, marginTop: 2 },
  sourceMasked: { fontSize: 12, marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.5 },
  sourceSelectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary + '14',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, marginBottom: Spacing.lg,
  },

  /* Quick amount chips */
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  chip: {
    flex: 1, alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
  },

  /* Summary */
  summaryCard: {
    borderRadius: Radius.lg, padding: Spacing.xl,
    borderWidth: 1, marginTop: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  summaryAmount: { fontSize: 20, fontWeight: '700' },
  summaryDivider: { height: 1, marginVertical: Spacing.xs },

  /* Processing */
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  processingIconRing: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  processingStatus: { fontSize: 14, fontWeight: '600', marginTop: Spacing.sm },
  processingAmount: { fontSize: 22, fontWeight: '700', marginTop: Spacing.lg },
  progressBg: {
    width: '80%', height: 6, borderRadius: 3,
    marginTop: Spacing.xl, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Brand.primary, borderRadius: 3 },

  /* Success */
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  successTitle: { ...Typography.h2, marginBottom: 8 },
  successSub: { fontSize: 15, marginBottom: Spacing.xl },
  newBalanceCard: {
    borderRadius: Radius.lg, padding: Spacing.xl,
    borderWidth: 1, alignItems: 'center', marginTop: Spacing.lg,
  },

  /* Receipt */
  receiptCard: {
    borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1,
    width: '100%', marginTop: Spacing.lg,
  },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  receiptLabel: { fontSize: 13 },
  receiptValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  receiptDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  receiptStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
});
