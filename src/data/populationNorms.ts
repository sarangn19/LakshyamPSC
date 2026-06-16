export interface PopulationNorm {
  subject: string;
  avgForgettingDays: number;
  avgAccuracy: number;
  sampleSize: number;
  lastUpdated: string;
}

export const populationNorms: Record<string, PopulationNorm> = {
  'Kerala History': { subject: 'Kerala History', avgForgettingDays: 8, avgAccuracy: 0.72, sampleSize: 420, lastUpdated: '2026-06-01' },
  'Renaissance': { subject: 'Renaissance', avgForgettingDays: 11, avgAccuracy: 0.78, sampleSize: 380, lastUpdated: '2026-06-01' },
  'Constitution': { subject: 'Constitution', avgForgettingDays: 13, avgAccuracy: 0.65, sampleSize: 510, lastUpdated: '2026-06-01' },
  'Geography': { subject: 'Geography', avgForgettingDays: 5, avgAccuracy: 0.61, sampleSize: 340, lastUpdated: '2026-06-01' },
  'Science': { subject: 'Science', avgForgettingDays: 6, avgAccuracy: 0.68, sampleSize: 290, lastUpdated: '2026-06-01' },
  'Current Affairs': { subject: 'Current Affairs', avgForgettingDays: 3, avgAccuracy: 0.55, sampleSize: 650, lastUpdated: '2026-06-01' },
  'Quantitative Aptitude': { subject: 'Quantitative Aptitude', avgForgettingDays: 7, avgAccuracy: 0.52, sampleSize: 480, lastUpdated: '2026-06-01' },
  'Mental Ability': { subject: 'Mental Ability', avgForgettingDays: 9, avgAccuracy: 0.71, sampleSize: 310, lastUpdated: '2026-06-01' },
  'Malayalam': { subject: 'Malayalam', avgForgettingDays: 15, avgAccuracy: 0.82, sampleSize: 260, lastUpdated: '2026-06-01' },
};
