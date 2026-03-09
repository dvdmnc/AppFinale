import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors, Brand, Radius, Spacing, Typography, Shadows } from '../theme';
import { api } from '../services/api';
import { BalanceCard, TransactionItem, type Transaction, mapApiTransaction } from '../components/ui/Cards';
import { SendIcon, DepositIcon, BellIcon } from '../components/icons/BankIcons';
import { useToast } from '../components/ui/Toast';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [balance, setBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dataLoaded = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [account, user, txRes, notifRes] = await Promise.all([
        api.get<{ balance: string; account_number: string }>('/account'),
        api.get<{ id: number; name: string; email: string }>('/user'),
        api.get<{ data: Transaction[] }>('/transactions'),
        api.get<{ data: any[] }>('/notifications'),
      ]);
      setBalance(parseFloat(account.balance));
      setAccountNumber(account.account_number);
      setUserName(user.name);
      setTransactions((txRes.data || []).map(mapApiTransaction));
      setUnreadCount((notifRes.data || []).filter((n: any) => !n.read).length);
      dataLoaded.current = true;
    } catch {
      if (!dataLoaded.current) {
        showToast('Erreur de chargement des données', 'error');
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Load on first mount
  useEffect(() => {
    loadData().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  }, [loadData]);

  // Reload when screen comes back into focus (e.g. after send/deposit)
  useFocusEffect(
    useCallback(() => {
      if (dataLoaded.current) {
        loadData();
      }
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} colors={[Brand.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBg} />
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.avatarBox}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName ? userName[0] : '?'}</Text>
                </View>
                <View>
                  <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
                  <Text style={[styles.userName, { color: Brand.primary }]}>{userName}</Text>
                  <View style={styles.lastLoginPill}>
                    <View style={styles.loginDot} />
                    <Text style={[styles.lastLoginText, { color: colors.mutedForeground }]}>Dernière connexion : Aujourd'hui</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Notifications')}
              >
                <BellIcon size={22} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BalanceCard
            balance={balance}
            currency="EUR"
            accountNumber={accountNumber}
          />
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Brand.primary }]}
              onPress={() => navigation.navigate('SendMoney')}
              activeOpacity={0.85}
            >
              <SendIcon size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Envoyer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Brand.accent }]}
              onPress={() => navigation.navigate('Deposit')}
              activeOpacity={0.85}
            >
              <DepositIcon size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Dépôt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={{ color: Brand.primary, fontWeight: '600', fontSize: 14 }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: Spacing.sm }}>
            {transactions.slice(0, 5).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
            {transactions.length === 0 && (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', paddingVertical: 20 }}>
                Aucune transaction
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: { position: 'relative', paddingTop: 56, paddingBottom: Spacing.lg },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.primary + '08',
  },
  headerContent: { paddingHorizontal: Spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56, height: 56, borderRadius: Radius['2xl'],
    backgroundColor: Brand.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Brand.primary + '30',
  },
  avatarText: { color: Brand.primary, fontSize: 20, fontWeight: '700' },
  greeting: { fontSize: 13, fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '700' },
  lastLoginPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4,
    backgroundColor: Brand.success + '14',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  loginDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Brand.success,
  },
  lastLoginText: { fontSize: 11, fontWeight: '500' },
  bellBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Brand.error, width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  sectionTitle: { ...Typography.h2, fontSize: 18, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
