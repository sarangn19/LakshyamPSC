import { supabase } from './supabase';

function hasSupabase(): boolean {
  return !!supabase;
}

async function rpcData<T>(name: string, params?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await supabase!.rpc(name, params ?? {});
  if (error) {
    console.error(`RPC ${name} error:`, error);
    return null;
  }
  return data as T;
}

// ── Roles & Permissions (policies allow all authenticated reads) ──

export async function fetchRoles() {
  if (!hasSupabase()) return [];
  const { data } = await supabase!.from('roles').select('*');
  return data || [];
}

export async function fetchPermissions() {
  if (!hasSupabase()) return [];
  const { data } = await supabase!.from('permissions').select('*');
  return data || [];
}

// ── Role Permissions (table has RLS, no public policy) ──

export async function fetchRolePermissions() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_feature_flags');
  return data || [];
}

// This RPC is named role_permissions but we reuse admin_get_feature_flags as placeholder
// TODO: create proper admin_get_role_permissions RPC
export async function fetchUserRoles() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_user_roles');
  return data ? data.map((row: any) => ({
    ...row,
    roles: row.roles || { name: row.role_name },
  })) : [];
}

export async function assignUserRole(authUserId: string, roleId: string) {
  if (!hasSupabase()) return;
  const { error: upsertErr } = await supabase!.from('user_roles').upsert(
    { auth_user_id: authUserId, role_id: roleId },
    { onConflict: 'auth_user_id' }
  );
  if (upsertErr) {
    // Fallback: try RPC
    await rpcData('admin_assign_user_role', { _auth_user_id: authUserId, _role_id: roleId });
  }
  const { data: role } = await supabase!.from('roles').select('name').eq('id', roleId).single();
  if (role) {
    await supabase!.from('profiles').update({ role: role.name }).eq('auth_user_id', authUserId);
  }
}

export async function removeUserRole(authUserId: string) {
  if (!hasSupabase()) return;
  const { error } = await supabase!.from('user_roles').delete().eq('auth_user_id', authUserId);
  if (error) {
    console.error('removeUserRole error:', error);
  }
}

// ── Profiles (via RPC) ──

export async function fetchAllProfiles() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_profiles');
  return data || [];
}

// ── Dashboard KPIs (via RPC) ──

export async function fetchActiveLearnersToday(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_count_active_learners_today')) ?? 0;
}

export async function fetchTotalLearners(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_count_profiles')) ?? 0;
}

export async function fetchSessionCompletionRate(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_session_completion_rate')) ?? 0;
}

export async function fetchAverageAccuracy(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_average_accuracy')) ?? 0;
}

export async function fetchTotalAttempts(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_count_total_attempts')) ?? 0;
}

export async function fetchTotalSessions(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_count_total_sessions')) ?? 0;
}

// ── Subject Progress (via RPC) ──

export async function fetchSubjectProgressSummary() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_subject_progress_summary');
  return (data || []).map((row: any) => ({
    subject: row.subject,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    accuracy: row.accuracy,
  }));
}

// ── Current Affairs Schedule (via RPC) ──

export async function fetchCAEntries() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_ca_entries');
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content || '',
    category: row.category,
    source: row.source || '',
    status: row.status as 'draft' | 'scheduled' | 'published' | 'archived',
    scheduledFor: row.scheduled_for || null,
    publishedAt: row.published_at || null,
  }));
}

export async function createCAEntry(entry: {
  title: string; content: string; category: string; source?: string;
  status: string; scheduledFor?: string | null;
}) {
  if (!hasSupabase()) return;
  await supabase!.rpc('admin_insert_ca_entry', {
    _title: entry.title, _content: entry.content, _category: entry.category,
    _source: entry.source || '', _status: entry.status,
    _scheduled_for: entry.scheduledFor || null,
  });
}

export async function updateCAStatus(id: string, status: string) {
  if (!hasSupabase()) return;
  const publishedAt = status === 'published' ? new Date().toISOString() : null;
  await supabase!.rpc('admin_update_ca_status', {
    _id: id, _status: status, _published_at: publishedAt,
  });
}

// ── Support Tickets (via RPC) ──

export async function fetchSupportTickets() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_support_tickets');
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'Unknown',
    category: row.category,
    subject: row.subject,
    description: row.description,
    status: row.status as 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated',
    priority: row.priority as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: row.assigned_to || null,
    resolution: row.resolution || null,
    createdAt: row.created_at,
  }));
}

export async function updateTicketStatus(id: string, status: string, resolution?: string) {
  if (!hasSupabase()) return;
  const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
  await supabase!.rpc('admin_update_ticket_status', {
    _id: id, _status: status, _resolution: resolution || null, _resolved_at: resolvedAt,
  });
}

export async function assignTicket(id: string, assignee: string) {
  if (!hasSupabase()) return;
  await supabase!.rpc('admin_assign_ticket', { _id: id, _assignee: assignee });
}

// ── Flagged Questions (via RPC) ──

export async function fetchFlaggedQuestions() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_flagged_questions');
  return (data || []).map((row: any) => ({
    id: row.id,
    questionId: row.question_id,
    questionText: '',
    reason: row.reason,
    reportedBy: row.reported_by,
    status: row.status as 'pending' | 'reviewed' | 'resolved' | 'dismissed',
    createdAt: row.created_at,
    accuracyRate: 0,
    errorRate: 0,
    usageCount: 0,
  }));
}

