import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { Badge } from '../components/common/StyledComponents';
import { CurrentAffair } from '../data/mockData';
import { supabase } from '../services/supabase';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📰' },
  { key: 'kerala', label: 'Kerala', icon: '🏛️' },
  { key: 'national', label: 'National', icon: '🇮🇳' },
  { key: 'appointments', label: 'Appointments', icon: '👤' },
  { key: 'schemes', label: 'Schemes', icon: '📋' },
  { key: 'awards', label: 'Awards', icon: '🏆' },
];

export function CurrentAffairsScreen() {
  const { t, typography: tx } = useTranslation();
  const [dbAffairs, setDbAffairs] = useState<CurrentAffair[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchNews = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!supabase) { setLoading(false); setError('Supabase not configured'); return; }
    supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(50).then(({ data, error: fetchError }) => {
      if (fetchError) {
        console.error('[CA] fetch error:', fetchError.message);
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          summary: r.summary,
          category: r.category,
          date: r.published_at ? r.published_at.split('T')[0] : '',
          source: r.source || '',
          isImportant: false,
          url: r.url || '',
          image_url: r.image_url || '',
        }));
        setDbAffairs(mapped);
      } else {
        setDbAffairs([]);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('[CA] network error:', err);
      setError(err.message || 'Network error');
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const status = dbAffairs === null ? 'loading' : dbAffairs.length === 0 ? 'empty' : 'loaded';
  const allAffairs = status === 'loaded' ? dbAffairs : [];

  const filtered = activeCategory === 'all'
    ? allAffairs
    : allAffairs.filter((ca) => ca.category === activeCategory);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[tx.body, { color: colors.warning, textAlign: 'center', marginBottom: spacing.md }]}>⚠️ {error}</Text>
        <TouchableOpacity onPress={fetchNews} style={styles.retryBtn}>
          <Text style={[tx.bodyBold, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'empty') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📭</Text>
        <Text style={[tx.h3, { color: colors.text, textAlign: 'center' }]}>No news available</Text>
        <Text style={[tx.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }]}>
          Current affairs will appear here once fetched. The cron job runs every 6 hours.
        </Text>
        <TouchableOpacity onPress={fetchNews} style={styles.retryBtn}>
          <Text style={[tx.bodyBold, { color: colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[tx.h2, { color: colors.text, paddingTop: spacing.lg }]}>{t('currentAffairs.title')}</Text>
      <Text style={[tx.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{t('currentAffairs.subtitle')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catChip, activeCategory === cat.key && styles.catChipActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
            <Text style={[tx.caption, { color: activeCategory === cat.key ? colors.primary : colors.textSecondary, marginLeft: spacing.xs }]}>
              {t(`currentAffairs.category${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.newsCard, item.isImportant && styles.importantCard]}>
            <View style={styles.newsHeader}>
              <Badge label={item.category} color={
                item.category === 'kerala' ? colors.accentGreen :
                item.category === 'national' ? colors.info :
                item.category === 'appointments' ? colors.primary :
                item.category === 'schemes' ? colors.warning : colors.accentTeal
              } />
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                {item.isImportant && <Text style={{ color: colors.warning }}>⭐</Text>}
                <Text style={[tx.small, { color: colors.textMuted }]}>{item.date}</Text>
              </View>
            </View>
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.newsImage} resizeMode="cover" />
            )}
            <Text style={[tx.bodyBold, { color: colors.text, marginTop: spacing.sm }]}>{item.title}</Text>
            <Text style={[tx.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{item.summary}</Text>
            <Text style={[tx.small, { color: colors.textMuted, marginTop: spacing.sm }]}>{t('currentAffairs.source', { source: item.source })}</Text>

            <View style={styles.newsActions}>
              <TouchableOpacity style={styles.actionChip}>
                <Text style={[tx.small, { color: colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  catRow: { marginTop: spacing.lg, marginBottom: spacing.md },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  newsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  importantCard: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  newsImage: { width: '100%', height: 180, borderRadius: borderRadius.md, marginTop: spacing.sm },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary + '10',
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
