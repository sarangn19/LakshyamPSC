import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashCard } from '../data/mockData';
import { generateFlashcardsFromNote } from '../services/aiFlashcardGenerator';

interface FlashcardState {
  flashcards: FlashCard[];
  currentCardIndex: number;
  isFlipped: boolean;
  reviewMode: boolean;
  dueCards: FlashCard[];
  loadDueCards: () => void;
  flipCard: () => void;
  rateCard: (quality: number) => void;
  getDueCount: () => number;
  getMasteredCount: () => number;
  addFlashcard: (card: FlashCard) => void;
  addFlashcards: (cards: FlashCard[]) => void;
  generateFromNotes: () => void;
  totalCardCount: () => number;
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

      generateFromNotes: () => {
        const knowledgeStore = require('./knowledgeStore');
        const notes = knowledgeStore.useKnowledgeStore.getState().notes;
        const existingFronts = new Set(get().flashcards.map((c) => c.front));
        const newCards: FlashCard[] = [];
        for (const note of notes) {
          if (newCards.length >= 15) break;
          const cards = generateFlashcardsFromNote(note, 3);
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
    }),
    {
      name: 'lakshyam-flashcards',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ flashcards: state.flashcards }),
    }
  )
);
