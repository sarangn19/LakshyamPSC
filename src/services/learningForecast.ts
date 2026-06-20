import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useUserStore } from '../store/userStore';
import { syllabus } from '../data/syllabus';
import { getAllScorableSubtopics } from './knowledgeEngine';

export interface LearningForecast {
  daysToExam: number;
  overallMastery: number;
  coveragePercent: number;
  projectedMastery: number;
  totalTopics: number;
  masteredTopics: number;
  attemptedTopics: number;
  recommendedDaily: number;
  onTrack: boolean;
  blockingTopics: { subject: string; topic: string; mastery: number }[];
}

function getDaysSinceFirstAttempt(): number {
  const state = useCognitiveTwinStore.getState();
  const timestamps = Object.values(state.masteryMap)
    .filter((m) => m.lastAttempted > 0)
    .map((m) => m.lastAttempted);
  if (timestamps.length === 0) return 0;
  const first = Math.min(...timestamps);
  return Math.max(1, (Date.now() - first) / 86400000);
}

function getDailyQuestionRate(): number {
  const state = useCognitiveTwinStore.getState();
  const totalAttempts = Object.values(state.masteryMap).reduce((s, m) => s + m.attempts, 0);
  const days = getDaysSinceFirstAttempt();
  return days > 0 ? totalAttempts / days : 0;
}

export function getLearningForecast(): LearningForecast {
  const userState = useUserStore.getState();
  const twinState = useCognitiveTwinStore.getState();

  const examDateStr = userState.examDate;
  let daysToExam = 365;
  if (examDateStr) {
    daysToExam = Math.max(1, Math.round((new Date(examDateStr).getTime() - Date.now()) / 86400000));
  }

  const allScorable = getAllScorableSubtopics();
  const totalTopics = [...new Set(allScorable.map((s) => `${s.subject}::${s.topic}`))].length;
  const totalSubtopics = allScorable.length;

  const subjectTopicMap: Record<string, Set<string>> = {};
  for (const s of allScorable) {
    if (!subjectTopicMap[s.subject]) subjectTopicMap[s.subject] = new Set();
    subjectTopicMap[s.subject].add(s.topic);
  }

  const blockedTopics: { subject: string; topic: string; mastery: number }[] = [];

  let masteredCount = 0;
  let attemptedCount = 0;
  let totalMasterySum = 0;
  let totalMasteryCount = 0;

  for (const [nodeId, m] of Object.entries(twinState.masteryMap)) {
    if (m.attempts < 2) continue;
    totalMasterySum += m.masteryScore;
    totalMasteryCount++;
    if (m.masteryScore >= 75) masteredCount++;
  }

  overallMastery: for (const [subject, topics] of Object.entries(subjectTopicMap)) {
    for (const topic of topics) {
      const topicKey = `${subject}::${topic}`;
      const m = twinState.masteryMap[topicKey];
      if (m && m.attempts >= 1) attemptedCount++;
      if (m && m.masteryScore < 40 && m.attempts >= 2) {
        blockedTopics.push({ subject, topic, mastery: m.masteryScore });
      }
    }
  }

  blockedTopics.sort((a, b) => a.mastery - b.mastery);
  blockedTopics.splice(5);

  const coveragePercent = totalSubtopics > 0 ? Math.round((attemptedCount / totalSubtopics) * 100) : 0;
  const overallMastery = totalMasteryCount > 0 ? Math.round(totalMasterySum / totalMasteryCount) : 0;

  const dailyRate = getDailyQuestionRate();
  const questionsPerTopic = 10;
  const remainingTopics = totalTopics - attemptedCount;
  const totalQuestionsNeeded = remainingTopics * questionsPerTopic;
  const daysAvailable = daysToExam;
  const recommendedDaily = Math.ceil(Math.max(5, totalQuestionsNeeded / Math.max(1, daysAvailable)));

  const dailyGrowth = dailyRate > 0 ? dailyRate / questionsPerTopic : 0;
  const projectedNewTopics = Math.min(remainingTopics, Math.round(dailyGrowth * daysAvailable));
  const projectedMastery = Math.min(100, Math.round(
    ((masteredCount + projectedNewTopics) / totalTopics) * 100
  ));

  const onTrack = projectedMastery >= 70;

  return {
    daysToExam,
    overallMastery,
    coveragePercent,
    projectedMastery,
    totalTopics,
    masteredTopics: masteredCount,
    attemptedTopics: attemptedCount,
    recommendedDaily,
    onTrack,
    blockingTopics,
  };
}
