import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@generation_queue_state';
const MIN_INTERVAL_MS = 3000;
const MAX_RETRIES = 2;
const MAX_QUEUE_SIZE = 50;

export type Priority = 'high' | 'low';

export interface QueueRequest<T> {
  id: string;
  priority: Priority;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  dedupKey?: string;
  signal?: AbortSignal;
  queuedAt: number;
  retries: number;
}

interface QueueState {
  pendingCount: number;
  lastRequestTime: number;
}

class GenerationQueue {
  private queue: Array<QueueRequest<unknown>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private pendingCount = 0;
  private dedupMap = new Map<string, Promise<unknown>>();
  private stateLoaded = false;

  async loadState(): Promise<void> {
    if (this.stateLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state: QueueState = JSON.parse(raw);
        this.lastRequestTime = state.lastRequestTime;
      }
    } catch { /* ignore */ }
    this.stateLoaded = true;
  }

  async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        pendingCount: this.pendingCount,
        lastRequestTime: this.lastRequestTime,
      }));
    } catch { /* ignore */ }
  }

  enqueue<T>(
    execute: () => Promise<T>,
    options?: {
      priority?: Priority;
      dedupKey?: string;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    if (options?.dedupKey && this.dedupMap.has(options.dedupKey)) {
      return this.dedupMap.get(options.dedupKey) as Promise<T>;
    }

    return new Promise<T>((resolve, reject) => {
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        const oldestLow = this.queue
          .map((r, i) => ({ r, i }))
          .filter((x) => x.r.priority === 'low')
          .sort((a, b) => a.r.queuedAt - b.r.queuedAt)[0];
        if (oldestLow) {
          oldestLow.r.reject(new Error('Queue full — dropped low-priority request'));
          this.queue.splice(oldestLow.i, 1);
        }
      }

      const request: QueueRequest<T> = {
        id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        priority: options?.priority ?? 'high',
        execute,
        resolve,
        reject,
        dedupKey: options?.dedupKey,
        signal: options?.signal,
        queuedAt: Date.now(),
        retries: 0,
      };

      const promise = new Promise<T>((res, rej) => {
        const origResolve = request.resolve;
        const origReject = request.reject;
        request.resolve = (val) => {
          if (request.dedupKey) this.dedupMap.delete(request.dedupKey);
          origResolve(val);
          res(val);
        };
        request.reject = (err) => {
          if (request.dedupKey) this.dedupMap.delete(request.dedupKey);
          origReject(err);
          rej(err);
        };
      });

      if (options?.dedupKey) {
        this.dedupMap.set(options.dedupKey, promise);
      }

      this.queue.push(request as QueueRequest<unknown>);
      this.pendingCount = this.queue.length;
      this.saveState();
      this.processQueue();
    });
  }

  cancel(dedupKey: string): void {
    const idx = this.queue.findIndex((r) => r.dedupKey === dedupKey);
    if (idx >= 0) {
      this.queue[idx].reject(new Error('Cancelled'));
      this.queue.splice(idx, 1);
      this.pendingCount = this.queue.length;
      this.saveState();
    }
    this.dedupMap.delete(dedupKey);
  }

  cancelAll(): void {
    for (const req of this.queue) {
      req.reject(new Error('Cancelled — queue reset'));
    }
    this.queue = [];
    this.pendingCount = 0;
    this.dedupMap.clear();
    this.saveState();
  }

  get pending(): number {
    return this.pendingCount;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (elapsed < MIN_INTERVAL_MS) {
        await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
      }

      const request = this.dequeueHighestPriority();
      if (!request) {
        this.processing = false;
        return;
      }
      if (request.signal?.aborted) {
        request.reject(new Error('Cancelled'));
        continue;
      }

      this.lastRequestTime = Date.now();
      await this.saveState();

      try {
        const value = await request.execute();
        request.resolve(value);
      } catch (err) {
        if (request.retries < MAX_RETRIES && !isFatalError(err)) {
          request.retries++;
          request.priority = 'high';
          this.queue.unshift(request);
        } else {
          request.reject(err);
        }
      }
    }

    this.pendingCount = 0;
    this.processing = false;
    await this.saveState();
  }

  private dequeueHighestPriority(): QueueRequest<unknown> | undefined {
    const highIdx = this.queue.findIndex((r) => r.priority === 'high');
    if (highIdx >= 0) return this.queue.splice(highIdx, 1)[0];
    return this.queue.shift();
  }
}

function isFatalError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('invalid') || msg.includes('not configured') ||
      msg.includes('400') || msg.includes('401') || msg.includes('403') ||
      msg.includes('413') || msg.includes('500') || msg.includes('502') ||
      msg.includes('503') || msg.includes('504');
  }
  return false;
}

export const generationQueue = new GenerationQueue();
