import type { StateCreator } from 'zustand';
import {
  scheduleAssessments,
  scoreAssessment,
  shouldReopenFromAssessment,
  getDueAssessments as getDueServiceAssessments,
  getAssessmentDashboard as getServiceAssessmentDashboard,
} from '../services/retentionAssessmentService';
import type { RetentionAssessment } from '../services/retentionAssessmentService';
import { getAllNodes } from '../data/knowledgeTree';
import type { RetentionRecord, KnowledgeMastery } from './cognitiveTwinTypes';
import type { CognitiveTwinState } from './cognitiveTwinStore';

const RETENTION_EXCELLENT_THRESHOLD = 90;
const RETENTION_GOOD_THRESHOLD = 75;
const RETENTION_AT_RISK_THRESHOLD = 50;
const RETENTION_REOPEN_MASTERY_THRESHOLD = 60;
const RETENTION_CHECK_7_DAYS = 7;
const RETENTION_CHECK_30_DAYS = 30;
const RETENTION_CHECK_90_DAYS = 90;

export interface RetentionSlice {
  retentionRecords: RetentionRecord[];
  retentionAssessments: RetentionAssessment[];
  runRetentionCheck: () => RetentionRecord[];
  getRetentionMetrics: () => { retainedGaps: number; lostGaps: number; reopenedGaps: number; averageRetentionRate: number; retention7Day: number; retention30Day: number; retention90Day: number; gapsAtRisk: number };
  getMostDurableLearning: (limit?: number) => { nodeName: string; subject: string; retentionRate: number; daysSinceClosure: number }[];
  scheduleRetentionAssessments: () => RetentionAssessment[];
  getDueAssessments: () => RetentionAssessment[];
  getAssessmentDashboard: () => any;
  completeAssessment: (assessmentId: string, correctCount: number, totalCount: number) => void;
  migrateFromLegacy: () => void;
  isMigrated: () => boolean;
}

