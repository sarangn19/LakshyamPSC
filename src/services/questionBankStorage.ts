interface StoreMCQRequest {
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examType: string;
  language?: 'en' | 'ml';
  sourceType?: 'ai_generated' | 'user_created' | 'admin_uploaded';
  sourceNoteId?: string;
  tags?: string[];
  userId?: string;
}

interface StoreFlashcardRequest {
  front: string;
  back: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceType?: 'ai_generated' | 'user_created' | 'admin_uploaded';
  sourceNoteId?: string;
  tags?: string[];
  userId?: string;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export async function storeGeneratedMCQ(request: StoreMCQRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/store-mcq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to store MCQ:', data.error);
      return { success: false, error: data.error || 'Failed to store MCQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error storing MCQ:', error);
    return { success: false, error: 'Network error while storing MCQ' };
  }
}

export async function storeGeneratedFlashcard(request: StoreFlashcardRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/store-flashcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to store flashcard:', data.error);
      return { success: false, error: data.error || 'Failed to store flashcard' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error storing flashcard:', error);
    return { success: false, error: 'Network error while storing flashcard' };
  }
}

export async function storeGeneratedMCQsBatch(requests: StoreMCQRequest[]): Promise<{ success: boolean; stored: number; failed: number }> {
  let stored = 0;
  let failed = 0;

  for (const request of requests) {
    const result = await storeGeneratedMCQ(request);
    if (result.success) {
      stored++;
    } else {
      failed++;
    }
  }

  return { success: stored > 0, stored, failed };
}

export async function storeGeneratedFlashcardsBatch(requests: StoreFlashcardRequest[]): Promise<{ success: boolean; stored: number; failed: number }> {
  let stored = 0;
  let failed = 0;

  for (const request of requests) {
    const result = await storeGeneratedFlashcard(request);
    if (result.success) {
      stored++;
    } else {
      failed++;
    }
  }

  return { success: stored > 0, stored, failed };
}

export interface BatchUploadResult {
  success: boolean;
  total: number;
  stored: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export async function storeGeneratedMCQsBatchDirect(
  requests: StoreMCQRequest[],
  onProgress?: (stored: number, failed: number, total: number) => void,
): Promise<BatchUploadResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/store-mcq-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        questions: requests.map((r) => ({
          questionText: r.questionText,
          options: r.options,
          correctAnswer: r.correctAnswer,
          explanation: r.explanation || '',
          subject: r.subject,
          topic: r.topic,
          subtopic: r.subtopic || '',
          difficulty: r.difficulty,
          examType: r.examType,
          language: r.language || 'en',
          sourceType: r.sourceType || 'admin_uploaded',
          tags: r.tags || [],
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, total: requests.length, stored: 0, failed: requests.length, errors: [{ index: -1, error: data.error || 'Batch upload failed' }] };
    }
    if (onProgress) onProgress(data.stored, data.failed, data.total);
    return data;
  } catch {
    // Fallback: send one-by-one via store-mcq if batch endpoint unavailable
    let stored = 0;
    let failed = 0;
    const errors: { index: number; error: string }[] = [];
    for (let i = 0; i < requests.length; i++) {
      const result = await storeGeneratedMCQ(requests[i]);
      if (result.success) stored++;
      else { failed++; errors.push({ index: i, error: result.error || 'Unknown error' }); }
      if (onProgress) onProgress(stored, failed, requests.length);
    }
    return { success: stored > 0, total: requests.length, stored, failed, errors };
  }
}
