import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchAllSubscriptions, fetchSubscriptionStats, updateSubscriptionStatus, extendTrial, SubscriptionRecord } from '../../services/adminDataService';
import { supabase } from '../../services/supabase';

export function SubscriptionManagementScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, trialing: 0, active: 0, expired: 0, canceled: 0, pastDue: 0, estimatedMonthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const loadData = async () => {
    const [subs, st] = await Promise.all([
      fetchAllSubscriptions(),
      fetchSubscriptionStats(),
    ]);
    setSubscriptions(subs);
    setStats(st);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filteredSubs = filter === 'all'
    ? subscriptions
    : subscriptions.filter((s) => s.status === filter);

  const statusColors: Record<string, string> = {
    trialing: '#2563EB',
    active: '#22C55E',
    expired: '#6B7280',
    canceled: '#DC2626',
    past_due: '#F59E0B',
    incomplete: '#9CA3AF',
  };

  const statusLabels: Record<string, string> = {
    all: 'All',
    trialing: 'Trial',
    active: 'Active',
    expired: 'Expired',
    canceled: 'Canceled',
    past_due: 'Past Due',
    incomplete: 'Incomplete',
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
          <Text style={[typography.h3, { color: '#2563EB' }]}>{stats.trialing}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Trial</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#22C55E' }]}>
          <Text style={[typography.h3, { color: '#22C55E' }]}>{stats.active}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={[typography.h3, { color: '#F59E0B' }]}>{stats.pastDue}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Past Due</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#22C55E' }]}>
          <Text style={[typography.h3, { color: '#22C55E' }]}>₹{stats.estimatedMonthlyRevenue}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Est. MRR</Text>
        </View>
      </View>

      {/* Summary chips */}
      <View style={styles.summaryRow}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {stats.total} total · {stats.active} paid · {stats.expired} expired
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['all', 'trialing', 'active', 'past_due', 'expired', 'canceled', 'incomplete'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[typography.small, { color: filter === f ? '#fff' : colors.text }, filter === f && { fontWeight: '700' }]}>
              {statusLabels[f] || f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subscription list */}
      <View style={styles.list}>
        {filteredSubs.length === 0 && (
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', paddingVertical: 40 }]}>
            No subscriptions found
          </Text>
        )}
        {filteredSubs.map((sub) => (
          <View key={sub.user_id} style={styles.subCard}>
            <View style={styles.subHeader}>
              <View style={styles.subInfo}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                  {sub.user_name || sub.user_email || sub.user_id.slice(0, 8)}
                </Text>
                <Text style={[typography.tiny, { color: colors.textMuted, marginTop: 2 }]}>
                  {sub.plan} · {sub.razorpay_subscription_id ? 'Razorpay' : 'Local'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (statusColors[sub.status] || '#9CA3AF') + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColors[sub.status] || '#9CA3AF' }]} />
                <Text style={[typography.tiny, { color: statusColors[sub.status] || '#9CA3AF', fontWeight: '600' }]}>
                  {sub.status}
                </Text>
              </View>
            </View>

            <View style={styles.subDates}>
              {sub.trial_end && (
                <Text style={[typography.small, { color: colors.textSecondary }]}>
                  Trial ends: {new Date(sub.trial_end).toLocaleDateString()}
                </Text>
              )}
              {sub.current_period_end && (
                <Text style={[typography.small, { color: colors.textSecondary }]}>
                  Period ends: {new Date(sub.current_period_end).toLocaleDateString()}
                </Text>
              )}
            </View>

            <View style={styles.subActions}>
              {/* Trialing actions: extend, activate, cancel */}
              {sub.status === 'trialing' && (
                <>
                  <ActionBtn label="+7d trial" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 7); loadData(); }} />
                  <ActionBtn label="+14d trial" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 14); loadData(); }} />
                  <ActionBtn label="+30d trial" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 30); loadData(); }} />
                  <ActionBtn label="Give Free" color="#22C55E" onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'active'); loadData(); }} />
                  <ActionBtn label="Cancel" color={colors.error} onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'canceled'); loadData(); }} />
                </>
              )}

              {/* Active: cancel, extend period */}
              {sub.status === 'active' && (
                <>
                  <ActionBtn label="+30d period" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 30); loadData(); }} />
                  <ActionBtn label="Cancel" color={colors.error} onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'canceled'); loadData(); }} />
                </>
              )}

              {/* Expired / Canceled / Past due: reset trial or give free */}
              {(sub.status === 'expired' || sub.status === 'canceled' || sub.status === 'past_due' || sub.status === 'incomplete') && (
                <>
                  <ActionBtn label="Reset Trial" color={colors.primary} onPress={async () => {
                    await resetUserSubscription(sub.user_id, 'trialing');
                    loadData();
                  }} />
                  <ActionBtn label="Give Free" color="#22C55E" onPress={async () => {
                    await resetUserSubscription(sub.user_id, 'active');
                    loadData();
                  }} />
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

async function resetUserSubscription(userId: string, status: 'trialing' | 'active') {
  if (!supabase) return;
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 86400000);
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    status,
    plan: 'premium',
    trial_start: now.toISOString(),
    trial_end: trialEnd.toISOString(),
    current_period_start: status === 'active' ? now.toISOString() : null,
    current_period_end: status === 'active' ? trialEnd.toISOString() : null,
    razorpay_subscription_id: null,
    razorpay_payment_id: null,
    cancel_at_period_end: false,
  }, { onConflict: 'user_id' });
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: color + '40' }]} onPress={onPress}>
      <Text style={[typography.small, { color, fontWeight: '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  summaryRow: { marginBottom: spacing.md },
  filterRow: { marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20,
    backgroundColor: colors.bgCard, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border,
  },
  list: { gap: spacing.sm },
  subCard: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subInfo: { flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  subDates: { marginTop: spacing.sm, gap: 2 },
  subActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 8, backgroundColor: colors.bgCard2, borderWidth: 1, borderColor: colors.border,
  },
});
