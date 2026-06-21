import { supabase } from '../supabase';
import { useSyncQueue } from '../syncQueue';

let _profileId: string | null = null;

export function setProfileId(id: string | null): void {
  _profileId = id;
}

export function getProfileId(): string | null {
  return _profileId;
}

export function now(): string {
  return new Date().toISOString();
}

export function isOnline(): boolean {
  return supabase !== null;
}

export function offlineEnqueue(
  operation: 'upsert' | 'insert' | 'update',
  table: string,
  data: Record<string, unknown>,
): void {
  const idempotencyKey = `${operation}_${table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  useSyncQueue.getState().enqueue({
    operation,
    table,
    data,
    idempotencyKey,
    maxRetries: 5,
  });
}
