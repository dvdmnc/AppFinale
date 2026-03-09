import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { api } from '../services/api';
import { TransactionItem, type Transaction, mapApiTransaction } from '../components/ui/Cards';
import { Ionicons } from '@expo/vector-icons';
import { ArrowBackIcon, HistoryIcon } from '../components/icons/BankIcons';
import { SearchInput } from '../components/ui/Input';

export default function TransactionHistoryScreen({ navigation }: any) {
  const colors = useThemeColors();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  const loadTransactions = async () => {
    try {
      const res = await api.get<{ data: any[] }>('/transactions');
      setTransactions((res.data || []).map(mapApiTransaction));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== 'all') {
      list = list.filter((t) => t.type === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.payee?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          (t as any).description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, filter, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const groups: { label: string; data: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    for (const tx of filtered) {
      const dateStr = new Date(tx.date || (tx as any).created_at).toDateString();
      let label: string;
      if (dateStr === today) label = "Aujourd'hui";
      else if (dateStr === yesterday) label = 'Hier';
      else label = new Date(tx.date || (tx as any).created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(tx);
    }

    for (const [label, data] of map) {
      groups.push({ label, data });
    }
    return groups;
  }, [filtered]);

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'income', label: 'Revenus' },
    { key: 'expense', label: 'Dépenses' },
    { key: 'transfer', label: 'Transferts' },
  ];

  const stats = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense };
  }, [filtered]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[Typography.h2, { color: colors.text, flex: 1 }]}>Historique</Text>
        </View>

        <SearchInput
          placeholder="Rechercher une transaction..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key
                  ? { backgroundColor: Brand.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: filter === tab.key ? '#fff' : colors.mutedForeground,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats & Count */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Brand.success + '12' }]}>
          <Ionicons name="arrow-down-circle" size={18} color={Brand.success} />
          <View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '500' }}>Revenus</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Brand.success }}>€{stats.income.toFixed(2)}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: Brand.error + '12' }]}>
          <Ionicons name="arrow-up-circle" size={18} color={Brand.error} />
          <View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '500' }}>Dépenses</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Brand.error }}>€{stats.expense.toFixed(2)}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Ionicons name="swap-horizontal" size={18} color={Brand.primary} />
          <View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontWeight: '500' }}>Total</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{filtered.length}</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {filtered.length > 0 ? (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} colors={[Brand.primary]} />}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
                {group.label}
              </Text>
              <View style={{ gap: Spacing.sm }}>
                {group.data.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: Brand.primary + '14' }]}>
            <HistoryIcon size={36} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune transaction</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {filter !== 'all' ? 'Aucune transaction pour ce filtre' : 'Vos transactions apparaîtront ici'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.base, gap: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  countRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  group: { marginBottom: Spacing.xl },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingLeft: 2,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyDesc: { fontSize: 14 },
});
