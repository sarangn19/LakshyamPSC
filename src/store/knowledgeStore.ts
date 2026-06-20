import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../data/mockData';
import { saveNote, removeNote as removeNoteFromSync, fetchNotes } from '../services/dataSync';

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
  loadNotes: () => Promise<void>;
}

function mergeNotes(local: Note[], remote: Note[]): Note[] {
  const map = new Map<string, Note>();
  for (const n of local) map.set(n.id, n);
  for (const n of remote) {
    const existing = map.get(n.id);
    if (!existing || n.updatedAt > existing.updatedAt) {
      map.set(n.id, n);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      notes: [],
      selectedSubject: '',
      searchQuery: '',
      addNote: (note) => {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
        const stored = { ...note, id: uuid };
        set((state) => ({ notes: [stored, ...state.notes] }));
        saveNote(stored);
      },
      removeNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
        removeNoteFromSync(id);
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }));
        const note = get().notes.find((n) => n.id === id);
        if (note) saveNote(note);
      },
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      getNotesBySubject: (subject) => get().notes.filter((n) => n.subject === subject),
      getLinkedNotes: (topicId) => get().notes.filter((n) => n.topicIds.includes(topicId)),
      loadNotes: async () => {
        const remote = await fetchNotes();
        const local = get().notes;
        if (remote.length === 0) return;
        const merged = mergeNotes(local, remote);
        set({ notes: merged });
        const remoteIds = new Set(remote.map((n) => n.id));
        for (const n of local) {
          if (!remoteIds.has(n.id)) {
            saveNote(n);
          }
        }
      },
    }),
    {
      name: 'lakshyam-knowledge',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
