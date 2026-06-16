import { UserProfile, ConfusionPair } from '../store/performanceStore';
import { generateMCQs, GeneratedQuestion, GenerationRequest } from './aiMCQGenerator';
import { EXAM_DIFFICULTY } from '../data/questions';

export interface ProfileAwareRequest {
  profile: UserProfile | null;
  subject?: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  examType?: string;
  avoidQuestionIds?: string[];
}

export interface ProfileAwareResult {
  questions: GeneratedQuestion[];
  source: 'profile' | 'fallback';
}

function pickDifficulty(examType: string, preference?: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
  if (preference) return preference;
  const allowed = EXAM_DIFFICULTY[examType] || ['easy', 'medium'];
  const chosen = allowed[Math.floor(Math.random() * allowed.length)] as 'easy' | 'medium' | 'hard';
  return chosen;
}

function subjectsFromProfile(profile: UserProfile | null, requestedSubject?: string): string[] | undefined {
  if (requestedSubject) return [requestedSubject];
  if (!profile) return undefined;
  if (profile.weakSubjects.length > 0) return profile.weakSubjects;
  return undefined;
}

function confusionTopicsToAvoid(pairs: ConfusionPair[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const pair of pairs) {
    if (!seen.has(pair.topicA)) { seen.add(pair.topicA); result.push(pair.topicA); }
    if (!seen.has(pair.topicB)) { seen.add(pair.topicB); result.push(pair.topicB); }
  }
  return result;
}

export function generateProfileAwareMCQs(request: ProfileAwareRequest): ProfileAwareResult {
  const { profile, subject, count, difficulty, avoidQuestionIds } = request;
  const examType = request.examType || (profile?.targetPost) || 'LDC';

  const subjects = subjectsFromProfile(profile, subject);
  const resolvedDifficulty = pickDifficulty(examType, difficulty);

  const genRequest: GenerationRequest = {
    subjects,
    difficulty: resolvedDifficulty,
    examType,
    count,
    avoidQuestionIds,
  };

  const questions = generateMCQs(genRequest);

  if (questions.length === 0) {
    const fallback = generateMCQs({
      difficulty: 'easy',
      examType,
      count,
      avoidQuestionIds,
    });
    return { questions: fallback, source: 'fallback' };
  }

  return { questions: questions.slice(0, count), source: 'profile' };
}

export function getExamFocusInstructions(profile: UserProfile): string {
  const lines: string[] = [
    `Target: ${profile.targetPost}`,
    `Days remaining: ${profile.daysToExam}`,
  ];

  if (profile.weakSubjects.length > 0) {
    lines.push(`Weak areas: ${profile.weakSubjects.join(', ')}`);
  }
  if (profile.confusionPairs.length > 0) {
    lines.push('Confusion pairs to avoid in same session:');
    for (const pair of profile.confusionPairs.slice(0, 3)) {
      lines.push(`  ${pair.topicA} vs ${pair.topicB} (confused ${pair.frequency}x)`);
    }
  }
  if (profile.hesitationTopics.length > 0) {
    lines.push(`Hesitation topics: ${profile.hesitationTopics.slice(0, 3).join(', ')}`);
  }

  return lines.join('\n');
}
