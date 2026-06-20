import { usePerformanceStore, SessionOutcome } from '../store/performanceStore';
import { useBKTStore } from '../store/bktStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useUserStore } from '../store/userStore';
import { getCompositeExamWeight } from '../data/examBlueprints';
import { getBlueprintBoost } from './blueprintAlignment';
import { getDueSummary } from './spacedRepetition';

interface StudyPathRecommendation {
  subject: string;
  topic: string;
  score: number;
  reason: string;
  reasonType: 'cooccurrence' | 'sequential' | 'momentum' | 'blueprint' | 'gap' | 'forgetting' | 'coldstart';
}

const MIN_CO_OCCURRENCES = 2;

function buildCoOccurrenceMatrix(sessions: SessionOutcome[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const session of sessions) {
    const subjects = Object.keys(session.subjectScores);
    for (let i = 0; i < subjects.length; i++) {
      for (let j = i + 1; j < subjects.length; j++) {
        const a = subjects[i];
        const b = subjects[j];
        if (!matrix[a]) matrix[a] = {};
        if (!matrix[b]) matrix[b] = {};
        matrix[a][b] = (matrix[a][b] || 0) + 1;
        matrix[b][a] = (matrix[b][a] || 0) + 1;
      }
    }
  }
  return matrix;
}

function buildTransitionGraph(sessions: SessionOutcome[]): Record<string, Record<string, number>> {
  const transitions: Record<string, Record<string, number>> = {};
  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    const fromSubjects = Object.keys(sorted[i].subjectScores);
    const toSubjects = Object.keys(sorted[i + 1].subjectScores);
    for (const from of fromSubjects) {
      for (const to of toSubjects) {
        if (from === to) continue;
        if (!transitions[from]) transitions[from] = {};
        transitions[from][to] = (transitions[from][to] || 0) + 1;
      }
    }
  }
  return transitions;
}

function findMomentumTopics(sessions: SessionOutcome[]): { subject: string; improvement: number }[] {
  const subjectAccOverTime: Record<string, { acc: number; total: number }[]> = {};
  for (const session of sessions) {
    for (const [sub, score] of Object.entries(session.subjectScores)) {
      if (score.total < 2) continue;
      if (!subjectAccOverTime[sub]) subjectAccOverTime[sub] = [];
      subjectAccOverTime[sub].push({ acc: score.correct / score.total, total: score.total });
    }
  }
  const result: { subject: string; improvement: number }[] = [];
  for (const [sub, history] of Object.entries(subjectAccOverTime)) {
    if (history.length < 3) continue;
    const sorted = history;
    const first = sorted.slice(0, Math.ceil(sorted.length / 2));
    const last = sorted.slice(Math.floor(sorted.length / 2));
    const firstAvg = first.reduce((s, h) => s + h.acc, 0) / first.length;
    const lastAvg = last.reduce((s, h) => s + h.acc, 0) / last.length;
    result.push({ subject: sub, improvement: lastAvg - firstAvg });
  }
  return result.sort((a, b) => b.improvement - a.improvement);
}

