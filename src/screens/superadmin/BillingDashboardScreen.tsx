import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchSubscriptionStats, fetchAllSubscriptions, updateSubscriptionStatus, extendTrial, SubscriptionRecord } from '../../services/adminDataService';
import { supabase } from '../../services/supabase';

export function BillingDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, trialing: 0, active: 0, expired: 0, canceled: 0, pastDue: 0, estimatedMonthlyRevenue: 0 });
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [st, subs] = await Promise.all([
      fetchSubscriptionStats(),
      fetchAllSubscriptions(),
    ]);
    setStats(st);
    setSubscriptions(subs);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Compute extended metrics
  const churnRate = stats.total > 0 ? ((stats.expired + stats.canceled) / stats.total * 100).toFixed(1) : '0.0';
  const conversionRate = (stats.trialing + stats.active) > 0
    ? (stats.active / (stats.trialing + stats.active) * 100).toFixed(1)
    : '0.0';
  const activePct = stats.total > 0 ? (stats.active / stats.total * 100).toFixed(1) : '0.0';
  const projectedARR = stats.estimatedMonthlyRevenue * 12;
  const annualProjection = [
    { year: 'Year 1', revenue: stats.estimatedMonthlyRevenue * 12, users: Math.round(stats.total * 1.5) },
    { year: 'Year 2', revenue: stats.estimatedMonthlyRevenue * 12 * 3, users: Math.round(stats.total * 4) },
    { year: 'Year 3', revenue: stats.estimatedMonthlyRevenue * 12 * 8, users: Math.round(stats.total * 10) },
  ];

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
      {/* Revenue KPIs */}
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Revenue Overview</Text>
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderLeftColor: '#22C55E' }]}>
          <Text style={[typography.h2, { color: '#22C55E' }]}>₹{stats.estimatedMonthlyRevenue.toLocaleString()}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Monthly Recurring Revenue</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
          <Text style={[typography.h2, { color: '#2563EB' }]}>₹{projectedARR.toLocaleString()}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Projected ARR</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#8B5CF6' }]}>
          <Text style={[typography.h2, { color: '#8B5CF6' }]}>{stats.active}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Paying Users</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={[typography.h2, { color: '#F59E0B' }]}>{conversionRate}%</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Trial→Paid Conversion</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#EC4899' }]}>
          <Text style={[typography.h2, { color: '#EC4899' }]}>{churnRate}%</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Churn Rate</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#06B6D4' }]}>
          <Text style={[typography.h2, { color: '#06B6D4' }]}>{activePct}%</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Active % of Total</Text>
        </View>
      </View>

      {/* Revenue Projection */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Revenue Projection</Text>
        {annualProjection.map((proj) => (
          <View key={proj.year} style={styles.projRow}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>{proj.year}</Text>
            <Text style={[typography.body, { color: '#22C55E', fontWeight: '700' }]}>
              ₹{proj.revenue.toLocaleString()}
            </Text>
            <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
              {proj.users} users
            </Text>
          </View>
        ))}
      </View>

      {/* Subscription breakdown */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Subscription Breakdown</Text>
        <View style={styles.breakdownRow}>
          <BreakdownBar label="Trial" count={stats.trialing} total={stats.total} color="#2563EB" />
          <BreakdownBar label="Active Paid" count={stats.active} total={stats.total} color="#22C55E" />
          <BreakdownBar label="Past Due" count={stats.pastDue} total={stats.total} color="#F59E0B" />
          <BreakdownBar label="Expired" count={stats.expired} total={stats.total} color="#6B7280" />
          <BreakdownBar label="Canceled" count={stats.canceled} total={stats.total} color="#DC2626" />
        </View>
      </View>

      {/* All subscriptions (compact) */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>All Subscriptions</Text>
        {subscriptions.length === 0 && (
          <Text style={[typography.body, { color: colors.textMuted }]}>No subscriptions yet</Text>
        )}
        {subscriptions.map((sub) => (
          <View key={sub.user_id} style={styles.subCard}>
            <View style={styles.subHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                  {sub.user_name || sub.user_email || sub.user_id.slice(0, 8)}
                </Text>
                <Text style={[typography.tiny, { color: colors.textMuted }]}>
                  {sub.plan} · {sub.razorpay_subscription_id ? 'Razorpay' : 'Local'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sub.status) + '20' }]}>
                <Text style={[typography.small, { color: getStatusColor(sub.status), fontWeight: '600' }]}>
                  {sub.status}
                </Text>
              </View>
            </View>
            <View style={styles.subActions}>
              {sub.status === 'trialing' && (
                <>
                  <SuperBtn label="+7d trial" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 7); loadData(); }} />
                  <SuperBtn label="+30d trial" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 30); loadData(); }} />
                  <SuperBtn label="Give Free" color="#22C55E" onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'active'); loadData(); }} />
                  <SuperBtn label="Cancel" color={colors.error} onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'canceled'); loadData(); }} />
                </>
              )}
              {sub.status === 'active' && (
                <>
                  <SuperBtn label="+30d period" color={colors.primary} onPress={async () => { await extendTrial(sub.user_id, 30); loadData(); }} />
                  <SuperBtn label="Cancel" color={colors.error} onPress={async () => { await updateSubscriptionStatus(sub.user_id, 'canceled'); loadData(); }} />
                </>
              )}
              {(sub.status === 'expired' || sub.status === 'canceled' || sub.status === 'past_due' || sub.status === 'incomplete') && (
                <>
                  <SuperBtn label="Reset Trial" color={colors.primary} onPress={async () => { await resetUserSub(sub.user_id, 'trialing'); loadData(); }} />
                  <SuperBtn label="Give Free" color="#22C55E" onPress={async () => { await resetUserSub(sub.user_id, 'active'); loadData(); }} />
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

function BreakdownBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total * 100) : 0;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[typography.small, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.small, { color: colors.textSecondary }]}>{count} ({pct.toFixed(0)}%)</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.bgCard2, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    trialing: '#2563EB',
    active: '#22C55E',
    expired: '#6B7280',
    canceled: '#DC2626',
    past_due: '#F59E0B',
    incomplete: '#9CA3AF',
  };
  return map[status] || '#9CA3AF';
}

async function resetUserSub(userId: string, status: 'trialing' | 'active') {
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

function SuperBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.pillBtn, { borderColor: color + '40' }]} onPress={onPress}>
      <Text style={[typography.small, { color, fontWeight: '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  kpiCard: {
    width: '48%', backgroundColor: colors.bgCard, borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  section: {
    backgroundColor: colors.bgCard, borderRadius: 14, padding: spacing.xl,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  projRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  breakdownRow: { gap: 4 },
  subCard: {
    backgroundColor: colors.bgCard2, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  statusBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10,
  },
  subActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pillBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard,
  },
});
