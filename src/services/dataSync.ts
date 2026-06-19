import { supabase } from './supabase';
import type { Note } from '../data/mockData';

interface ProfileData {
  auth_user_id: string;
  user_name: string;
  target_exams: string[];
  primary_exam: string;
  exam_date: string;
  daily_target_mcqs: number;
  daily_target_flashcards: number;
  setup_complete: boolean;
  updated_at: string;
}

function noteToRow(note: Note, profileId: string) {
  return {
    id: note.id,
    profile_id: profileId,
    title: note.title,
    content: note.content,
    subject: note.subject,
    tags: note.tags,
    note_type: note.type === 'ocr' ? 'scan' : note.type,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

export function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    type: row.note_type === 'scan' ? 'ocr' : (row.note_type || 'text'),
    subject: row.subject || 'General',
    topicIds: [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    tags: row.tags || [],
  };
}

export async function getProfileId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
  return data?.id || null;
}

// ── User Profile ──

export async function saveUserProfile(data: ProfileData): Promise<void> {
  if (!supabase) return;
  const payload = { ...data };
  if (!payload.exam_date) {
    payload.exam_date = null as any;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.exam_date)) {
    try {
      payload.exam_date = new Date(payload.exam_date).toISOString().split('T')[0];
    } catch {
      payload.exam_date = null as any;
    }
  }
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'auth_user_id' });
  if (error) console.warn('[DataSync] saveUserProfile failed:', error.message);
}

export async function fetchUserProfile(userId: string): Promise<Record<string, any> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('auth_user_id', userId).maybeSingle();
  if (error || !data) return null;
  return data;
}

// ── Notes ──

export async function saveNote(note: Note): Promise<void> {
  if (!supabase) return;
  const profileId = await getProfileId();
  if (!profileId) return;
  const { error } = await supabase.from('notes').upsert(noteToRow(note, profileId), { onConflict: 'id' });
  if (error) console.warn('[DataSync] saveNote failed:', error.message);
}

export async function removeNote(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) console.warn('[DataSync] removeNote failed:', error.message);
}

export async function fetchNotes(): Promise<Note[]> {
  if (!supabase) return [];
  const profileId = await getProfileId();
  if (!profileId) return [];
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToNote);
}
