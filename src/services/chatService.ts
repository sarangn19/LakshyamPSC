import { usePerformanceStore } from '../store/performanceStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useUserStore } from '../store/userStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';

export type ResponseMode = 'tutor' | 'mcq' | 'simple_explanation' | 'pyq' | 'flashcard' | 'related_topic';

export type ChatMessage = {
  role: 'ai' | 'user';
  text: string;
  responseMode?: ResponseMode;
};

export function logRenderer(renderer: string) {
  if (__DEV__) {
    console.log(`[Renderer] ${renderer}`);
  }
}

export function buildHistory(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.text }));
}

export async function getAIResponse(
  userMessage: string,
  history: { role: string; content: string }[],
  responseMode?: ResponseMode,
): Promise<{ reply: string; responseMode: ResponseMode }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { reply: 'AI not configured.', responseMode: responseMode || 'tutor' };
  try {
    const perf = usePerformanceStore.getState();
    const twin = useCognitiveTwinStore.getState();
    const user = useUserStore.getState();
    const accuracy = perf.interactionSignals.length > 0
      ? Math.round(perf.interactionSignals.filter((s: any) => s.answeredCorrect).length / perf.interactionSignals.length * 100)
      : 0;
    const weakSubjects: string[] = (
      ['Malayalam', 'English', 'Science', 'Social Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Polity', 'Economics'] as string[]
    )
      .map((s) => ({ subject: s, acc: perf.getSubjectAccuracy(s) }))
      .filter((s: any) => s.acc.total > 0 && s.acc.correct / s.acc.total < 0.4)
      .map((s: any) => s.subject);
    const userContext = {
      currentAccuracy: accuracy,
      weakSubjects: weakSubjects.slice(0, 3),
      targetExam: (user.targetExams || ['LDC'])[0],
      totalQuestionsAnswered: perf.interactionSignals.length,
      openGaps: twin.gapRecords?.filter((g: any) => g.status !== 'closed').length || 0,
    };
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ message: userMessage, history, examType: 'LDC', userContext, responseMode }),
    });
    const data = await res.json();
    return { reply: data.reply || 'No response from AI.', responseMode: data.responseMode || responseMode || 'tutor' };
  } catch {
    return { reply: 'Network error. Please check your connection and try again.', responseMode: responseMode || 'tutor' };
  }
}
