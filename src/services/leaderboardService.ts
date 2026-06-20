import { usePerformanceStore, InteractionSignal } from '../store/performanceStore';

export interface MonthlyStats {
  year: number;
  month: number;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  score: number;
  rank: number;
}

export function getCurrentMonthStats(): MonthlyStats {
  const now = new Date();
  return getMonthStats(now.getFullYear(), now.getMonth());
}

export function getAllTimeStats(): { correct: number; wrong: number; total: number; accuracy: number; score: number } {
  const signals = usePerformanceStore.getState().interactionSignals;
  const correct = signals.filter((s) => s.answeredCorrect).length;
  const total = signals.length;
  const wrong = total - correct;
  const accuracy = total > 0 ? correct / total : 0;
  const score = correct * 10 - wrong * 2 + Math.round(accuracy * 1000);
  return { correct, wrong, total, accuracy, score };
}

export function getMonthStats(year: number, month: number): MonthlyStats {
  const signals = usePerformanceStore.getState().interactionSignals.filter((s) => {
    const d = new Date(s.sessionTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const correct = signals.filter((s) => s.answeredCorrect).length;
  const total = signals.length;
  const wrong = total - correct;
  const accuracy = total > 0 ? correct / total : 0;
  const score = correct * 10 - wrong * 2 + Math.round(accuracy * 1000);
  return { year, month, correct, wrong, total, accuracy, score, rank: 1 };
}

export function getArchivedMonths(): MonthlyStats[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const months: MonthlyStats[] = [];
  const allSignals = usePerformanceStore.getState().interactionSignals;
  const seen = new Set<string>();
  allSignals.forEach((s) => {
    const d = new Date(s.sessionTime);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) return;
    months.push(getMonthStats(d.getFullYear(), d.getMonth()));
  });
  return months.sort((a, b) => b.year - a.year || b.month - a.month);
}

export function getMonthRemaining(): { days: number; hours: number } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const diff = end.getTime() - now.getTime();
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
  };
}

export const MINIMUM_ATTEMPTS = 100;
