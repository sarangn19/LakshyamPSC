import { Note, FlashCard } from '../data/mockData';
import { generateAIQuestion } from './aiQuestionGenerator';
import { syllabus } from '../data/syllabus';

interface FlashcardRequest {
  note?: Note;
  subject?: string;
  topic?: string;
  count: number;
}

function makeCard(front: string, back: string, subject: string, topic: string): FlashCard {
  return {
    id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    front,
    back,
    subject,
    topic,
    difficulty: front.length < 40 && back.length < 60 ? 'easy' : front.length < 70 ? 'medium' : 'hard',
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: new Date().toISOString(),
    repetitions: 0,
    mastered: false,
  };
}

async function generateAIFlashcard(subject: string, topic: string, content?: string, variation?: string): Promise<{ front: string; back: string } | null> {
  try {
    let focusInstruction = content ? `CONTENT-BASED: ${content.substring(0, 2000)}` : undefined;
    
    // Add variation instruction to prevent duplicates
    if (focusInstruction) {
      const randomVariation = variation || (Math.random() > 0.5 ? 'Focus on a DIFFERENT aspect than usual' : 'Pick a less obvious detail');
      focusInstruction += `\nVARIATION INSTRUCTION: ${randomVariation}. Each time you generate a question, pick a DIFFERENT fact, concept, person, or date from the content. Do NOT repeat the same question topic.`;
    } else {
      // For chapter-based generation without content, add variation to pick different topics
      const randomVariation = variation || (Math.random() > 0.5 ? 'Focus on a different subtopic within this subject' : 'Pick a less commonly known fact');
      focusInstruction = `VARIATION INSTRUCTION: ${randomVariation}. Generate a question about a DIFFERENT aspect of this subject than previous questions.`;
    }

    const aiResult = await generateAIQuestion({
      subject,
      topic,
      difficulty: 'medium',
      examType: 'LDC',
      language: 'en',
      focusInstruction,
    });

    if (aiResult.question) {
      const q = aiResult.question;
      return {
        front: q.text,
        back: q.explanation,
      };
    }
  } catch (error) {
    console.error('[AI FLASHCARD] Error generating flashcard:', error);
  }
  return null;
}

export async function generateFlashcards(request: FlashcardRequest): Promise<FlashCard[]> {
  const results: FlashCard[] = [];
  const subject = request.subject || request.note?.subject || 'Kerala History';
  const subjectTopics = syllabus.find(s => s.name === subject)?.topics;
  const topic = request.topic || request.note?.tags[0] || subjectTopics?.[0]?.name || 'General';
  const content = request.note?.content;

  // Track used question texts to prevent duplicates
  const usedQuestions = new Set<string>();

  // Generate flashcards using AI with different variations for each card
  const variations = [
    'Focus on a PERSON or LEADER related to this subject',
    'Focus on a DATE or TIME PERIOD',
    'Focus on a PLACE or LOCATION',
    'Focus on an EVENT or MOVEMENT',
    'Focus on a CONCEPT or IDEA',
    'Focus on a CAUSE or EFFECT',
    'Focus on a COMPARISON or CONTRAST',
    'Focus on a DEFINITION or MEANING',
    'Focus on an ACHIEVEMENT or CONTRIBUTION',
    'Focus on a CHALLENGE or PROBLEM',
  ];

  let attempts = 0;
  const maxAttempts = request.count * 3; // Allow more attempts to get unique cards

  while (results.length < request.count && attempts < maxAttempts) {
    const variation = variations[attempts % variations.length];
    const card = await generateAIFlashcard(subject, topic, content, variation);

    if (card) {
      // Create a normalized key for deduplication (lowercase, remove extra spaces)
      const questionKey = card.front.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (!usedQuestions.has(questionKey)) {
        usedQuestions.add(questionKey);
        results.push(makeCard(card.front, card.back, subject, topic));
      }
    }

    attempts++;
  }

  return results;
}

export async function generateFlashcardsFromNote(note: Note, count: number = 5): Promise<FlashCard[]> {
  return generateFlashcards({ note, count });
}

export async function generateFlashcardsForSubject(subject: string, count: number = 10): Promise<FlashCard[]> {
  return generateFlashcards({ subject, count });
}