export const createRetentionSlice: StateCreator<CognitiveTwinState, [], [], RetentionSlice> = (set, get) => ({
  retentionRecords: [],
  retentionAssessments: [],

  runRetentionCheck: () => {
    const state = get();
    const now = Date.now();
    const updatedRecords: RetentionRecord[] = [];

    for (const record of state.retentionRecords) {
      const mastery = state.masteryMap[record.nodeId];
      const currentMastery = mastery?.masteryScore ?? 0;
      const daysSince = record.closedAt
        ? Math.round((now - new Date(record.closedAt).getTime()) / 86400000)
        : 0;

      const updated = { ...record, daysSinceClosure: daysSince, lastChecked: new Date().toISOString() };

      if (daysSince >= RETENTION_CHECK_7_DAYS && updated.mastery7Day === null) {
        updated.mastery7Day = currentMastery;
      }
      if (daysSince >= RETENTION_CHECK_30_DAYS && updated.mastery30Day === null) {
        updated.mastery30Day = currentMastery;
      }
      if (daysSince >= RETENTION_CHECK_90_DAYS && updated.mastery90Day === null) {
        updated.mastery90Day = currentMastery;
      }

      const retentionBase = record.masteryAtClosure > 0 ? record.masteryAtClosure : 1;
      const retentionRate = Math.round((currentMastery / retentionBase) * 1000) / 10;
      updated.retentionRate = retentionRate;
      updatedRecords.push(updated);

      if (
        (record.mastery7Day !== null || daysSince >= RETENTION_CHECK_7_DAYS)
        && (retentionRate < RETENTION_AT_RISK_THRESHOLD || currentMastery < RETENTION_REOPEN_MASTERY_THRESHOLD)
      ) {
        const gap = state.gapRecords.find((g) => g.gapId === record.gapId);
        if (gap && (gap.status === 'closed' || gap.status === 'retained')) {
          const reopenTimestamp = new Date().toISOString();
          set((s) => ({
            gapRecords: s.gapRecords.map((g) =>
              g.gapId === record.gapId ? { ...g, status: 'open' as any } : g,
            ),
            gapLifecycles: s.gapLifecycles.map((l) =>
              l.gapId === record.gapId
                ? { ...l, reopenedCount: l.reopenedCount + 1, reopenedAt: [...l.reopenedAt, reopenTimestamp] }
                : l,
            ),
          }));
        }
      } else if (
        retentionRate >= RETENTION_GOOD_THRESHOLD
        && currentMastery >= RETENTION_REOPEN_MASTERY_THRESHOLD
        && daysSince >= RETENTION_CHECK_7_DAYS
      ) {
        const gap = state.gapRecords.find((g) => g.gapId === record.gapId);
        if (gap && gap.status === 'closed') {
          set((s) => ({
            gapRecords: s.gapRecords.map((g) =>
              g.gapId === record.gapId ? { ...g, status: 'retained' as any } : g,
            ),
          }));
        }
      }
    }

    const newAssessments = scheduleAssessments(updatedRecords, state.retentionAssessments);
    if (newAssessments.length > 0) {
      set((s) => ({ retentionAssessments: [...s.retentionAssessments, ...newAssessments] }));
    }

    set({ retentionRecords: updatedRecords });
    return updatedRecords;
  },

  getRetentionMetrics: () => {
    const state = get();
    const total = state.retentionRecords.length;
    if (total === 0) {
      return {
        retainedGaps: 0, lostGaps: 0, reopenedGaps: 0,
        averageRetentionRate: 0, retention7Day: 0,
        retention30Day: 0, retention90Day: 0, gapsAtRisk: 0,
      };
    }

    const with7Day = state.retentionRecords.filter((r) => r.mastery7Day !== null);
    const with30Day = state.retentionRecords.filter((r) => r.mastery30Day !== null);
    const with90Day = state.retentionRecords.filter((r) => r.mastery90Day !== null);

    const avgRetention = state.retentionRecords.reduce((s, r) => s + r.retentionRate, 0) / total;
    const avg7 = with7Day.length > 0 ? with7Day.reduce((s, r) => s + r.mastery7Day!, 0) / with7Day.length : 0;
    const avg30 = with30Day.length > 0 ? with30Day.reduce((s, r) => s + r.mastery30Day!, 0) / with30Day.length : 0;
    const avg90 = with90Day.length > 0 ? with90Day.reduce((s, r) => s + r.mastery90Day!, 0) / with90Day.length : 0;

    const retained = state.retentionRecords.filter((r) => r.retentionRate >= RETENTION_GOOD_THRESHOLD).length;
    const atRisk = state.retentionRecords.filter(
      (r) => r.retentionRate >= RETENTION_AT_RISK_THRESHOLD && r.retentionRate < RETENTION_GOOD_THRESHOLD,
    ).length;
    const lost = state.retentionRecords.filter((r) => r.retentionRate < RETENTION_AT_RISK_THRESHOLD).length;
    const totalReopened = state.gapLifecycles.reduce((s, l) => s + l.reopenedCount, 0);

    return {
      retainedGaps: retained,
      lostGaps: lost,
      reopenedGaps: totalReopened,
      averageRetentionRate: Math.round(avgRetention * 10) / 10,
      retention7Day: Math.round(avg7 * 10) / 10,
      retention30Day: Math.round(avg30 * 10) / 10,
      retention90Day: Math.round(avg90 * 10) / 10,
      gapsAtRisk: atRisk,
    };
  },

  getMostDurableLearning: (limit = 5) => {
    const state = get();
    return state.retentionRecords
      .filter((r) => r.daysSinceClosure >= 7)
      .sort((a, b) => b.retentionRate - a.retentionRate)
      .slice(0, limit)
      .map((r) => ({
        nodeName: r.nodeName,
        subject: r.subject,
        retentionRate: r.retentionRate,
        daysSinceClosure: r.daysSinceClosure,
      }));
  },

  scheduleRetentionAssessments: () => {
    const state = get();
    const newAssessments = scheduleAssessments(state.retentionRecords, state.retentionAssessments);
    if (newAssessments.length > 0) {
      set((s) => ({ retentionAssessments: [...s.retentionAssessments, ...newAssessments] }));
    }
    return [...state.retentionAssessments, ...newAssessments];
  },

  getDueAssessments: () => {
    return getDueServiceAssessments(get().retentionAssessments);
  },

  getAssessmentDashboard: () => {
    return getServiceAssessmentDashboard(get().retentionAssessments);
  },

  completeAssessment: (assessmentId, correctCount, totalCount) => {
    const state = get();
    const assessment = state.retentionAssessments.find((a) => a.id === assessmentId);
    if (!assessment || assessment.status === 'completed') return;

    const record = state.retentionRecords.find((r) => r.gapId === assessment.gapId);
    const masteryAtClosure = record?.masteryAtClosure ?? 100;

    const { score, retentionRate, passed } = scoreAssessment(
      masteryAtClosure, correctCount, totalCount,
    );

    const now = new Date().toISOString();

    set((s) => ({
      retentionAssessments: s.retentionAssessments.map((a) =>
        a.id === assessmentId
          ? {
              ...a,
              assessmentDate: now,
              score,
              retentionRate,
              passed,
              status: 'completed' as const,
            }
          : a,
      ),
    }));

    const { reopen, reason } = shouldReopenFromAssessment(score, retentionRate);
    if (reopen) {
      set((s) => ({
        gapRecords: s.gapRecords.map((g) =>
          g.gapId === assessment.gapId ? { ...g, status: 'open' as any } : g,
        ),
        gapLifecycles: s.gapLifecycles.map((l) =>
          l.gapId === assessment.gapId
            ? { ...l, reopenedCount: l.reopenedCount + 1, reopenedAt: [...l.reopenedAt, now] }
            : l,
        ),
      }));
    }

    if (record) {
      const key = `mastery${assessment.checkpoint.replace('day', 'Day')}` as keyof RetentionRecord;
      set((s) => ({
        retentionRecords: s.retentionRecords.map((r) =>
          r.gapId === assessment.gapId
            ? { ...r, retentionRate, lastChecked: now, [key]: score }
            : r,
        ),
      }));
    }
  },

  migrateFromLegacy: () => {
    const state = get();
    if (Object.keys(state.masteryMap).length > 0) return;

    const allNodes = [
      ...getAllNodes().filter((n: any) => n.level === 'subject'),
      ...getAllNodes().filter((n: any) => n.level === 'topic'),
    ].filter(Boolean);

    const initialMastery: Record<string, KnowledgeMastery> = {};
    for (const node of allNodes) {
      initialMastery[node.id] = {
        nodeId: node.id,
        attempts: 0, correct: 0, accuracy: 0,
        hesitationScore: 0, forgettingScore: 0,
        masteryScore: 0, lastPracticed: '', trend: 'unknown',
      };
    }

    set({ masteryMap: initialMastery });
  },

  isMigrated: () => {
    return Object.keys(get().masteryMap).length > 0;
  },
});
