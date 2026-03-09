import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors, Brand, Radius, Shadows, Spacing } from '../../theme';
import { IncomeIcon, ExpenseIcon, TransferIcon, MapPinIcon, CopyIcon } from '../icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';

/* ─── Balance Card ─── */
export interface BalanceCardProps {
  balance: number;
  currency?: string;
  accountNumber: string;
  onCopyIBAN?: () => void;
}

export function BalanceCard({ balance, currency = 'EUR', accountNumber, onCopyIBAN }: BalanceCardProps) {
  const symbol = currency === 'EUR' ? '€' : '$';
  const formatted = Math.abs(balance).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={[styles.balanceCard, Shadows.floating]}>
      <View style={styles.balanceOrb1} />
      <View style={styles.balanceOrb2} />
      <Text style={styles.balanceLabel}>SOLDE TOTAL</Text>
      <Text style={styles.balanceAmount} testID="balance-text">
        {symbol}{formatted}
      </Text>
      <View style={styles.balanceDivider} />
      <View style={styles.balanceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ibanLabel}>NUMÉRO DE COMPTE</Text>
          <Text style={styles.ibanText}>{accountNumber}</Text>
        </View>
        {onCopyIBAN && (
          <TouchableOpacity style={styles.copyButton} onPress={onCopyIBAN} activeOpacity={0.7}>
            <CopyIcon size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── Transaction Item ─── */
export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  payee: string;
  amount: number;
  currency?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
}

/** Map raw API transaction to frontend Transaction type */
export function mapApiTransaction(raw: any): Transaction {
  // Determine if this is a received transfer (user is recipient, not sender)
  const isReceivedTransfer = raw.type === 'send' && raw.is_sender === false;

  const type: Transaction['type'] =
    raw.type === 'deposit' ? 'income' :
    isReceivedTransfer ? 'income' :
    raw.recipient_account_id ? 'transfer' : 'expense';

  const amt = Math.abs(parseFloat(raw.amount));
  const displayAmount = (type === 'income') ? amt : -amt;

  // Build a meaningful payee label
  let payee = raw.description || '';
  if (raw.other_party) {
    payee = isReceivedTransfer
      ? `Reçu de ${raw.other_party}`
      : `Envoyé à ${raw.other_party}`;
  }
  if (!payee) {
    payee = type === 'income' ? 'Dépôt' : 'Paiement';
  }

  return {
    id: String(raw.id),
    type,
    payee,
    amount: displayAmount,
    currency: 'EUR',
    date: raw.created_at || raw.date || new Date().toISOString(),
    status: 'completed',
    category: raw.type === 'deposit' ? 'revenu' : raw.type === 'send' ? 'transfert' : undefined,
  };
}

export interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const colors = useThemeColors();
  const symbol = (transaction.currency ?? 'EUR') === 'EUR' ? '€' : '$';
  const iconBg = transaction.type === 'income' ? Brand.success : transaction.type === 'expense' ? Brand.error : Brand.primary;
  const amountColor = transaction.type === 'income' ? Brand.success : Brand.error;
  const sign = transaction.amount > 0 ? '+' : '';
  const formatted = Math.abs(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormatted = formatShortDate(transaction.date);

  return (
    <TouchableOpacity
      style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.txIcon, { backgroundColor: iconBg + '18' }]}>
        {transaction.type === 'income' && <IncomeIcon size={18} color={iconBg} />}
        {transaction.type === 'expense' && <ExpenseIcon size={18} color={iconBg} />}
        {transaction.type === 'transfer' && <TransferIcon size={18} color={iconBg} />}
      </View>
      <View style={styles.txContent}>
        <Text style={[styles.txPayee, { color: colors.text }]} numberOfLines={1}>
          {transaction.payee}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{dateFormatted}</Text>
          {transaction.status === 'pending' && (
            <Text style={[styles.txPending, { color: Brand.warning }]}>En attente</Text>
          )}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {sign}{symbol}{formatted}
        </Text>
        {transaction.category && (
          <Text style={[styles.txCategory, { color: colors.mutedForeground }]}>{transaction.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ─── Quick Action Card ─── */
export function QuickActionCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.card]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── ATM Card ─── */
export interface ATMData {
  id: string;
  name: string;
  address: string;
  distance: number;
  available24h: boolean;
  services: string[];
}

export function ATMCard({
  atm,
  selected,
  onPress,
  onDirections,
}: {
  atm: ATMData;
  selected?: boolean;
  onPress?: () => void;
  onDirections?: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.atmCard,
        {
          backgroundColor: colors.card,
          borderColor: selected ? Brand.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
        selected ? Shadows.dropdown : Shadows.card,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.atmRow}>
        <View style={[styles.atmPinIcon, { backgroundColor: selected ? Brand.primary : colors.muted }]}>
          <MapPinIcon size={18} color={selected ? '#fff' : colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.atmHeader}>
            <Text style={[styles.atmName, { color: colors.text }]} numberOfLines={1}>
              {atm.name}
            </Text>
            <View style={[styles.atmBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.atmDistance, { color: colors.mutedForeground }]}>
                {atm.distance} km
              </Text>
            </View>
          </View>
          <Text style={[styles.atmAddress, { color: colors.mutedForeground }]}>{atm.address}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {atm.available24h && (
              <View style={[styles.atmTag, { backgroundColor: Brand.success + '18' }]}>
                <Text style={{ color: Brand.success, fontSize: 12 }}>24/7</Text>
              </View>
            )}
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              {atm.services.length} services
            </Text>
          </View>
          {onDirections && (
            <TouchableOpacity onPress={onDirections} style={{ marginTop: 8 }}>
              <Text style={{ color: Brand.primary, fontWeight: '600', fontSize: 14 }}>
                Itinéraire →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Helpers ─── */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  /* Balance Card */
  balanceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    backgroundColor: Brand.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceOrb2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,194,168,0.15)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  balanceAmount: { color: '#ffffff', fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: Spacing.base,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  ibanLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ibanText: { color: '#ffffff', fontSize: 13, fontFamily: 'monospace', letterSpacing: 0.5 },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Transaction Item */
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txContent: { flex: 1 },
  txPayee: { fontSize: 15, fontWeight: '600' },
  txDate: { fontSize: 12 },
  txPending: { fontSize: 11, fontWeight: '600' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txCategory: { fontSize: 11, textTransform: 'capitalize', marginTop: 2 },

  /* Quick Action */
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base + 2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 10,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600' },

  /* ATM Card */
  atmCard: { borderRadius: Radius.md, padding: Spacing.base },
  atmRow: { flexDirection: 'row', gap: 12 },
  atmPinIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  atmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  atmName: { fontSize: 15, fontWeight: '600', flex: 1 },
  atmBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  atmDistance: { fontSize: 12, fontWeight: '500' },
  atmAddress: { fontSize: 13 },
  atmTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
});
