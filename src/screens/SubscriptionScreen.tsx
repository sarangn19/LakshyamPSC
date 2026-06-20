import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { colors, spacing } from '../theme';
import { typography } from '../theme/typography';
import { useSubscriptionStore, hasPremiumAccess, getTrialDaysRemaining } from '../store/subscriptionStore';

export function SubscriptionScreen({ navigation }: any) {
  const { status, plan, trialEnd, currentPeriodEnd, isLoading, initialize, subscribe, checkStatus } = useSubscriptionStore();

  useEffect(() => {
    initialize();
  }, []);

  const isPremium = hasPremiumAccess(status);
  const daysLeft = getTrialDaysRemaining(trialEnd);
  const isTrialing = status === 'trialing';

  const handleSubscribe = async () => {
    const result = await subscribe() as any;
    if (result?.url && typeof result.url === 'string') {
      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        Linking.openURL(result.url);
      }
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current plan banner */}
      <View style={[styles.banner, isPremium ? styles.bannerActive : styles.bannerExpired]}>
        <Text style={styles.bannerEmoji}>{isPremium ? '⭐' : '🔒'}</Text>
        <Text style={styles.bannerTitle}>
          {isTrialing ? 'Free Trial' : isPremium ? 'Premium Active' : 'Premium Expired'}
        </Text>
        <Text style={styles.bannerSubtitle}>
          {isTrialing
            ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
            : isPremium
              ? `Renews ${formatDate(currentPeriodEnd)}`
              : 'Subscribe to continue using premium features'}
        </Text>
      </View>

      {/* Features comparison */}
      <View style={styles.section}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Plan Comparison</Text>

        <View style={styles.planRow}>
          <View style={[styles.planCard, isPremium && styles.planCardDimmed]}>
            <Text style={[typography.h4, { color: colors.text }]}>Free</Text>
            <Text style={[typography.h2, { color: colors.textMuted, marginVertical: spacing.sm }]}>₹0</Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginBottom: spacing.sm }]}>Limited access</Text>
            <View style={styles.featureList}>
              <FeatureItem text="AI-generated questions" included={isTrialing || !isPremium} dimmed={isPremium} />
              <FeatureItem text="Basic analytics" included={isTrialing || !isPremium} dimmed={isPremium} />
              <FeatureItem text="Daily current affairs" included={true} />
              <FeatureItem text="Offline question bank" included={false} />
              <FeatureItem text="Priority AI generation" included={false} />
              <FeatureItem text="Ad-free experience" included={false} />
              <FeatureItem text="Detailed analytics" included={false} />
            </View>
          </View>

          <View style={[styles.planCard, styles.planCardHighlighted]}>
            <Text style={[typography.h4, { color: colors.primary }]}>Premium</Text>
            <Text style={[typography.h2, { color: colors.text, marginVertical: spacing.sm }]}>₹199</Text>
            <Text style={[typography.tiny, { color: colors.textMuted, marginBottom: spacing.sm }]}>per month</Text>
            <View style={styles.featureList}>
              <FeatureItem text="AI-generated questions" included={true} />
              <FeatureItem text="Basic analytics" included={true} />
              <FeatureItem text="Daily current affairs" included={true} />
              <FeatureItem text="Offline question bank" included={true} />
              <FeatureItem text="Priority AI generation" included={true} />
              <FeatureItem text="Ad-free experience" included={true} />
              <FeatureItem text="Detailed analytics" included={true} />
            </View>
          </View>
        </View>
      </View>

      {/* Subscribe / Manage button */}
      {!isPremium && (
        <TouchableOpacity
          style={[styles.subscribeBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleSubscribe}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeBtnText}>
            {isLoading ? 'Processing...' : status === 'incomplete' ? 'Complete Payment' : 'Subscribe Now — ₹199/mo'}
          </Text>
        </TouchableOpacity>
      )}

      {isPremium && (
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => {
            // Open Razorpay customer portal or show manage options
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.manageBtnText}>Manage Subscription</Text>
        </TouchableOpacity>
      )}

      {/* Terms note */}
      <Text style={[typography.tiny, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg }]}>
        Cancel anytime. First month is on us — no charges until your trial ends.
      </Text>
    </ScrollView>
  );
}

function FeatureItem({ text, included, dimmed }: { text: string; included: boolean; dimmed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 12, color: included ? '#22C55E' : colors.textMuted }}>
        {included ? '✓' : '—'}
      </Text>
      <Text style={[typography.tiny, { color: dimmed ? colors.textMuted : colors.text, textDecorationLine: dimmed ? 'line-through' : 'none' }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  banner: {
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bannerActive: { backgroundColor: '#2563EB15' },
  bannerExpired: { backgroundColor: '#EF444415' },
  bannerEmoji: { fontSize: 32, marginBottom: 8 },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  bannerSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: spacing.lg },
  planRow: { flexDirection: 'row', gap: spacing.sm },
  planCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCardDimmed: { opacity: 0.6 },
  planCardHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  featureList: { marginTop: spacing.xs },
  subscribeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subscribeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  manageBtn: {
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});
