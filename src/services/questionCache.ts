import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeneratedQuestion } from './aiMCQGenerator';

const STORAGE_KEY = '@question_cache_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

interface CacheEntry {
  key: string;
  question: GeneratedQuestion;
  generatedAt: number;
  accessCount: number;
}

class QuestionCache {
  private cache = new Map<string, CacheEntry>();
  private loaded = false;
  private loading: Promise<void> | null = null;

  async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) return this.loading;
    this.loading = this._load();
    await this.loading;
  }

  private async _load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries: CacheEntry[] = JSON.parse(raw);
      const now = Date.now();
      for (const entry of entries) {
        if (now - entry.generatedAt > CACHE_TTL_MS) continue;
        this.cache.set(entry.key, entry);
      }
    } catch { /* ignore corrupt cache */ }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    try {
      const entries = Array.from(this.cache.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch { /* ignore write failures */ }
  }

  cacheKey(
    subject: string,
    topic: string,
    difficulty: string,
    language?: string,
    focusInstruction?: string,
  ): string {
    const focusHash = focusInstruction ? focusInstruction.substring(0, 50) : '';
    return `${subject}|${topic}|${difficulty}|${language || 'en'}|${focusHash}`;
  }

  async get(
    subject: string,
    topic: string,
    difficulty: string,
    language?: string,
    focusInstruction?: string,
  ): Promise<GeneratedQuestion | null> {
    await this.load();
    const key = this.cacheKey(subject, topic, difficulty, language, focusInstruction);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.generatedAt > CACHE_TTL_MS) {
      this.cache.delete(key);
      await this.persist();
      return null;
    }
    entry.accessCount++;
    return entry.question;
  }

  async set(
    question: GeneratedQuestion,
    subject: string,
    topic: string,
    difficulty: string,
    language?: string,
    focusInstruction?: string,
  ): Promise<void> {
    await this.load();
    const key = this.cacheKey(subject, topic, difficulty, language, focusInstruction);
    this.cache.set(key, {
      key,
      question,
      generatedAt: Date.now(),
      accessCount: 0,
    });
    if (this.cache.size > MAX_ENTRIES) {
      this.evictLRU();
    }
    await this.persist();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  size(): number {
    return this.cache.size;
  }

  hitRatio(): { hits: number; misses: number; ratio: number } {
    let hits = 0;
    let misses = 0;
    for (const entry of this.cache.values()) {
      if (entry.accessCount > 0) hits++;
      else misses++;
    }
    const total = hits + misses;
    return { hits, misses, ratio: total > 0 ? hits / total : 0 };
  }

  private evictLRU(): void {
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount);
    const toEvict = sorted.slice(0, Math.ceil(MAX_ENTRIES * 0.2));
    for (const [key] of toEvict) {
      this.cache.delete(key);
    }
  }
}

export const questionCache = new QuestionCache();
