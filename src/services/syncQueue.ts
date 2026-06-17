import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueueItem {
  id: string;
  operation: 'upsert' | 'insert' | 'update';
  table: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
  entityId?: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
  lastError?: string;
}

interface SyncQueueState {
  queue: QueueItem[];
  processing: boolean;
  enqueue: (item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>) => void;
  dequeue: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  markRetry: (id: string) => void;
  clearProcessed: () => void;
  pendingCount: () => number;
}

export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      processing: false,

      enqueue: (item) => {
        const id = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...item,
              id,
              timestamp: Date.now(),
              retries: 0,
            },
          ],
        }));
      },

      dequeue: (id) => {
        set((state) => ({
          queue: state.queue.filter((q) => q.id !== id),
        }));
      },

      markFailed: (id, error) => {
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id
              ? { ...q, retries: q.retries + 1, lastError: error, maxRetries: q.maxRetries }
              : q
          ),
        }));
      },

      markRetry: (id) => {
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, retries: q.retries + 1 } : q
          ),
        }));
      },

      clearProcessed: () => {
        set((state) => ({
          queue: state.queue.filter(
            (q) => q.retries >= q.maxRetries
          ),
        }));
      },

      pendingCount: () => get().queue.filter((q) => q.retries < q.maxRetries).length,
    }),
    {
      name: 'lakshyam-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ queue: state.queue }),
    }
  )
);
