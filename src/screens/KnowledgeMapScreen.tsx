import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, spacing, borderRadius, fontFamily } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore, KnowledgeMastery } from '../store/cognitiveTwinStore';
import { getNodesByLevel, getChildren, getNodePath, getAncestors, KnowledgeNode, getSiblings, getNode, getPrerequisites, arePrerequisitesMet } from '../data/knowledgeTree';
import { getLearnerProfile } from '../services/learnerStage';
import { ProgressBar, Badge } from '../components/common/StyledComponents';

type MasteryState = 'strong' | 'improving' | 'weak' | 'at_risk' | 'unknown';

function getMasteryState(mastery?: KnowledgeMastery): MasteryState {
  if (!mastery || mastery.attempts === 0) return 'unknown';
  if (mastery.masteryScore >= 75) return 'strong';
  if (mastery.masteryScore >= 50) return 'improving';
  if (mastery.masteryScore >= 30) return 'weak';
  return 'at_risk';
}

function getStateColor(state: MasteryState): string {
  switch (state) {
    case 'strong': return colors.status.strong;
    case 'improving': return colors.status.improving;
    case 'weak': return colors.status.needsRevision;
    case 'at_risk': return colors.status.weakArea;
    default: return colors.status.notPracticed;
  }
}

function getStateLabel(state: MasteryState): string {
  switch (state) {
    case 'strong': return 'Strong';
    case 'improving': return 'Improving';
    case 'weak': return 'Weak';
    case 'at_risk': return 'At Risk';
    default: return 'Not Practiced';
  }
}

function getStateTheme(state: MasteryState) {
  const color = getStateColor(state);
  const label = getStateLabel(state);
  return { color, label };
}

const NODE_GUTTER = 12;
const CONNECTOR_COLOR = 'rgba(0,0,0,0.08)';

interface KnowledgeMapNodeCardProps {
  node: KnowledgeNode;
  mastery: KnowledgeMastery;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDetail: () => void;
  childCount: number;
  isLastChild: boolean;
}

