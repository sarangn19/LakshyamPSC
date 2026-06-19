import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useUserStore } from '../store';
import { Badge } from '../components/common/StyledComponents';
import { CurrentAffair, mockCurrentAffairs } from '../data/mockData';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📰' },
  { key: 'kerala', label: 'Kerala', icon: '🏛️' },
  { key: 'national', label: 'National', icon: '🇮🇳' },
  { key: 'appointments', label: 'Appointments', icon: '👤' },
  { key: 'schemes', label: 'Schemes', icon: '📋' },
  { key: 'awards', label: 'Awards', icon: '🏆' },
];

export function CurrentAffairsScreen() {
  const { t } = useTranslation();
  const storeCurrentAffairs = useUserStore((s) => s.currentAffairs);
  const [dbAffairs, setDbAffairs] = useState<CurrentAffair[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    import('../services/supabase').then(({ supabase }) => {
      if (!supabase) { setLoading(false); return; }
      supabase.from('current_affairs').select('*').order('published_at', { ascending: false }).limit(50).then(({ data }) => {
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
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  const allAffairs = dbAffairs ?? (storeCurrentAffairs.length > 0 ? storeCurrentAffairs : mockCurrentAffairs);

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

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, paddingTop: spacing.lg }]}>{t('currentAffairs.title')}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{t('currentAffairs.subtitle')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catChip, activeCategory === cat.key && styles.catChipActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
            <Text style={[typography.caption, { color: activeCategory === cat.key ? colors.primary : colors.textSecondary, marginLeft: spacing.xs }]}>
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
                <Text style={[typography.small, { color: colors.textMuted }]}>{item.date}</Text>
              </View>
            </View>
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.newsImage} resizeMode="cover" />
            )}
            <Text style={[typography.bodyBold, { color: colors.text, marginTop: spacing.sm }]}>{item.title}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{item.summary}</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>{t('currentAffairs.source', { source: item.source })}</Text>

            <View style={styles.newsActions}>
              <TouchableOpacity style={styles.actionChip}>
                <Text style={[typography.small, { color: colors.primary }]}>Save</Text>
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
});
