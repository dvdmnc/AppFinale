import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Brand, Radius, Shadows, Spacing, Typography } from '../theme';
import { SecurityIcon, AlertIcon, CheckIcon, BellIcon, SendIcon, CloseIcon, ArrowBackIcon } from '../components/icons/BankIcons';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

function getIconForType(type: string) {
  switch (type) {
    case 'transaction':
      return { icon: 'paper-plane-outline' as const, bg: Brand.primary + '18', accent: Brand.primary };
    case 'security':
      return { icon: 'shield-checkmark-outline' as const, bg: Brand.success + '18', accent: Brand.success };
    case 'alert':
      return { icon: 'warning-outline' as const, bg: Brand.warning + '18', accent: Brand.warning };
    default:
      return { icon: 'mail-outline' as const, bg: Brand.primary + '18', accent: Brand.primary };
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen({ navigation }: any) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ data: any[] }>('/notifications');
      setNotifications(
        (res.data || []).map((n: any) => ({
          id: String(n.id),
          type: n.type || 'info',
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          read: !!n.read,
        })),
      );
    } catch {
      showToast('Erreur de chargement des notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications],
  );

  // Group by date
  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const groups: { label: string; data: Notification[] }[] = [];
    const map = new Map<string, Notification[]>();

    for (const notif of filteredNotifications) {
      const dateStr = new Date(notif.timestamp).toDateString();
      let label = dateStr;
      if (dateStr === today) label = "Aujourd'hui";
      else if (dateStr === yesterday) label = 'Hier';
      else
        label = new Date(notif.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(notif);
    }

    for (const [label, data] of map) {
      groups.push({ label, data });
    }
    return groups;
  }, [filteredNotifications]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await api.patch(`/notifications/${id}/read`); } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await api.patch('/notifications/read-all'); } catch {}
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const renderNotification = (notif: Notification) => {
    const { icon, bg, accent } = getIconForType(notif.type);

    return (
      <TouchableOpacity
        key={notif.id}
        style={[
          styles.notifCard,
          {
            backgroundColor: colors.card,
            borderColor: notif.read ? colors.border : accent,
            borderLeftWidth: notif.read ? 1 : 3,
          },
          Shadows.card,
        ]}
        onPress={() => handleMarkAsRead(notif.id)}
        activeOpacity={0.8}
      >
        {/* Icon */}
        <View style={[styles.notifIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text
              style={[
                styles.notifTitle,
                { color: colors.text, fontWeight: notif.read ? '400' : '600' },
              ]}
              numberOfLines={1}
            >
              {notif.title}
            </Text>
            {!notif.read && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
          </View>
          <Text style={[styles.notifMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
            {notif.message}
          </Text>
          <Text style={[styles.notifTime, { color: colors.mutedForeground + 'B3' }]}>
            {formatRelativeTime(notif.timestamp)}
          </Text>
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => handleDismiss(notif.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: colors.mutedForeground + '66', fontSize: 14 }}><CloseIcon size={14} color={colors.mutedForeground + '66'} /></Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
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
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ArrowBackIcon size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[Typography.h2, { color: colors.text, flex: 1 }]}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={[styles.markAllBtn, { backgroundColor: Brand.primary + '14' }]}
            >
              <CheckIcon size={14} color={Brand.primary} />
              <Text style={{ color: Brand.primary, fontSize: 12, fontWeight: '600' }}>Tout lire</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'unread'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                filter === tab
                  ? { backgroundColor: Brand.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: filter === tab ? '#fff' : colors.mutedForeground,
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                {tab === 'all' ? 'Tout' : 'Non lues'}
              </Text>
              {tab === 'unread' && unreadCount > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: filter === 'unread' ? 'rgba(255,255,255,0.2)' : Brand.primary,
                    },
                  ]}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {filteredNotifications.length > 0 ? (
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
                {group.data.map(renderNotification)}
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: Brand.primary + '14' }]}>
            <BellIcon size={36} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {filter === 'unread' ? 'Tout est lu !' : 'Vous êtes à jour !'}
          </Text>
          {filter === 'unread' && (
            <TouchableOpacity onPress={() => setFilter('all')} style={{ marginTop: Spacing.base }}>
              <Text style={{ color: Brand.primary, fontWeight: '600', fontSize: 14 }}>
                Voir toutes les notifications
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.base },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.base },
  backBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
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
  notifCard: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  notifTitle: { fontSize: 14, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  notifMessage: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  notifTime: { fontSize: 12 },
  dismissBtn: { padding: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyDesc: { fontSize: 14 },
});
