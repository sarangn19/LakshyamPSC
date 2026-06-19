import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { colors, spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { useCognitiveTwinStore, KnowledgeMastery } from '../store/cognitiveTwinStore';
import { getNodesByLevel, getChildren, KnowledgeNode } from '../data/knowledgeTree';
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

interface TreeNodeProps {
  node: KnowledgeNode;
  mastery: KnowledgeMastery;
  depth: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
}

function TreeNode({ node, mastery, depth, expandedNodes, onToggle }: TreeNodeProps) {
  const hasChildren = getChildren(node.id).length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const state = getMasteryState(mastery);
  const stateColor = getStateColor(state);
  const indent = depth * 20;

  const masteryText = mastery.attempts > 0
    ? `${mastery.masteryScore}%`
    : '—';
  const attemptText = mastery.attempts > 0 ? `${mastery.attempts}q` : '';

  return (
    <View>
      <TouchableOpacity
        style={[styles.treeNode, { paddingLeft: spacing.lg + indent }]}
        onPress={() => {
          if (hasChildren) onToggle(node.id);
        }}
        activeOpacity={hasChildren ? 0.7 : 1}
      >
        <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
        <View style={styles.treeContent}>
          <View style={styles.treeHeader}>
            <Text style={[typography.bodySmall, {
              color: mastery.attempts > 0 ? colors.text : colors.textTertiary,
              fontWeight: '600',
            }]}>
              {node.name}
            </Text>
            {hasChildren && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: spacing.xs }}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            )}
          </View>
          <View style={styles.treeMeta}>
            <Badge label={getStateLabel(state)} color={stateColor} />
            <Text style={[typography.tiny, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
              {masteryText}{attemptText ? ` · ${attemptText}` : ''}
            </Text>
          </View>
          {mastery.attempts >= 2 && (
            <View style={{ marginTop: spacing.xs }}>
              <ProgressBar
                percent={mastery.masteryScore}
                color={stateColor}
                height={3}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function KnowledgeMapScreen() {
  const { t } = useTranslation();
  const masteryMap = useCognitiveTwinStore((s) => s.masteryMap);
  const subjects = getNodesByLevel('subject');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = (parentId: string, depth: number): React.ReactNode[] => {
    const children = getChildren(parentId);
    const nodes: React.ReactNode[] = [];

    for (const child of children) {
      const mastery = masteryMap[child.id] || {
        nodeId: child.id, attempts: 0, correct: 0, accuracy: 0,
        hesitationScore: 0, forgettingScore: 0,
        masteryScore: 0, lastPracticed: '', trend: 'unknown',
      };
      nodes.push(
        <TreeNode
          key={child.id}
          node={child}
          mastery={mastery}
          depth={depth}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
        />
      );
      if (expandedNodes.has(child.id)) {
        nodes.push(...renderTree(child.id, depth + 1));
      }
    }

    return nodes;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[typography.h2, { color: colors.text }]}>Knowledge Tree</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
        Expand subjects to see topics and subtopics with mastery levels
      </Text>

      <View style={styles.legendRow}>
        {(['strong', 'improving', 'weak', 'at_risk', 'unknown'] as MasteryState[]).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStateColor(s) }]} />
            <Text style={[typography.tiny, { color: colors.textSecondary }]}>{getStateLabel(s)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.treeContainer}>
        {subjects.map((subject) => {
          const mastery = masteryMap[subject.id] || {
            nodeId: subject.id, attempts: 0, correct: 0, accuracy: 0,
            hesitationScore: 0, forgettingScore: 0,
            masteryScore: 0, lastPracticed: '', trend: 'unknown',
          };
          return (
            <View key={subject.id}>
              <TreeNode
                node={subject}
                mastery={mastery}
                depth={0}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
              />
              {expandedNodes.has(subject.id) && renderTree(subject.id, 1)}
            </View>
          );
        })}
      </View>

      <View style={{ height: spacing.huge }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.huge },
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
  treeContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  treeNode: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  treeContent: { flex: 1 },
  treeHeader: { flexDirection: 'row', alignItems: 'center' },
  treeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
});
