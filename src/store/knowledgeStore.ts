import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../data/mockData';

interface KnowledgeState {
  notes: Note[];
  selectedSubject: string;
  searchQuery: string;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  setSelectedSubject: (subject: string) => void;
  setSearchQuery: (query: string) => void;
  getNotesBySubject: (subject: string) => Note[];
  getLinkedNotes: (topicId: string) => Note[];
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      notes: [],
      selectedSubject: '',
      searchQuery: '',
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      getNotesBySubject: (subject) => get().notes.filter((n) => n.subject === subject),
      getLinkedNotes: (topicId) => get().notes.filter((n) => n.topicIds.includes(topicId)),
    }),
    {
      name: 'lakshyam-knowledge',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
