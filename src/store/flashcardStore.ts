import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashCard } from '../data/mockData';
import { generateFlashcardsFromNote, generateFlashcardsForSubject } from '../services/aiFlashcardGenerator';
import { generateMCQs } from '../services/aiMCQGenerator';
import { useKnowledgeStore } from './knowledgeStore';
import { useUserStore } from './userStore';
import { storeGeneratedFlashcardsBatch } from '../services/questionBankStorage';

interface FlashcardState {
  flashcards: FlashCard[];
  currentCardIndex: number;
  isFlipped: boolean;
  reviewMode: boolean;
  dueCards: FlashCard[];
  practiceCards: FlashCard[];
  practiceActive: boolean;
  loadDueCards: () => void;
  flipCard: () => void;
  rateCard: (quality: number) => void;
  getDueCount: () => number;
  getMasteredCount: () => number;
  addFlashcard: (card: FlashCard) => void;
  addFlashcards: (cards: FlashCard[]) => void;
  generateFromNotes: () => Promise<void>;
  totalCardCount: () => number;
  startPracticeSession: (config: {
    subjects?: string[];
    sourceType: 'chapter' | 'note' | 'paste';
    noteId?: string;
    pastedContent?: string;
    count: number;
  }) => Promise<void>;
  nextPracticeCard: () => void;
  endPracticeSession: () => void;
}

