import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n/useTranslation';
import { fetchCognitiveTwinConfigs, saveCognitiveTwinConfig } from '../../services/adminDataService';

function WeightSlider({ label, value, onIncrease, onDecrease, color }: {
  label: string; value: number; onIncrease: () => void; onDecrease: () => void; color: string;
}) {
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.h3, { color }]}>{value}%</Text>
      </View>
      <View style={sliderStyles.barBg}>
        <View style={[sliderStyles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <View style={sliderStyles.controls}>
        <TouchableOpacity style={sliderStyles.btn} onPress={onDecrease}>
          <Text style={[typography.h4, { color: colors.text }]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sliderStyles.btn} onPress={onIncrease}>
          <Text style={[typography.h4, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  barBg: { height: 12, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  controls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
});

export function CognitiveTwinControlScreen() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>({ weaknessWeight: 25, forgettingWeight: 25, confusionWeight: 25, coverageWeight: 25, version: 1 });

  useEffect(() => {
    fetchCognitiveTwinConfigs().then((data) => {
      setConfigs(data);
      if (data.length > 0) setCurrent(data[0]);
    });
  }, []);

  const updateWeight = (key: string, value: number) => {
    setCurrent((prev: any) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  const handleSave = async () => {
    await saveCognitiveTwinConfig({
      weaknessWeight: current.weaknessWeight,
      forgettingWeight: current.forgettingWeight,
      confusionWeight: current.confusionWeight,
      coverageWeight: current.coverageWeight,
    });
    const data = await fetchCognitiveTwinConfigs();
    setConfigs(data);
    if (data.length > 0) setCurrent(data[0]);
  };

  const weightMeta = [
    { key: 'weaknessWeight', label: t('superadmin.weaknessScore'), desc: t('superadmin.weaknessDesc'), color: colors.error },
    { key: 'forgettingWeight', label: t('superadmin.forgettingScore'), desc: t('superadmin.forgettingDesc'), color: colors.warning },
    { key: 'confusionWeight', label: t('superadmin.confusionScore'), desc: t('superadmin.confusionDesc'), color: colors.info },
    { key: 'coverageWeight', label: t('superadmin.coverageScore'), desc: t('superadmin.coverageDesc'), color: colors.success },
  ];

  const total = current.weaknessWeight + current.forgettingWeight +
    current.confusionWeight + current.coverageWeight;

  return (
    <ScrollView style={styles.container}>
      <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('superadmin.cognitiveTwinTitle')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {t('superadmin.cognitiveTwinSubtitle')}
      </Text>

      <View style={styles.versionRow}>
        <Text style={[typography.small, { color: colors.textSecondary }]}>
           {t('superadmin.configVersion')}: v{current.version}
        </Text>
        <Text style={[
          typography.small,
          { color: total === 100 ? colors.success : colors.error },
        ]}>
          {t('superadmin.totalWeight')}: {total}% {total !== 100 ? `(${t('superadmin.mustSum100')})` : '✓'}
        </Text>
      </View>

      <View style={styles.card}>
        {weightMeta.map((w) => (
          <WeightSlider
            key={w.key}
            label={w.label}
            value={current[w.key]}
            color={w.color}
            onIncrease={() => updateWeight(w.key, current[w.key] + 5)}
            onDecrease={() => updateWeight(w.key, current[w.key] - 5)}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.whatEachControls')}
        </Text>
        {weightMeta.map((w) => (
          <View key={w.key} style={styles.descRow}>
            <View style={[styles.descDot, { backgroundColor: w.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.text }]}>{w.label}</Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{w.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
          {t('superadmin.versionHistory')}
        </Text>
        {configs.slice(1).map((cfg) => (
          <View key={cfg.id} style={styles.versionRow2}>
            <Text style={[typography.body, { color: colors.text }]}>
              v{cfg.version}: W={cfg.weaknessWeight} F={cfg.forgettingWeight} C={cfg.confusionWeight} Cov={cfg.coverageWeight}
            </Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {cfg.createdAt ? cfg.createdAt.slice(0, 10) : ''}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={[typography.bodyBold, { color: '#fff' }]}>
          {t('superadmin.saveConfig')}
        </Text>
      </TouchableOpacity>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  descRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  descDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: spacing.sm },
  versionRow2: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center' },
});
