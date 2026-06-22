import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily } from '../theme';
import { reliabilityTracker, MetricsSnapshot } from '../services/reliabilityTracker';
import { questionCache } from '../services/questionCache';
import { generationQueue } from '../services/generationQueue';
import { useTranslation } from '../i18n/useTranslation';

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </View>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, pct * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ReliabilityDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [queueLen, setQueueLen] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refresh = useCallback(async () => {
    const m = reliabilityTracker.getMetrics();
    const cs = questionCache.size();
    const ql = generationQueue.pending;
    m.cacheSize = cs;
    m.queueLength = ql;
    setMetrics(m);
    setCacheSize(cs);
    setQueueLen(ql);
  }, []);

  useEffect(() => {
    refresh();
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleReset = () => {
    reliabilityTracker.resetWindow();
    refresh();
  };

  const handleClearCache = async () => {
    await questionCache.clear();
    refresh();
  };

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading metrics...</Text>
      </View>
    );
  }

  const providerKeys = Object.keys(metrics.providerFailures);
  const totalProviderFailures = providerKeys.reduce((s, k) => s + metrics.providerFailures[k], 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.317308)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBar}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reliability Dashboard</Text>
        <TouchableOpacity onPress={() => setAutoRefresh(!autoRefresh)} activeOpacity={0.7}>
          <Text style={styles.autoRefresh}>{autoRefresh ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={refresh} activeOpacity={0.7}>
            <Text style={styles.controlBtnText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.controlBtnDanger]} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.controlBtnText}>Reset Window</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.controlBtnDanger]} onPress={handleClearCache} activeOpacity={0.7}>
            <Text style={styles.controlBtnText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Volume</Text>
        <View style={styles.grid}>
          <MetricCard label="Total Requests" value={String(metrics.totalRequests)} />
          <MetricCard label="Successful" value={String(metrics.successfulRequests)} />
          <MetricCard label="Failed" value={String(metrics.failedRequests)} />
          <MetricCard label="Success Rate" value={`${(metrics.successRate * 100).toFixed(1)}%`} />
        </View>

        <Text style={styles.sectionTitle}>Latency</Text>
        <View style={styles.grid}>
          <MetricCard label="Average" value={`${metrics.avgLatencyMs}ms`} />
          <MetricCard label="Median (P50)" value={`${metrics.medianLatencyMs}ms`} />
          <MetricCard label="P95" value={`${metrics.p95LatencyMs}ms`} />
          <MetricCard label="P99" value={`${metrics.p99LatencyMs}ms`} />
        </View>

        <Text style={styles.sectionTitle}>Cache</Text>
        <View style={styles.grid}>
          <MetricCard label="Cache Size" value={String(cacheSize)} />
          <MetricCard label="Cache Hits" value={String(metrics.cacheHits)} />
          <MetricCard label="Cache Misses" value={String(metrics.cacheMisses)} />
          <MetricCard label="Hit Rate" value={`${(metrics.cacheHitRate * 100).toFixed(1)}%`} />
        </View>
        <Bar pct={metrics.cacheHitRate} color={colors.success} />

        <Text style={styles.sectionTitle}>Rate Limits & Fallbacks</Text>
        <View style={styles.grid}>
          <MetricCard label="429 Count" value={String(metrics.rateLimitCount)} />
          <MetricCard label="Fallback Count" value={String(metrics.fallbackCount)} />
          <MetricCard label="Queue Length" value={String(queueLen)} />
        </View>

        {providerKeys.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Provider Failures</Text>
            {providerKeys.map((k) => (
              <MetricCard key={k} label={k} value={String(metrics.providerFailures[k])} />
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Time Window</Text>
        <View style={styles.grid}>
          <MetricCard label="Window Start" value={new Date(metrics.windowStart).toLocaleTimeString()} />
          <MetricCard label="Window End" value={new Date(metrics.windowEnd).toLocaleTimeString()} />
          <MetricCard label="Duration" value={`${Math.round((metrics.windowEnd - metrics.windowStart) / 60000)}m`} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: 'center', marginTop: 100, fontSize: 15, color: colors.textSecondary, fontFamily: fontFamily.body },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12, backgroundColor: colors.background,
  },
  backLink: { fontSize: 13, fontWeight: '600', color: colors.primary, fontFamily: fontFamily.bodyMedium },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodyBold },
  autoRefresh: { fontSize: 12, fontWeight: '700', color: colors.textTertiary, fontFamily: fontFamily.bodyBold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  controls: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  controlBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  controlBtnDanger: { backgroundColor: colors.error },
  controlBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: fontFamily.bodyMedium },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodyBold, marginTop: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, minWidth: '47%', flex: 1, borderWidth: 1, borderColor: colors.border },
  cardLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, fontFamily: fontFamily.bodyMedium, textTransform: 'uppercase' },
  cardValue: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: fontFamily.bodyBold, marginTop: 4 },
  cardSub: { fontSize: 11, color: colors.textSecondary, fontFamily: fontFamily.body, marginTop: 2 },
  barBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});