export function getStudyPathRecommendations(limit = 5): StudyPathRecommendation[] {
  const perf = usePerformanceStore.getState();
  const bkt = useBKTStore.getState();
  const twin = useCognitiveTwinStore.getState();
  const user = useUserStore.getState();
  const sessions = perf.sessionOutcomes;
  const targetExams = user.targetExams || ['LDC'];
  const gapRecommendations: StudyPathRecommendation[] = [];

  const hasData = sessions.length >= MIN_CO_OCCURRENCES;

  if (!hasData) {
    const allTopics = getAllBlueprintTopics(targetExams);
    for (const t of allTopics) {
      const weight = getCompositeExamWeight(targetExams, t.subject, t.topic);
      gapRecommendations.push({
        subject: t.subject,
        topic: t.topic,
        score: weight,
        reason: `${t.subject} — ${weight}% of ${targetExams[0]} exam weight`,
        reasonType: 'coldstart',
      });
    }
    return gapRecommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const coMatrix = buildCoOccurrenceMatrix(sessions);
  const transitions = buildTransitionGraph(sessions);
  const momentum = findMomentumTopics(sessions);
  const scored = new Map<string, StudyPathRecommendation>();
  const addScore = (rec: StudyPathRecommendation) => {
    const key = `${rec.subject}::${rec.topic}`;
    const existing = scored.get(key);
    if (!existing || rec.score > existing.score) scored.set(key, rec);
  };

  for (const session of sessions) {
    const studiedSubjects = Object.keys(session.subjectScores);
    for (const studied of studiedSubjects) {
      const coTopics = coMatrix[studied] || {};
      for (const [coSubject, count] of Object.entries(coTopics)) {
        if (count < MIN_CO_OCCURRENCES) continue;
        const topicMastery = bkt.getTopicPMastered(coSubject, '');
        if (topicMastery < 0.6) {
          addScore({
            subject: coSubject, topic: '', score: count * 5,
            reason: `People who studied ${studied} also studied ${coSubject}`,
            reasonType: 'cooccurrence',
          });
        }
      }
    }
  }

  const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 2; i++) {
    const from = Object.keys(sorted[i].subjectScores);
    const to = Object.keys(sorted[i + 1].subjectScores);
    for (const f of from) {
      for (const t of to) {
        if (f === t) continue;
        const gapTopic = bkt.getTopicPMastered(t, '');
        if (gapTopic < 0.6) {
          const transitionCount = transitions[f]?.[t] || 0;
          addScore({
            subject: t, topic: '', score: transitionCount * 10,
            reason: `After studying ${f}, most learners move to ${t}`,
            reasonType: 'sequential',
          });
        }
      }
    }
  }

  for (const m of momentum) {
    if (m.improvement > 0.1) {
      addScore({
        subject: m.subject, topic: '', score: Math.round(m.improvement * 100),
        reason: `You improved ${Math.round(m.improvement * 100)}% in ${m.subject} — keep the momentum!`,
        reasonType: 'momentum',
      });
    }
  }

  const gaps = twin.getOpenGaps?.() || [];
  for (const gap of gaps) {
    addScore({
      subject: gap.subject, topic: gap.topic, score: 30 + (100 - gap.currentMastery),
      reason: `${gap.subtopic || gap.topic} needs attention (${Math.round(gap.currentMastery)}% mastery)`,
      reasonType: 'gap',
    });
  }

  const learningGaps = bkt.getLearningGaps();
  for (const lg of learningGaps.slice(0, 5)) {
    const key = `${lg.subject}::${lg.topic}`;
    if (!scored.has(key)) {
      addScore({
        subject: lg.subject, topic: lg.topic, score: Math.round(lg.gap * 50),
        reason: `${lg.topic} has ${Math.round(lg.gap * 100)}% forgetting risk`,
        reasonType: 'forgetting',
      });
    }
  }

  const due = getDueSummary();
  if (due.count > 0) {
    addScore({
      subject: 'Review', topic: '', score: due.count * 3 + due.highestOverdue,
      reason: `${due.count} items overdue for review (${due.highestOverdue} days max)`,
      reasonType: 'forgetting',
    });
  }

  const recs = Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (recs.length === 0) {
    const allTopics = getAllBlueprintTopics(targetExams);
    for (const t of allTopics.slice(0, limit)) {
      const weight = getCompositeExamWeight(targetExams, t.subject, t.topic);
      addScore({
        subject: t.subject, topic: t.topic, score: weight,
        reason: `Recommended based on ${targetExams[0]} exam weight`,
        reasonType: 'blueprint',
      });
    }
    return Array.from(scored.values()).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  return recs;
}

function getAllBlueprintTopics(targetExams: string[]): { subject: string; topic: string }[] {
  const seen = new Set<string>();
  const result: { subject: string; topic: string }[] = [];
  for (const exam of targetExams) {
    const { getBlueprint } = require('../data/examBlueprints');
    const bp = getBlueprint(exam);
    if (!bp) continue;
    for (const sw of bp.subjectWeights) {
      const key = sw.subjectName;
      if (!seen.has(key)) {
        seen.add(key);
        if (sw.topicWeights) {
          for (const tw of sw.topicWeights) {
            result.push({ subject: sw.subjectName, topic: tw.topicName });
          }
        } else {
          result.push({ subject: sw.subjectName, topic: '' });
        }
      }
    }
  }
  return result;
}