function KnowledgeMapNodeCard({ node, mastery, depth, isExpanded, onToggle, onDetail, childCount, isLastChild }: KnowledgeMapNodeCardProps) {
  const state = getMasteryState(mastery);
  const { color } = getStateTheme(state);
  const hasChildren = childCount > 0;
  const masteryVal = mastery.attempts > 0 ? mastery.masteryScore : null;

  return (
    <View style={{ paddingLeft: depth * 28 }}>
      {/* Vertical connector line from parent */}
      {depth > 0 && (
        <View style={[styles.connectorV, { height: NODE_GUTTER }]} />
      )}
      {/* Card */}
      <TouchableOpacity
        style={[styles.nodeCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={onDetail}
        activeOpacity={0.8}
      >
        <View style={styles.nodeCardInner}>
          <View style={styles.nodeCardHeader}>
            <View style={styles.nodeNameRow}>
              <View style={[styles.masteryDotSm, { backgroundColor: color }]} />
              <Text
                style={[typography.bodySmall, { color: mastery.attempts > 0 ? colors.text : colors.textTertiary, fontWeight: '600' }]}
                numberOfLines={1}
              >
                {node.name}
              </Text>
            </View>
            <View style={styles.nodeCardActions}>
              {hasChildren && (
                <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.textMuted }}>{isExpanded ? '▾' : '▸'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onDetail} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 14, color: colors.textTertiary, marginLeft: 4 }}>ⓘ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.nodeCardMeta}>
            <Badge label={state} color={color} />
            {masteryVal !== null && (
              <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                {masteryVal}% · {mastery.attempts}q
              </Text>
            )}
            {masteryVal === null && (
              <Text style={[typography.tiny, { color: colors.textTertiary, marginLeft: spacing.sm }]}>
                Not attempted
              </Text>
            )}
            {hasChildren && (
              <Text style={[typography.tiny, { color: colors.textMuted, marginLeft: 'auto' }]}>
                {childCount} {childCount === 1 ? 'topic' : 'topics'}
              </Text>
            )}
          </View>

          {mastery.attempts >= 2 && (
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar percent={mastery.masteryScore} color={color} height={3} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

interface ConceptDetailPanelProps {
  node: KnowledgeNode;
  mastery: KnowledgeMastery;
  onClose: () => void;
}

function ConceptDetailPanel({ node, mastery, onClose }: ConceptDetailPanelProps) {
  const state = getMasteryState(mastery);
  const { color } = getStateTheme(state);
  const path = getNodePath(node.id);
  const ancestors = getAncestors(node.id);
  const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  const siblings = parent ? getSiblings(node.id).filter((s) => s.id !== node.id) : [];
  const children = getChildren(node.id);
  const masteryVal = mastery.attempts > 0 ? mastery.masteryScore : null;

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <View style={[styles.detailIcon, { backgroundColor: color + '20' }]}>
          <View style={[styles.detailIconDot, { backgroundColor: color }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: colors.text }]}>{node.name}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {node.level} · {path.join(' → ')}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailStat}>
          <Text style={[typography.h2, { color }]}>{masteryVal !== null ? `${masteryVal}%` : '—'}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Mastery</Text>
        </View>
        <View style={styles.detailStat}>
          <Text style={[typography.h2, { color: colors.text }]}>{mastery.attempts || 0}</Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Attempts</Text>
        </View>
        <View style={styles.detailStat}>
          <Text style={[typography.h2, { color: mastery.trend === 'improving' ? colors.status.strong : mastery.trend === 'declining' ? colors.status.weakArea : colors.textMuted }]}>
            {mastery.trend !== 'unknown' ? mastery.trend.charAt(0).toUpperCase() + mastery.trend.slice(1) : '—'}
          </Text>
          <Text style={[typography.tiny, { color: colors.textSecondary }]}>Trend</Text>
        </View>
      </View>

      {mastery.attempts >= 2 && (
        <View style={styles.detailSection}>
          <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '600' }]}>Score Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Accuracy</Text>
            <View style={styles.breakdownBarBg}>
              <View style={[styles.breakdownBarFill, { width: `${mastery.accuracy}%`, backgroundColor: mastery.accuracy >= 60 ? colors.status.strong : colors.status.needsRevision }]} />
            </View>
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{Math.round(mastery.accuracy)}%</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Hesitation</Text>
            <View style={styles.breakdownBarBg}>
              <View style={[styles.breakdownBarFill, { width: `${Math.round((1 - mastery.hesitationScore) * 100)}%`, backgroundColor: mastery.hesitationScore < 0.3 ? colors.status.strong : colors.status.needsRevision }]} />
            </View>
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{Math.round(mastery.hesitationScore * 100)}%</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Forgetting Risk</Text>
            <View style={styles.breakdownBarBg}>
              <View style={[styles.breakdownBarFill, { width: `${Math.round((1 - mastery.forgettingScore) * 100)}%`, backgroundColor: mastery.forgettingScore < 0.3 ? colors.status.strong : colors.status.weakArea }]} />
            </View>
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{Math.round(mastery.forgettingScore * 100)}%</Text>
          </View>
        </View>
      )}

      {parent && (
        <View style={styles.detailSection}>
          <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '600' }]}>Parent</Text>
          <View style={styles.relatedChip}>
            <View style={[styles.relDot, { backgroundColor: colors.primary }]} />
            <Text style={[typography.bodySmall, { color: colors.text }]}>{parent.name}</Text>
          </View>
        </View>
      )}

      {siblings.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '600' }]}>Siblings ({siblings.length})</Text>
          <View style={styles.relatedRow}>
            {siblings.slice(0, 5).map((sib) => {
              const sibMastery = useCognitiveTwinStore.getState().masteryMap[sib.id];
              const sibState = getMasteryState(sibMastery);
              const sibColor = getStateColor(sibState);
              return (
                <View key={sib.id} style={styles.relatedChip}>
                  <View style={[styles.relDot, { backgroundColor: sibColor }]} />
                  <Text style={[typography.tiny, { color: colors.textSecondary }]} numberOfLines={1}>{sib.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {(() => {
        const prereqs = getPrerequisites(node.id);
        if (prereqs.length === 0) return null;
        const mm = useCognitiveTwinStore.getState().masteryMap;
        const prereqCheck = arePrerequisitesMet(node.id, mm, 60);
        return (
          <View style={styles.detailSection}>
            <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '600' }]}>
              Prerequisites {prereqCheck.met ? '✓' : `(${prereqCheck.unmet.length} unmet)`}
            </Text>
            <View style={styles.relatedRow}>
              {prereqs.map((p) => {
                const pMastery = mm[p.id];
                const pState = getMasteryState(pMastery);
                const pColor = getStateColor(pState);
                return (
                  <View key={p.id} style={styles.relatedChip}>
                    <View style={[styles.relDot, { backgroundColor: pColor }]} />
                    <Text style={[typography.tiny, { color: colors.textSecondary }]} numberOfLines={1}>{p.name}</Text>
                  </View>
                );
              })}
            </View>
            {!prereqCheck.met && (
              <Text style={[typography.tiny, { color: colors.status.weakArea, marginTop: 2 }]}>
                Master {prereqCheck.unmet.join(', ')} first ({'>'}60%)
              </Text>
            )}
          </View>
        );
      })()}

      {children.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '600' }]}>Children ({children.length})</Text>
          <View style={styles.relatedRow}>
            {children.map((child) => {
              const childMastery = useCognitiveTwinStore.getState().masteryMap[child.id];
              const childState = getMasteryState(childMastery);
              const childColor = getStateColor(childState);
              return (
                <View key={child.id} style={styles.relatedChip}>
                  <View style={[styles.relDot, { backgroundColor: childColor }]} />
                  <Text style={[typography.tiny, { color: colors.textSecondary }]} numberOfLines={1}>{child.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

export function KnowledgeMapScreen() {
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const subjects = getNodesByLevel('subject');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const learnerProfile = getLearnerProfile();
  const isNewUser = learnerProfile.totalQuestions < 5;

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const defaultMastery: KnowledgeMastery = {
    nodeId: '', attempts: 0, correct: 0, accuracy: 0,
    hesitationScore: 0, forgettingScore: 0,
    masteryScore: 0, lastPracticed: '', trend: 'unknown',
  };

  const renderSubject = (subject: KnowledgeNode, index: number) => {
    const mastery = masteryMap[subject.id] || { ...defaultMastery, nodeId: subject.id };
    const isExpanded = expandedNodes.has(subject.id);
    const childNodes = getChildren(subject.id);
    const state = getMasteryState(mastery);
    const { color } = getStateTheme(state);

    return (
      <View key={subject.id} style={styles.subjectBlock}>
        {/* Subject Card */}
        <TouchableOpacity
          style={[styles.subjectCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
          onPress={() => setDetailNodeId(subject.id)}
          activeOpacity={0.8}
        >
          <View style={styles.subjectCardTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.masteryDot, { backgroundColor: color }]} />
                <Text style={[typography.h3, { color: colors.text }]}>{subject.name}</Text>
                <Badge label={state} color={color} />
              </View>
            </View>
            {childNodes.length > 0 && (
              <TouchableOpacity onPress={() => toggleNode(subject.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>{isExpanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.subjectCardMeta}>
            {mastery.attempts > 0 && (
              <>
                <Text style={{ fontSize: 28, fontWeight: '700', color, fontFamily: fontFamily.bodyBold }}>{mastery.masteryScore}%</Text>
                <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                  {mastery.attempts} questions
                </Text>
              </>
            )}
            {mastery.attempts === 0 && (
              <Text style={[typography.caption, { color: colors.textTertiary }]}>No practice data yet</Text>
            )}
            {mastery.attempts >= 2 && (
              <View style={{ flex: 1, marginLeft: 'auto', maxWidth: 120 }}>
                <ProgressBar percent={mastery.masteryScore} color={color} height={4} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded topic/subtopic tree */}
        {isExpanded && childNodes.length > 0 && (
          <View style={styles.treeBranch}>
            {childNodes.map((child, ci) => renderNode(child, 1, ci === childNodes.length - 1))}
          </View>
        )}
      </View>
    );
  };

  const renderNode = (node: KnowledgeNode, depth: number, isLastChild: boolean) => {
    const mastery = masteryMap[node.id] || { ...defaultMastery, nodeId: node.id };
    const isExpanded = expandedNodes.has(node.id);
    const childNodes = getChildren(node.id);

    return (
      <View key={node.id}>
        <KnowledgeMapNodeCard
          node={node}
          mastery={mastery}
          depth={depth}
          isExpanded={isExpanded}
          onToggle={() => toggleNode(node.id)}
          onDetail={() => setDetailNodeId(node.id)}
          childCount={childNodes.length}
          isLastChild={isLastChild}
        />
        {isExpanded && childNodes.length > 0 && (
          <View style={styles.childrenConnector}>
            {childNodes.map((child, ci) => renderNode(child, depth + 1, ci === childNodes.length - 1))}
          </View>
        )}
      </View>
    );
  };

  const detailNode = detailNodeId ? getNode(detailNodeId) : null;
  const detailMastery = detailNode ? (masteryMap[detailNode.id] || { ...defaultMastery, nodeId: detailNode.id }) : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.h2, { color: colors.text }]}>Knowledge Map</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
              {isNewUser
                ? 'Start practicing to build your knowledge map'
                : `${learnerProfile.stage} stage · ${learnerProfile.totalQuestions} questions · ${learnerProfile.sessionCount} sessions`}
            </Text>
          </View>
          <View style={[styles.stagePill, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[typography.tiny, { color: colors.primary, fontWeight: '600', textTransform: 'capitalize' }]}>{learnerProfile.stage}</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          {(['strong', 'improving', 'weak', 'at_risk', 'unknown'] as MasteryState[]).map((s) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getStateColor(s) }]} />
              <Text style={[typography.tiny, { color: colors.textSecondary }]}>{getStateLabel(s)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mapContainer}>
          {subjects.map((subject, i) => renderSubject(subject, i))}
        </View>

        {isNewUser && (
          <View style={styles.emptyHint}>
            <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>🗺️</Text>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
              Your knowledge map will fill in as you practice. Each subject, topic, and subtopic gets a color based on your mastery level.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.huge }} />
      </ScrollView>

      {/* Concept Detail Panel */}
      {detailNode && detailMastery && (
        <View style={styles.detailOverlay}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <ConceptDetailPanel node={detailNode} mastery={detailMastery} onClose={() => setDetailNodeId(null)} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.huge },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stagePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  mapContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },

  subjectBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  subjectCard: {
    padding: spacing.lg,
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masteryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginLeft: 20,
  },

  treeBranch: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  childrenConnector: {},

  connectorV: {
    width: 1,
    backgroundColor: CONNECTOR_COLOR,
    marginLeft: 12,
  },

  nodeCard: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.sm,
    marginVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeCardInner: {
    padding: spacing.md,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  masteryDotSm: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  emptyHint: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },

  detailOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  detailPanel: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailStat: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  detailSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  breakdownBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: 6,
    borderRadius: 3,
  },
  relatedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
  },
  relDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