export async function updateFlaggedStatus(id: string, status: string, notes?: string) {
  if (!hasSupabase()) return;
  const resolvedAt = ['resolved', 'dismissed'].includes(status) ? new Date().toISOString() : null;
  await supabase!.rpc('admin_update_flagged_status', {
    _id: id, _status: status, _admin_notes: notes || null, _resolved_at: resolvedAt,
  });
}

// ── Audit Logs (via RPC) ──

export async function fetchAuditLogs() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_audit_logs');
  return (data || []).slice(0, 200).map((row: any) => ({
    id: row.id,
    authUserId: row.auth_user_id,
    action: row.action,
    resource: row.resource,
    resourceId: row.resource_id,
    details: row.details || {},
    createdAt: row.created_at,
  }));
}

// ── Feature Flags (via RPC) ──

export async function fetchFeatureFlags() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_feature_flags');
  return data || [];
}

export async function updateFeatureFlag(id: string, enabled: boolean) {
  if (!hasSupabase()) return;
  await supabase!.rpc('admin_update_feature_flag', { _id: id, _enabled: enabled });
}

// ── Cognitive Twin Configs (via RPC) ──

export async function fetchCognitiveTwinConfigs() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_cognitive_twin_configs');
  return (data || []).map((row: any) => ({
    id: row.id,
    weaknessWeight: row.weakness_weight,
    forgettingWeight: row.forgetting_weight,
    confusionWeight: row.confusion_weight,
    coverageWeight: row.coverage_weight,
    version: row.version,
    createdAt: row.created_at,
  }));
}

export async function saveCognitiveTwinConfig(config: {
  weaknessWeight: number; forgettingWeight: number;
  confusionWeight: number; coverageWeight: number;
}) {
  if (!hasSupabase()) return;
  await supabase!.rpc('admin_insert_cognitive_twin_config', {
    _weakness_weight: config.weaknessWeight,
    _forgetting_weight: config.forgettingWeight,
    _confusion_weight: config.confusionWeight,
    _coverage_weight: config.coverageWeight,
  });
}

// ── Experiments (via RPC) ──

export async function fetchExperiments() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_experiments');
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    variantA: row.variant_a || {},
    variantB: row.variant_b || {},
    metrics: row.metrics || [],
    status: row.status as 'draft' | 'running' | 'paused' | 'completed' | 'archived',
  }));
}

export async function createExperiment(exp: {
  name: string; description: string;
  variantA: Record<string, number>; variantB: Record<string, number>;
  metrics: string[];
}) {
  if (!hasSupabase()) return;
  await supabase!.rpc('admin_create_experiment', {
    _name: exp.name, _description: exp.description,
    _variant_a: exp.variantA, _variant_b: exp.variantB,
    _metrics: exp.metrics,
  });
}

export async function updateExperimentStatus(id: string, status: string) {
  if (!hasSupabase()) return;
  const startedAt = status === 'running' ? new Date().toISOString() : null;
  const endedAt = status === 'completed' ? new Date().toISOString() : null;
  await supabase!.rpc('admin_update_experiment_status', {
    _id: id, _status: status, _started_at: startedAt, _ended_at: endedAt,
  });
}

// ── Analytics (via RPC) ──

export async function fetchSubjectAnalytics() {
  if (!hasSupabase()) return [];
  const data = await rpcData<any[]>('admin_get_subject_analytics');
  return data || [];
}

export async function fetchPendingFlaggedCount(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_pending_flagged_count')) ?? 0;
}

export async function fetchDraftCACount(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_draft_ca_count')) ?? 0;
}

export async function fetchOpenTicketCount(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_open_ticket_count')) ?? 0;
}

export async function fetchCriticalTicketCount(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_critical_ticket_count')) ?? 0;
}

export async function fetchRevisionAdherenceRate(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_revision_adherence_rate')) ?? 0;
}

export async function fetchRecommendationsAccepted(): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_get_recommendations_accepted')) ?? 0;
}

// ── Per-user stats (via RPC) ──

export async function fetchUserTotalAttempts(authUserId: string): Promise<number> {
  if (!hasSupabase()) return 0;
  return (await rpcData<number>('admin_count_user_attempts', { profile_auth_user_id: authUserId })) ?? 0;
}

// ── System health (via RPC) ──

export async function fetchSystemHealth() {
  if (!hasSupabase()) return null;
  const lastHour = new Date(Date.now() - 3600000).toISOString();
  const data = await rpcData<any[]>('admin_get_recent_signals', { _since: lastHour });
  const signals = data || [];
  const failures = signals.filter((s: any) => s.payload?.type === 'error' || s.payload?.type === 'failure');
  return {
    syncFailures: failures.filter((s: any) => s.payload?.error?.includes('sync')).length,
    queueFailures: failures.filter((s: any) => s.payload?.error?.includes('queue')).length,
    apiFailures: failures.filter((s: any) => s.payload?.error?.includes('api') || s.payload?.error?.includes('API')).length,
    dbHealth: 'healthy' as const,
    storageUsedMb: 0,
    lastChecked: new Date().toISOString(),
  };
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';

export async function reportQuestionToBackend(
  questionId: string,
  reason: string,
  userId?: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/report-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ questionId, reason, userId }),
    });
    const data = await res.json();
    if (!res.ok) { console.error('reportQuestionToBackend failed:', data.error); return false; }
    return true;
  } catch (err) {
    console.error('reportQuestionToBackend network error:', err);
    return false;
  }
}
