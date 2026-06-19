import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore, GapRecord } from '../store/cognitiveTwinStore';
import { useStudyValidationStore } from '../store/studyValidationStore';
import { useMCQStore } from '../store';
import { printValidationReport } from '../services/adaptiveValidationReport';
import { getNode, getNodePath, getNodesByLevel } from '../data/knowledgeTree';
import { Badge } from '../components/common/StyledComponents';

export function AnalyticsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const metrics = useCognitiveTwinStore((s) => s.getMetrics());
  const gapRecords = useCognitiveTwinStore((s) => s.gapRecords);
  const gapLifecycles = useCognitiveTwinStore((s) => s.gapLifecycles);
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const topImprovingTopics = useCognitiveTwinStore((s) => s.getTopImprovingTopics(5));
  const topImprovingSubtopics = useCognitiveTwinStore((s) => s.getTopImprovingSubtopics(5));
  const mostForgottenSubtopics = useCognitiveTwinStore((s) => s.getMostForgottenSubtopics(5));
  const mostPersistentGaps = useCognitiveTwinStore((s) => s.getMostPersistentGaps(5));
  const retentionMetrics = useCognitiveTwinStore((s) => s.getRetentionMetrics());
  const mostDurableLearning = useCognitiveTwinStore((s) => s.getMostDurableLearning(5));
  const assessmentDashboard = useCognitiveTwinStore((s) => s.getAssessmentDashboard());
  const dueAssessments = useCognitiveTwinStore((s) => s.getDueAssessments());
  const studyEnabled = useStudyValidationStore((s) => s.enabled);
  const comparison = useStudyValidationStore((s) => s.getComparison());
  const studyValidations = useStudyValidationStore((s) => s.recommendationValidations);
  const studyStore = useStudyValidationStore.getState();

  const skipAuditSummary = useMCQStore((s) => {
    const records = s.skipAuditRecords;
    const passCount = s.integrityMetrics.passCount;
    const totalGenerated = passCount + records.length;
    const acceptanceRate = totalGenerated > 0 ? Math.round((passCount / totalGenerated) * 100) : 0;
    const byReason: Record<string, number> = {};
    for (const r of records) { byReason[r.rejectionCategory] = (byReason[r.rejectionCategory] || 0) + 1; }
    return { records, totalGenerated, passCount, acceptanceRate, byReason };
  });
  const bottleneck = useMCQStore((s) => s.getBottleneckAnalysis());
  const alignmentRate = useMCQStore((s) => s.getGeneratorAlignmentRate());
  const alignmentMetrics = useMCQStore((s) => s.alignmentMetrics);

  const subjectProgress = useMCQStore((s) => s.subjectProgress);
  const validations = useCognitiveTwinStore((s) => s.validateAdaptiveLearning());
  const healthScoreData = useCognitiveTwinStore((s) => s.getAdaptiveHealthScore());

  const healthScore = healthScoreData.score;
  const healthLabel = healthScoreData.level;

  const stats = useMemo(() => {
    const totalAttempts = Object.values(masteryMap).reduce((sum, m) => sum + m.attempts, 0);
    const totalCorrect = Object.values(masteryMap).reduce((sum, m) => sum + m.correct, 0);
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    return { totalAttempts, totalCorrect, overallAccuracy };
  }, [masteryMap]);

  // Weakest subject from cognitive twin
  const weakestSubjectData = useMemo(() => {
    let weakest = { name: '', mastery: 999 };
    for (const subjNode of getNodesByLevel('subject')) {
      const m = masteryMap[subjNode.id];
      if (m && m.attempts >= 2 && m.masteryScore < weakest.mastery) {
        weakest = { name: subjNode.name, mastery: m.masteryScore };
      }
    }
    return weakest;
  }, [masteryMap]);

  // Weakest topic
  const weakestTopicData = useMemo(() => {
    let weakest = { name: '', mastery: 999, subject: '' };
    for (const topicNode of getNodesByLevel('topic')) {
      const m = masteryMap[topicNode.id];
      if (m && m.attempts >= 2 && m.masteryScore < weakest.mastery) {
        const ancestors = getNodePath(topicNode.id);
        weakest = { name: topicNode.name, mastery: m.masteryScore, subject: ancestors[0] || '' };
      }
    }
    return weakest;
  }, [masteryMap]);

  // Weakest subtopic
  const weakestSubtopicData = useMemo(() => {
    let weakest = { name: '', mastery: 999, topic: '', subject: '' };
    for (const stNode of getNodesByLevel('subtopic')) {
      const m = masteryMap[stNode.id];
      if (m && m.attempts >= 2 && m.masteryScore < weakest.mastery) {
        const path = getNodePath(stNode.id);
        weakest = {
          name: stNode.name,
          mastery: m.masteryScore,
          topic: path[1] || '',
          subject: path[0] || '',
        };
      }
    }
    return weakest;
  }, [masteryMap]);

  const renderMetricCard = (label: string, value: string | number, color: string = colors.primary) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const renderGapCard = (gap: GapRecord) => {
    const node = getNode(gap.nodeId);
    const statusColor = gap.status === 'closed' ? colors.success
      : gap.status === 'improving' ? colors.info
      : gap.status === 'closing' ? colors.warning
      : colors.error;
    const statusLabel = gap.status === 'closed' ? 'Closed'
      : gap.status === 'improving' ? 'Improving'
      : gap.status === 'closing' ? 'Closing'
      : 'Open';
    return (
      <View key={gap.gapId} style={styles.gapRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '600' }]}>
            {node?.name || gap.nodeId}
          </Text>
          <Text style={[typography.tiny, { color: colors.textSecondary, marginTop: 2 }]}>
            {gap.level} | Initial: {gap.initialMastery}% | Current: {gap.currentMastery}%
          </Text>
        </View>
        <Badge label={statusLabel} color={statusColor} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Learning Health */}
      <Text style={[typography.displayL, { color: colors.text }]}>Learning Health</Text>

      <View style={styles.healthCard}>
        <View style={styles.healthScoreArea}>
          <View style={styles.healthScoreRing}>
            <Text style={styles.healthScoreValue}>{Math.round(healthScore)}</Text>
            <Text style={styles.healthScoreUnit}>%</Text>
          </View>
          <Text style={styles.healthScoreLabel}>{healthLabel}</Text>
        </View>

        <View style={styles.healthDivider} />

        <View style={styles.healthDetails}>
          <View style={styles.healthDetail}>
            <Text style={styles.healthDetailValue}>{stats.totalAttempts}</Text>
            <Text style={styles.healthDetailLabel}>Questions</Text>
          </View>
          <View style={styles.healthDetail}>
            <Text style={styles.healthDetailValue}>{stats.overallAccuracy}%</Text>
            <Text style={styles.healthDetailLabel}>Accuracy</Text>
          </View>
          <View style={styles.healthDetail}>
            <Text style={styles.healthDetailValue}>{gapRecords.length}</Text>
            <Text style={styles.healthDetailLabel}>Gaps Found</Text>
          </View>
        </View>
      </View>

      {/* Part 12: Weak Subject / Topic / Subtopic */}
      {weakestSubjectData.name && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Weak Subject</Text>
          <Text style={[styles.insightValue, { color: colors.error }]}>{weakestSubjectData.name}</Text>
          <Text style={styles.insightDesc}>Mastery: {weakestSubjectData.mastery}%</Text>
        </View>
      )}

      {weakestTopicData.name && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Weak Topic</Text>
          <Text style={[styles.insightValue, { color: colors.error }]}>{weakestTopicData.name}</Text>
          <Text style={styles.insightDesc}>
            Subject: {weakestTopicData.subject} | Mastery: {weakestTopicData.mastery}%
          </Text>
          <TouchableOpacity
            style={styles.suggestionCTA}
            onPress={() => {
              useMCQStore.getState().startOrchestratedSession({
                subjects: [weakestTopicData.subject],
                difficulty: 'medium',
                sessionType: 'weakness_practice',
              });
              navigation.navigate('MCQ');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.suggestionCTAText}>Practice {weakestTopicData.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {weakestSubtopicData.name && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Weak Subtopic</Text>
          <Text style={[styles.insightValue, { color: colors.error }]}>{weakestSubtopicData.name}</Text>
          <Text style={styles.insightDesc}>
            Topic: {weakestSubtopicData.topic} | Subject: {weakestSubtopicData.subject} | Mastery: {weakestSubtopicData.mastery}%
          </Text>
          <TouchableOpacity
            style={styles.suggestionCTA}
            onPress={() => {
              useMCQStore.getState().startOrchestratedSession({
                subjects: [weakestSubtopicData.subject],
                difficulty: 'medium',
                sessionType: 'weakness_practice',
              });
              navigation.navigate('MCQ');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.suggestionCTAText}>Practice {weakestSubtopicData.name}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Part 9: Adaptive Learning Effectiveness */}
      <Text style={[styles.sectionTitle]}>Adaptive Learning Effectiveness</Text>

      <View style={styles.metricsGrid}>
        {renderMetricCard('Open Gaps', metrics.openGaps, colors.error)}
        {renderMetricCard('Closing Gaps', metrics.closingGaps, colors.warning)}
        {renderMetricCard('Closed Gaps', metrics.closedGaps, colors.success)}
        {renderMetricCard('Gap Closure Rate', `${metrics.gapClosureRate}%`, colors.primary)}
        {renderMetricCard('Avg Accuracy Gain', `+${metrics.averageAccuracyGain}%`, colors.success)}
        {renderMetricCard('Avg Days to Close', metrics.averageDaysToClose, colors.info)}
        {renderMetricCard('Avg Sessions to Close', metrics.averageSessionsToClose, colors.info)}
        {renderMetricCard('Rec Success Rate', `${metrics.recommendationSuccessRate}%`, colors.success)}
      </View>

      {/* Part 8: Cognitive Twin Validation — per-subtopic before/after */}
      {validations.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cognitive Twin Validation</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Proving adaptive learning improves learner mastery at the subtopic level.
          </Text>
          {validations.slice(0, 10).map((v, i) => {
            const statusColor = v.status === 'closed' ? colors.success
              : v.status === 'closing' ? colors.warning
              : v.status === 'improving' ? colors.info
              : colors.error;
            return (
              <View key={i} style={styles.validationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '600' }]}>
                    {v.nodeName}
                  </Text>
                  <Text style={[typography.tiny, { color: colors.textSecondary, marginTop: 2 }]}>
                    Detected: {v.initialMastery}% → Current: {v.currentMastery}%
                    {'  '}|  Gain: <Text style={{ color: v.gain >= 0 ? colors.success : colors.error, fontWeight: '700' }}>
                      {v.gain >= 0 ? '+' : ''}{v.gain}%
                    </Text>
                    {v.daysToClose !== null && `  |  Closed: ${v.daysToClose}d`}
                  </Text>
                </View>
                <Badge
                  label={v.status === 'closed' ? 'Closed'
                    : v.status === 'closing' ? 'Closing'
                    : v.status === 'improving' ? 'Improving'
                    : 'Open'}
                  color={statusColor}
                />
              </View>
            );
          })}
          <View style={[styles.outcomeCard, { marginTop: spacing.md }]}>
            <Text style={styles.outcomeTitle}>Is adaptive learning working?</Text>
            {metrics.closedGaps > 0 ? (
              <>
                <Text style={styles.outcomePositive}>
                  Yes — {metrics.closedGaps} gaps closed
                </Text>
                <Text style={styles.outcomeDetail}>
                  {metrics.gapClosureRate}% closure rate | +{metrics.averageAccuracyGain}% avg gain
                  {'  '}| {metrics.averageDaysToClose}d avg to close | {metrics.averageSessionsToClose} sessions avg
                </Text>
              </>
            ) : metrics.openGaps > 0 ? (
              <>
                <Text style={styles.outcomePending}>Tracking in progress</Text>
                <Text style={styles.outcomeDetail}>
                  {metrics.openGaps} open gaps. Continue practicing to see closure metrics.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.outcomePending}>Start practicing to find out</Text>
                <Text style={styles.outcomeDetail}>
                  Answer questions to build your knowledge profile and detect gaps.
                </Text>
              </>
            )}
          </View>
          {validations.length > 10 && (
            <Text style={[typography.tiny, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm }]}>
              Showing 10 of {validations.length} subtopics
            </Text>
          )}
        </View>
      )}

      {/* Part 9: Top Improving Topics */}
      {topImprovingTopics.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Top Improving Topics</Text>
          {topImprovingTopics.map((item) => (
            <View key={item.nodeId} style={styles.improvingRow}>
              <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{item.name}</Text>
              <Badge label={`+${item.gain}%`} color={colors.success} />
            </View>
          ))}
        </View>
      )}

      {/* Part 9: Top Improving Subtopics */}
      {topImprovingSubtopics.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Top Improving Subtopics</Text>
          {topImprovingSubtopics.map((item) => (
            <View key={item.nodeId} style={styles.improvingRow}>
              <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{item.name}</Text>
              <Badge label={`+${item.gain}%`} color={colors.success} />
            </View>
          ))}
        </View>
      )}

      {/* Part 9: Most Forgotten Subtopics */}
      {mostForgottenSubtopics.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Most Forgotten Subtopics</Text>
          {mostForgottenSubtopics.map((item) => (
            <View key={item.nodeId} style={styles.improvingRow}>
              <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{item.name}</Text>
              <Badge label={`${Math.round(item.forgettingScore * 100)}%`} color={colors.error} />
            </View>
          ))}
        </View>
      )}

      {/* Part 9: Most Persistent Gaps */}
      {mostPersistentGaps.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Most Persistent Gaps</Text>
          {mostPersistentGaps.map((gap) => renderGapCard(gap))}
        </View>
      )}

      {/* Retention Health */}
      <Text style={styles.sectionTitle}>Retention Health</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard('Retained', retentionMetrics.retainedGaps, colors.success)}
        {renderMetricCard('At Risk', retentionMetrics.gapsAtRisk, colors.warning)}
        {renderMetricCard('Lost', retentionMetrics.lostGaps, colors.error)}
        {renderMetricCard('Reopened', retentionMetrics.reopenedGaps, '#FF6B35')}
        {renderMetricCard('Avg Retention', `${retentionMetrics.averageRetentionRate}%`, colors.info)}
        {renderMetricCard('7-Day Ret', retentionMetrics.retention7Day > 0 ? `${retentionMetrics.retention7Day}%` : '--', colors.info)}
        {renderMetricCard('30-Day Ret', retentionMetrics.retention30Day > 0 ? `${retentionMetrics.retention30Day}%` : '--', colors.info)}
        {renderMetricCard('90-Day Ret', retentionMetrics.retention90Day > 0 ? `${retentionMetrics.retention90Day}%` : '--', colors.info)}
      </View>

      {/* Retention Assessments Dashboard */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Retention Assessments</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
          {(() => {
            const d = assessmentDashboard;
            const total = d.completedCount + d.dueCount + d.overdueCount;
            return (
              <>
                {renderMetricCard('Total', total, colors.info)}
                {renderMetricCard('Due', d.dueCount, colors.warning)}
                {renderMetricCard('Overdue', d.overdueCount, colors.error)}
                {renderMetricCard('Pass Rate', d.completedCount > 0 ? `${Math.round(d.passRate)}%` : '--', colors.info)}
                {renderMetricCard('Avg Score', d.completedCount > 0 ? `${Math.round(d.averageScore)}%` : '--', colors.info)}
              </>
            );
          })()}
        </View>
        {dueAssessments.length > 0 && (
          <View style={[styles.sectionCard, { marginTop: spacing.sm, backgroundColor: colors.surface }]}>
            <Text style={[typography.bodySmall, { fontWeight: 'bold', color: colors.warning, marginBottom: spacing.xs }]}>
              Due Assessments ({dueAssessments.length})
            </Text>
            {dueAssessments.slice(0, 5).map((a, i) => {
              const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(a.dueAt).getTime()) / 86400000));
              return (
                <View key={i} style={styles.improvingRow}>
                  <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{a.gapId.slice(0, 24)}...</Text>
                  <Badge
                    label={a.checkpoint}
                    color={daysOverdue > 0 ? colors.error : colors.warning}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Most Durable Learning */}
      {mostDurableLearning.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Most Durable Learning</Text>
          {mostDurableLearning.map((item, i) => (
            <View key={i} style={styles.improvingRow}>
              <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>{item.nodeName}</Text>
              <Text style={[typography.tiny, { color: colors.textSecondary, marginRight: spacing.sm }]}>
                {item.daysSinceClosure}d
              </Text>
              <Badge label={`${item.retentionRate}%`} color={colors.success} />
            </View>
          ))}
        </View>
      )}

      {/* Answer the question: Is adaptive learning actually improving learning outcomes? */}
      <View style={styles.outcomeCard}>
        <Text style={styles.outcomeTitle}>Is adaptive learning improving outcomes?</Text>
        <View style={styles.healthScoreArea}>
          <View style={[styles.healthScoreRing, { marginTop: spacing.sm }]}>
            <Text style={[styles.healthScoreValue, {
              color: healthScoreData.level === 'Excellent' ? colors.success
                : healthScoreData.level === 'Good' ? colors.info
                : healthScoreData.level === 'Fair' ? colors.warning
                : colors.error,
            }]}>{healthScoreData.score}</Text>
            <Text style={[styles.healthScoreUnit, { fontSize: 14 }]}>/100</Text>
          </View>
          <Text style={[styles.healthScoreLabel, {
            color: healthScoreData.level === 'Excellent' ? colors.success
              : healthScoreData.level === 'Good' ? colors.info
              : healthScoreData.level === 'Fair' ? colors.warning
              : colors.error,
          }]}>{healthScoreData.level}</Text>
        </View>
        <Text style={[styles.outcomeDetail, { marginTop: spacing.md }]}>
          Health Score: {healthScoreData.gapClosureRate}% closure rate × 0.35
          + {healthScoreData.recommendationSuccessRate}% recommendation success × 0.35
          + {healthScoreData.averageImprovement}% avg improvement × 0.30
        </Text>
        {metrics.closedGaps > 0 ? (
          <>
            <Text style={styles.outcomePositive}>Yes — {metrics.closedGaps} gaps closed</Text>
            <Text style={styles.outcomeDetail}>
              Gap closure rate: {metrics.gapClosureRate}% | Avg gain: +{metrics.averageAccuracyGain}%
              {'  '}| Avg time: {metrics.averageDaysToClose}d | Rec success: {metrics.recommendationSuccessRate}%
            </Text>
          </>
        ) : metrics.openGaps > 0 ? (
          <>
            <Text style={styles.outcomePending}>Tracking in progress</Text>
            <Text style={styles.outcomeDetail}>
              {metrics.openGaps} open gaps detected. Continue practicing to see closure metrics.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.outcomePending}>Start practicing to find out</Text>
            <Text style={styles.outcomeDetail}>
              Answer questions to build your knowledge profile and detect gaps.
            </Text>
          </>
        )}
      </View>

      {/* ─── Adaptive Learning Validation Study ─── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Adaptive Learning Validation Study</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Comparing adaptive recommendations vs random practice to measure whether adaptive learning creates measurable improvement.
        </Text>

        {/* Study Control */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            style={[styles.suggestionCTA, { flex: 1, backgroundColor: studyEnabled ? colors.error : colors.primary }]}
            onPress={() => studyStore[studyEnabled ? 'stopStudy' : 'startStudy']()}
          >
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>
              {studyEnabled ? 'Stop Study' : 'Start Study'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.suggestionCTA, { flex: 1, backgroundColor: colors.error }]}
            onPress={() => studyStore.resetStudy()}
          >
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>Reset Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.bodyBold, { color: studyEnabled ? colors.success : colors.textSecondary, marginBottom: spacing.md }]}>
          Status: {studyEnabled ? 'Running — tracking adaptive vs random sessions' : 'Stopped — enable to begin collecting data'}
        </Text>

        {/* Comparison Dashboard */}
        <Text style={[typography.bodySmall, { fontWeight: '700', marginBottom: spacing.sm }]}>Metrics Comparison</Text>
        <View style={styles.metricsGrid}>
          {[
            { label: 'Accuracy Gain', adaptive: comparison.adaptive.accuracyGain, random: comparison.random.accuracyGain, diff: comparison.accuracyGainDiff, unit: '%' },
            { label: 'Retention Score', adaptive: comparison.adaptive.retentionScore, random: comparison.random.retentionScore, diff: comparison.retentionScoreDiff, unit: '%' },
            { label: 'Gap Closure Rate', adaptive: comparison.adaptive.gapClosureRate, random: comparison.random.gapClosureRate, diff: comparison.gapClosureRateDiff, unit: '%' },
            { label: 'Rec Success Rate', adaptive: comparison.adaptive.recommendationSuccessRate, random: comparison.random.recommendationSuccessRate, diff: comparison.adaptive.recommendationSuccessRate - comparison.random.recommendationSuccessRate, unit: '%' },
            { label: 'False Positive Rate', adaptive: comparison.adaptive.falsePositiveRate, random: comparison.random.falsePositiveRate, diff: comparison.adaptive.falsePositiveRate - comparison.random.falsePositiveRate, unit: '%' },
            { label: 'True Improvement', adaptive: comparison.adaptive.trueImprovementRate, random: comparison.random.trueImprovementRate, diff: comparison.adaptive.trueImprovementRate - comparison.random.trueImprovementRate, unit: '%' },
            { label: 'Mean Time to Close', adaptive: comparison.adaptive.meanTimeToCloseGap, random: comparison.random.meanTimeToCloseGap, diff: comparison.adaptive.meanTimeToCloseGap - comparison.random.meanTimeToCloseGap, unit: 'd' },
            { label: 'Mean Sessions', adaptive: comparison.adaptive.meanSessionsToCloseGap, random: comparison.random.meanSessionsToCloseGap, diff: comparison.adaptive.meanSessionsToCloseGap - comparison.random.meanSessionsToCloseGap, unit: 's' },
          ].map((row, i) => (
            <View key={i} style={[styles.metricCard, { width: '100%', borderLeftColor: row.diff > 0 ? colors.success : row.diff < 0 ? colors.error : colors.textTertiary }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[typography.bodySmall, { fontWeight: '600', flex: 1 }]}>{row.label}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <Badge label={`A:${Math.round(row.adaptive)}${row.unit}`} color={colors.primary} />
                  <Badge label={`R:${Math.round(row.random)}${row.unit}`} color={colors.textSecondary} />
                  <Badge
                    label={`Δ:${row.diff > 0 ? '+' : ''}${Math.round(row.diff)}${row.unit}`}
                    color={row.diff > 0 ? colors.success : row.diff < 0 ? colors.error : colors.textTertiary}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Sessions Stats */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: 12 }}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>{comparison.adaptive.totalSessions}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Adaptive Sessions</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: 12 }}>
            <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>{comparison.random.totalSessions}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Random Sessions</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: 12 }}>
            <Text style={[typography.bodyBold, { color: colors.info }]}>{comparison.adaptive.totalQuestions + comparison.random.totalQuestions}</Text>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Total Questions</Text>
          </View>
        </View>

        {/* Recommendation Validation Table */}
        <Text style={[typography.bodySmall, { fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Recommendation Validation ({studyValidations.length})
        </Text>
        {studyValidations.length === 0 ? (
          <Text style={[typography.bodySmall, { color: colors.textTertiary, fontStyle: 'italic' }]}>
            No recommendations recorded yet. Start with study enabled and practice adaptively.
          </Text>
        ) : (
          <View>
            {/* Summary badges */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Badge label={`${studyValidations.filter(v => v.successful).length} Successful`} color={colors.success} />
              <Badge label={`${studyValidations.filter(v => v.isFalsePositive).length} False Positives`} color={colors.warning} />
              <Badge label={`${studyValidations.filter(v => !v.successful && !v.isFalsePositive).length} Failed`} color={colors.error} />
            </View>
            {/* Top 5 recents */}
            {studyValidations.slice(0, 5).map((v) => (
              <View key={v.id} style={[styles.improvingRow, { borderBottomColor: v.isFalsePositive ? colors.warning : v.successful ? colors.success : colors.error }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodySmall, { fontWeight: '600' }]}>{v.nodeName}</Text>
                  <Text style={[typography.small, { color: colors.textTertiary }]}>
                    Before: {v.beforeMastery}% → After: {v.afterMastery}% | Gain: +{v.gain}%
                  </Text>
                  {v.failureReason && (
                    <Text style={[typography.small, { color: colors.error }]}>{v.failureReason}</Text>
                  )}
                </View>
                <Badge
                  label={v.isFalsePositive ? 'False+' : v.successful ? 'Pass' : 'Fail'}
                  color={v.isFalsePositive ? colors.warning : v.successful ? colors.success : colors.error}
                />
              </View>
            ))}
          </View>
        )}

        {/* False Positive Detection */}
        <Text style={[typography.bodySmall, { fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          False Positive Detection
        </Text>
        <View style={styles.metricsGrid}>
          {[
            { label: 'Recommendation Accuracy', value: `${Math.round(comparison.adaptive.recommendationAccuracy)}%`, color: comparison.adaptive.recommendationAccuracy >= 75 ? colors.success : colors.warning },
            { label: 'Adaptive Learning Effectiveness', value: `+${Math.round(comparison.adaptive.adaptiveLearningEffectiveness)}%`, color: comparison.adaptive.adaptiveLearningEffectiveness > 0 ? colors.success : colors.error },
            { label: 'False Positive Rate', value: `${Math.round(comparison.adaptive.falsePositiveRate)}%`, color: comparison.adaptive.falsePositiveRate < 10 ? colors.success : colors.warning },
            { label: 'True Improvement Rate', value: `${Math.round(comparison.adaptive.trueImprovementRate)}%`, color: comparison.adaptive.trueImprovementRate >= 50 ? colors.success : colors.warning },
          ].map((card, i) => (
            <View key={i} style={[styles.metricCard, { borderLeftColor: card.color }]}>
              <Text style={[styles.metricValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.metricLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Answer the question */}
        <View style={[styles.outcomeCard, { marginTop: spacing.lg }]}>
          <Text style={styles.outcomeTitle}>Would the learner have improved anyway?</Text>
          {comparison.adaptive.totalSessions + comparison.random.totalSessions === 0 ? (
            <Text style={styles.outcomePending}>Collect data first by enabling the study and practicing</Text>
          ) : comparison.accuracyGainDiff > 10 ? (
            <>
              <Text style={styles.outcomePositive}>
                Yes — adaptive learning creates measurable improvement
              </Text>
              <Text style={styles.outcomeDetail}>
                Adaptive group gained {Math.round(comparison.adaptive.accuracyGain)}% vs random group {Math.round(comparison.random.accuracyGain)}%
                (Δ+{Math.round(comparison.accuracyGainDiff)}%)
                {'\n'}Gap closure: {Math.round(comparison.adaptive.gapClosureRate)}% adaptive vs {Math.round(comparison.random.gapClosureRate)}% random
                {'\n'}Retention: {Math.round(comparison.adaptive.retentionScore)}% adaptive vs {Math.round(comparison.random.retentionScore)}% random
              </Text>
            </>
          ) : comparison.accuracyGainDiff > 0 ? (
            <>
              <Text style={styles.outcomePositive}>Slight improvement detected</Text>
              <Text style={styles.outcomeDetail}>
                Adaptive group gained {Math.round(comparison.adaptive.accuracyGain)}% vs random {Math.round(comparison.random.accuracyGain)}%
                (Δ+{Math.round(comparison.accuracyGainDiff)}%)
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.outcomePending}>Inconclusive — difference is {Math.round(comparison.accuracyGainDiff)}%</Text>
              <Text style={styles.outcomeDetail}>
                Adaptive: {Math.round(comparison.adaptive.accuracyGain)}% | Random: {Math.round(comparison.random.accuracyGain)}%
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ─── Question Skip Audit ─── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Question Skip Audit</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Diagnosing why questions get rejected during adaptive generation.
        </Text>

        {/* Acceptance Rate */}
        <View style={styles.metricsGrid}>
          {[
            { label: 'Generated (all time)', value: skipAuditSummary.totalGenerated, color: colors.info },
            { label: 'Accepted', value: skipAuditSummary.passCount, color: colors.success },
            { label: 'Skipped', value: skipAuditSummary.records.length, color: skipAuditSummary.records.length > 0 ? colors.error : colors.success },
            { label: 'Acceptance Rate', value: `${skipAuditSummary.acceptanceRate}%`, color: skipAuditSummary.acceptanceRate >= 20 ? colors.success : colors.error },
          ].map((card, i) => (
            <View key={i} style={[styles.metricCard, { borderLeftColor: card.color }]}>
              <Text style={[styles.metricValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.metricLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Generator Alignment Rate */}
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.bodySmall, { fontWeight: '700', marginBottom: spacing.sm }]}>
            Generator Alignment Rate
          </Text>
          <View style={styles.metricsGrid}>
            {[
              {
                label: 'AI Generator Alignment',
                value: `${alignmentRate}%`,
                color: alignmentRate >= 90 ? colors.success : alignmentRate >= 70 ? '#F59E0B' : colors.error,
              },
              {
                label: 'Total Generations',
                value: alignmentMetrics.totalGenerations,
                color: colors.info,
              },
              {
                label: 'Aligned',
                value: alignmentMetrics.alignedGenerations,
                color: colors.success,
              },
              {
                label: 'Target',
                value: '> 90%',
                color: colors.textSecondary,
              },
            ].map((card, i) => (
              <View key={i} style={[styles.metricCard, { borderLeftColor: card.color }]}>
                <Text style={[styles.metricValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.metricLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
          {alignmentRate < 90 && alignmentMetrics.totalGenerations > 0 && (
            <View style={{ backgroundColor: colors.error + '10', padding: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.error + '30', marginTop: spacing.sm }}>
              <Text style={[typography.bodySmall, { color: colors.error, fontWeight: '600' }]}>
                Alignment rate ({alignmentRate}%) is below target (90%). The AI generator is producing off-topic questions.
              </Text>
            </View>
          )}
        </View>

        {/* Skipped Count by Reason */}
        <Text style={[typography.bodySmall, { fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm }]}>
          Skipped Count by Reason
        </Text>
        {skipAuditSummary.records.length === 0 ? (
          <Text style={[typography.bodySmall, { color: colors.textTertiary, fontStyle: 'italic' }]}>
            No questions have been skipped yet.
          </Text>
        ) : (
          <View style={styles.metricsGrid}>
            {[
              { label: 'Topic Mismatch', count: skipAuditSummary.byReason.topic_mismatch || 0, color: '#F59E0B' },
              { label: 'Integrity Failure', count: skipAuditSummary.byReason.integrity_failure || 0, color: '#7C3AED' },
              { label: 'Coverage Failure', count: skipAuditSummary.byReason.coverage_failure || 0, color: '#0891B2' },
              { label: 'Inventory Failure', count: skipAuditSummary.byReason.inventory_failure || 0, color: '#EC4899' },
              { label: 'Diversity Failure', count: skipAuditSummary.byReason.diversity_failure || 0, color: '#FF6B35' },
            ].map((item, i) => {
              const pct = skipAuditSummary.records.length > 0
                ? Math.round((item.count / skipAuditSummary.records.length) * 100)
                : 0;
              return (
                <View key={i} style={[styles.metricCard, { borderLeftColor: item.color }]}>
                  <Text style={[styles.metricValue, { color: item.color }]}>{item.count}</Text>
                  <Text style={styles.metricLabel}>{item.label} ({pct}%)</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Bottleneck Analysis */}
        {skipAuditSummary.records.length > 0 && (
          <>
            <Text style={[typography.bodySmall, { fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm }]}>
              {bottleneck.hasBottleneck ? 'Bottleneck Detected' : 'No Bottleneck Detected'}
            </Text>
            {bottleneck.hasBottleneck && (
              <View style={{ backgroundColor: colors.error + '10', padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.error + '30', marginBottom: spacing.md }}>
                <Text style={[typography.bodySmall, { color: colors.error, fontWeight: '700' }]}>
                  Acceptance rate ({skipAuditSummary.acceptanceRate}%) is below 20% threshold.
                </Text>
                <Text style={[typography.bodySmall, { color: colors.text, marginTop: spacing.sm }]}>
                  Primary bottleneck: {bottleneck.primaryBottleneck}
                </Text>
              </View>
            )}
            <Text style={[typography.bodySmall, { fontWeight: '600', marginBottom: spacing.sm }]}>Exact Percentages</Text>
            <View style={styles.metricsGrid}>
              {[
                { label: 'AI generator ignoring requested topic', value: `${bottleneck.aiGeneratorIgnoreRate}%`, color: '#F59E0B' },
                { label: 'Missing template inventory', value: `${bottleneck.templateInventoryMissRate}%`, color: '#0891B2' },
                { label: 'Incorrect metadata tagging', value: `${bottleneck.metadataTaggingIssueRate}%`, color: '#EC4899' },
                { label: 'Overly strict topic enforcement', value: `${bottleneck.strictEnforcementRate}%`, color: '#DC2626' },
              ].map((item, i) => (
                <View key={i} style={[styles.metricCard, { borderLeftColor: item.color }]}>
                  <Text style={[styles.metricValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            {/* Detailed breakdown */}
            {bottleneck.breakdown.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[typography.bodySmall, { fontWeight: '600', marginBottom: spacing.sm }]}>Breakdown</Text>
                {bottleneck.breakdown.map((b, i) => (
                  <View key={i} style={styles.improvingRow}>
                    <Text style={[typography.bodySmall, { flex: 1, color: colors.text }]}>{b.label}</Text>
                    <Badge label={`${b.percent}%`} color={b.color} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Recent Skips Log */}
        {skipAuditSummary.records.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.bodySmall, { fontWeight: '700', marginBottom: spacing.sm }]}>
              Recent Skips (last 10)
            </Text>
            {skipAuditSummary.records.slice(-10).reverse().map((r, i) => {
              const catColor = r.rejectionCategory === 'topic_mismatch' ? '#F59E0B'
                : r.rejectionCategory === 'integrity_failure' ? '#7C3AED'
                : r.rejectionCategory === 'coverage_failure' ? '#0891B2'
                : r.rejectionCategory === 'inventory_failure' ? '#EC4899'
                : '#FF6B35';
              return (
                <View key={i} style={styles.improvingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySmall, { fontWeight: '600', fontSize: 12 }]}>
                      Req: {r.requestedTopic || r.requestedSubject}
                      {' → '}Got: {r.generatedTopic}
                      {r.generatedSubtopic ? ` / ${r.generatedSubtopic}` : ''}
                    </Text>
                    <Text style={[typography.small, { color: colors.textTertiary, fontSize: 11 }]}>
                      [{r.source}] {r.rejectionReason.slice(0, 80)}
                    </Text>
                  </View>
                  <Badge label={r.rejectionCategory.replace('_', ' ')} color={catColor} />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Validation Phase 1 Trigger */}
      <TouchableOpacity
        onPress={() => {
          const report = useMCQStore.getState().runValidationPhase1();
          printValidationReport(report);
        }}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.info + '40',
          padding: spacing.md,
          marginTop: spacing.xl,
          alignItems: 'center',
        }}
      >
        <Text style={[typography.bodySmall, { fontWeight: '700', color: colors.info }]}>
          Run Validation Phase 1
        </Text>
        <Text style={[typography.small, { color: colors.textTertiary, marginTop: 4 }]}>
          Print validation report to console
        </Text>
      </TouchableOpacity>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.huge + spacing.md, paddingBottom: spacing.huge },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily.bodyBold,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  healthScoreArea: { alignItems: 'center', paddingVertical: spacing.md },
  healthScoreRing: { flexDirection: 'row', alignItems: 'flex-start' },
  healthScoreValue: { fontSize: 52, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.primary, letterSpacing: -2 },
  healthScoreUnit: { fontSize: 22, fontWeight: '600', fontFamily: fontFamily.bodyMedium, color: colors.primary, marginTop: spacing.sm },
  healthScoreLabel: { fontSize: 14, fontWeight: '600', fontFamily: fontFamily.bodyMedium, color: colors.textSecondary, marginTop: spacing.xs },
  healthDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  healthDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  healthDetail: { flex: 1, alignItems: 'center' },
  healthDetailValue: { fontSize: 17, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.text },
  healthDetailLabel: { fontSize: 11, fontFamily: fontFamily.body, color: colors.textTertiary, fontWeight: '500', marginTop: spacing.xs, textAlign: 'center' },

  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightTitle: { fontSize: 11, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.textTertiary, letterSpacing: 0.3, textTransform: 'uppercase' },
  insightValue: { fontSize: 17, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.success, marginTop: spacing.xs, lineHeight: 22 },
  insightDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    width: '47%',
  },
  metricValue: { fontSize: 24, fontWeight: '700', fontFamily: fontFamily.bodyBold },
  metricLabel: { fontSize: 11, fontFamily: fontFamily.body, color: colors.textTertiary, fontWeight: '500', marginTop: spacing.xs },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  improvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  suggestionCTA: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  suggestionCTAText: { fontSize: 13, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.white },

  outcomeCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  outcomeTitle: { fontSize: 17, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.text, textAlign: 'center' },
  outcomePositive: { fontSize: 20, fontWeight: '700', fontFamily: fontFamily.bodyBold, color: colors.success, marginTop: spacing.md },
  outcomePending: { fontSize: 16, fontWeight: '600', fontFamily: fontFamily.bodyMedium, color: colors.warning, marginTop: spacing.md },
  outcomeDetail: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