export function calculateNextReview(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: number
): { easeFactor: number; interval: number; repetitions: number } {
  let newEase = easeFactor;
  let newInterval = interval;
  const newReps = repetitions + 1;

  if (quality >= 3) {
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 3;
    else newInterval = Math.round(interval * easeFactor);

    newEase = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  } else {
    newInterval = 1;
    newEase = Math.max(1.3, easeFactor - 0.2);
  }

  return { easeFactor: newEase, interval: newInterval, repetitions: newReps };
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      flashcards: [],
      currentCardIndex: 0,
      isFlipped: false,
      reviewMode: false,
      dueCards: [],
      practiceCards: [],
      practiceActive: false,

      loadDueCards: () => {
        const now = new Date();
        const due = get().flashcards.filter((c) => !c.mastered && new Date(c.nextReviewDate) <= now);
        set({ dueCards: due.sort(() => Math.random() - 0.5), currentCardIndex: 0, isFlipped: false, reviewMode: true });
      },

      flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

      rateCard: (quality) => {
        const state = get();
        const card = state.dueCards[state.currentCardIndex];
        if (!card) return;

        const { easeFactor, interval, repetitions } = calculateNextReview(
          card.easeFactor,
          card.interval,
          card.repetitions,
          quality
        );

        const mastered = repetitions >= 3 && interval >= 15;
        const nextDate = new Date(Date.now() + interval * 86400000).toISOString();

        const updatedCards = state.flashcards.map((c) =>
          c.id === card.id
            ? { ...c, easeFactor, interval, repetitions, nextReviewDate: nextDate, mastered }
            : c
        );

        const updatedDue = state.dueCards.filter((_, i) => i !== state.currentCardIndex);
        set({
          flashcards: updatedCards,
          dueCards: updatedDue,
          currentCardIndex: state.currentCardIndex < updatedDue.length - 1 ? state.currentCardIndex : 0,
          isFlipped: false,
          reviewMode: updatedDue.length > 0,
        });
      },

      getDueCount: () => {
        const now = new Date();
        return get().flashcards.filter((c) => !c.mastered && new Date(c.nextReviewDate) <= now).length;
      },

      getMasteredCount: () => get().flashcards.filter((c) => c.mastered).length,

      addFlashcard: (card) => set((state) => ({ flashcards: [...state.flashcards, card] })),

      addFlashcards: (cards) => set((state) => {
        const existingIds = new Set(state.flashcards.map((c) => c.front));
        const newCards = cards.filter((c) => !existingIds.has(c.front));
        return { flashcards: [...state.flashcards, ...newCards] };
      }),

      generateFromNotes: async () => {
        const knowledgeStore = require('./knowledgeStore');
        const notes = knowledgeStore.useKnowledgeStore.getState().notes;
        const existingFronts = new Set(get().flashcards.map((c) => c.front));
        const newCards: FlashCard[] = [];
        for (const note of notes) {
          if (newCards.length >= 15) break;
          const cards = await generateFlashcardsFromNote(note, 3);
          for (const c of cards) {
            if (!existingFronts.has(c.front)) {
              newCards.push(c);
              existingFronts.add(c.front);
            }
          }
        }
        if (newCards.length > 0) {
          set((state) => ({ flashcards: [...state.flashcards, ...newCards] }));
        }
      },

      totalCardCount: () => get().flashcards.length,

      startPracticeSession: async (config) => {
        const { sourceType, noteId, pastedContent, count, subjects } = config;
        const newCards: FlashCard[] = [];

        if (sourceType === 'note' && noteId) {
          const note = useKnowledgeStore.getState().notes.find((n) => n.id === noteId);
          if (note && note.content && note.content.length >= 10) {
            const cards = await generateFlashcardsFromNote(note, count);
            newCards.push(...cards);
          }
        } else if (sourceType === 'paste' && pastedContent && pastedContent.length >= 10) {
          // Create a temporary note object for paste content
          const tempNote = {
            id: `temp_${Date.now()}`,
            title: 'Pasted Content',
            content: pastedContent,
            type: 'text' as const,
            subject: 'General',
            topicIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['General'],
          };
          const cards = await generateFlashcardsFromNote(tempNote, count);
          newCards.push(...cards);
        } else if (sourceType === 'chapter' && subjects && subjects.length > 0) {
          // Generate flashcards for the selected subject with batch retry logic
          const subject = subjects[0];
          const usedFronts = new Set<string>();

          // Try up to 3 batches to reach the requested count
          for (let batch = 0; batch < 3 && newCards.length < count; batch++) {
            const needed = (count - newCards.length) * 2;
            const cards = await generateFlashcardsForSubject(subject, Math.max(needed, 5));
            for (const c of cards) {
              if (!usedFronts.has(c.front)) {
                usedFronts.add(c.front);
                newCards.push(c);
                if (newCards.length >= count) break;
              }
            }
          }
        }

        // Fallback: if AI generated too few cards, use template MCQs as flashcards
        if (newCards.length < count && sourceType === 'chapter' && subjects && subjects.length > 0) {
          const mCtx = useUserStore.getState().locale;
          const need = count - newCards.length;
          const mcqs = generateMCQs({
            subjects, difficulty: 'easy', examType: 'LDC', count: need, language: mCtx,
          });
          const existingFronts = new Set(newCards.map(c => c.front));
          for (const q of mcqs) {
            if (!existingFronts.has(q.text)) {
              existingFronts.add(q.text);
              newCards.push({
                id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                front: q.text,
                back: q.explanation,
                subject: q.subject,
                topic: q.topic,
                difficulty: q.difficulty,
                easeFactor: 2.5,
                interval: 0,
                nextReviewDate: new Date().toISOString(),
                repetitions: 0,
                mastered: false,
              });
            }
          }
        }

        // Shuffle cards to avoid getting the same ones each time
        const shuffledCards = newCards.sort(() => Math.random() - 0.5);

        // Store generated flashcards in question bank (fire and forget)
        if (shuffledCards.length > 0) {
          const flashcardStorageRequests = shuffledCards.slice(0, count).map(card => ({
            front: card.front,
            back: card.back,
            subject: card.subject,
            topic: card.topic,
            subtopic: card.topic, // Using topic as subtopic for now
            difficulty: card.difficulty,
            sourceType: 'ai_generated' as const,
            sourceNoteId: noteId || undefined,
            tags: [],
            userId: undefined, // TODO: Get user ID from auth when available
          }));
          storeGeneratedFlashcardsBatch(flashcardStorageRequests).catch(err => {
            console.error('[QUESTION BANK] Failed to store flashcards:', err);
          });
        }

        // Always set practice state, even if no cards generated
        set({
          practiceCards: shuffledCards.slice(0, count),
          practiceActive: true,
          currentCardIndex: 0,
          isFlipped: false,
          reviewMode: false,
        });
      },

      nextPracticeCard: () => {
        const state = get();
        const nextIndex = state.currentCardIndex + 1;
        if (nextIndex < state.practiceCards.length) {
          set({
            currentCardIndex: nextIndex,
            isFlipped: false,
          });
        } else {
          // End of practice session - keep cards to show completion screen
          set({
            practiceActive: false,
            currentCardIndex: state.practiceCards.length, // Set to length to indicate completion
          });
        }
      },

      endPracticeSession: () => {
        set({
          practiceActive: false,
          practiceCards: [],
          currentCardIndex: 0,
          isFlipped: false,
        });
      },
    }),
    {
      name: 'lakshyam-flashcards',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ flashcards: state.flashcards }),
    }
  )
);
