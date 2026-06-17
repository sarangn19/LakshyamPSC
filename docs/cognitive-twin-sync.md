# Cognitive Twin — Synchronization Architecture

## Overview

The Cognitive Twin is Lakshyam's persistent learner model. This document describes how it survives app reinstalls, device changes, and long-term usage through Supabase-backed synchronization.

---

## 1. Files Modified/Created

| File | Purpose |
|------|---------|
| `supabase/migrations/00002_cognitive_twin_tables.sql` | New tables: `recommendations`, `session_outcomes`, `sync_log` + `cognitive_profile` column on `profiles` |
| `src/services/syncService.ts` | Core sync orchestration for all entity types |
| `src/services/syncQueue.ts` | Zustand-persisted offline queue with retry logic |
| `src/services/syncSubscriptions.ts` | React hooks that watch store changes and trigger sync |
| `App.tsx` | Wires `restoreFromRemote()` on startup + sync hooks |

---

## 2. Supabase Queries Implemented

### Profile
- `SELECT profiles.id, cognitive_profile, updated_at WHERE auth_user_id = ?`
- `UPDATE profiles SET cognitive_profile = ?, last_synced_at = ? WHERE id = ?`

### Session Outcomes
- `UPSERT session_outcomes ON CONFLICT (profile_id, session_id)`
- `SELECT * FROM session_outcomes WHERE profile_id = ? AND end_time >= ? ORDER BY end_time DESC`

### Recommendations
- `UPSERT recommendations ON CONFLICT (profile_id, recommendation_id)`
- `UPDATE recommendations SET status = ?, responded_at = ? WHERE profile_id = ? AND recommendation_id = ?`
- `SELECT * FROM recommendations WHERE profile_id = ? ORDER BY generated_at DESC LIMIT ?`

### Interaction Signals (batch)
- `INSERT INTO interaction_signals (profile_id, signal_type, payload, created_at) VALUES (?)` (batch of rows)

---

## 3. Synchronization Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Zustand    │────▶│ syncSubscriptions│────▶│  syncService │
│  Stores     │     │ (React hooks)    │     │              │
│             │     │                  │     │  ┌─────────┐ │
│ performance │     │ • watches store  │     │  │ Profile │ │
│ user        │     │   mutations      │     │  ├─────────┤ │
│ mcq         │     │ • debounces      │     │  │ Signals │ │
│ flashcard   │     │ • batches        │     │  │ (batch) │ │
└─────────────┘     └──────────────────┘     │  ├─────────┤ │
                                             │  │Session  │ │
                    ┌──────────────┐         │  │Outcomes │ │
                    │  syncQueue   │◀────────│  ├─────────┤ │
                    │ (offline)    │         │  │  Recs   │ │
                    │              │         │  └─────────┘ │
                    │ • persists   │         │              │
                    │ • retries ×5 │         │  ┌─────────┐ │
                    │ • dedup by   │         │  │Queue    │ │
                    │   idempotency│         │  │Flush    │ │
                    └──────┬───────┘         └──────┬───────┘
                           │                        │
                           └──────────┬─────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │     Supabase         │
                           │  (PostgreSQL + RLS)  │
                           └─────────────────────┘
```

### Flow
1. **Mutations** → Zustand store updates local state (sync, offline-safe)
2. **Subscription hooks** detect changes → fire async sync calls
3. **Sync service** attempts remote write; if offline → enqueues to `syncQueue`
4. **Periodic flush** processes the queue FIFO with idempotency dedup
5. **Startup recovery** pulls profile + sessions + recs from remote

---

## 4. Error Handling Strategy

| Scenario | Behaviour |
|----------|-----------|
| Network unavailable | Writes queued in AsyncStorage; retried on next flush |
| Supabase returns 4xx | Item marked as failed; logged to console; not retried |
| Supabase returns 5xx/timeout | Retried up to 5× with exponential backoff via `syncQueue` |
| Partial batch failure | Whole batch re-queued (simplicity over partial recovery) |
| Missing profile ID | Sync silently skipped until `setProfileId()` is called |
| Startup restore fails | Logged; app continues with local state only |

---

## 5. Offline Queue Strategy

- **Storage**: Zustand + AsyncStorage (`lakshyam-sync-queue`)
- **Structure**: `{ id, operation, table, data, idempotencyKey, retries, maxRetries }`
- **Flush trigger**: 30-second interval + manual calls
- **Max retries**: 5 per item; items exceeding this are discarded
- **Dedup**: `idempotencyKey` prevents duplicate processing
- **Order**: FIFO within each flush cycle

---

## 6. Conflict Resolution

| Entity | Strategy | Rationale |
|--------|----------|-----------|
| **Profile (cognitive data)** | Remote wins for studyPreferences; append-union for weakSubjects, strongSubjects, hesitationTopics; merge-by-key for forgettingRates; merge-and-sum for confusionPairs; max for totalQuestionsAttempted | Learner may use multiple devices; remote has most recent device's data. Never discard progress — always union append-only fields. |
| **Session Outcomes** | Local wins (last write wins). Remote data added during pull if session_id not in local store. | Session data is generated on device; remote is just a backup. |
| **Interaction Signals** | Append-only. New local signals batched to remote. Remote signals pulled only for new profiles. | Interactions are immutable events; no conflict possible. |
| **Recommendations** | Remote status (`accepted`/`skipped`) takes precedence for known IDs. New local recs pushed to remote. | Recommendation status reflects user action that can happen on any device. |

### Golden Rule
> **Never silently discard learner progress.**  
> When in doubt, keep both versions (append/union). Only overwrite when one version is a strict superset or newer.

---

## 7. Remaining Technical Risks

1. **Supabase free-tier limits** — Row count and bandwidth caps could be hit with heavy usage. Mitigation: batch writes, TTL on old signals, pagination on pulls.

2. **No auth UI yet** — Sign-in/up helpers exist in `supabase.ts` but no auth screen. Restore assumes `auth_user_id` is available. Without auth, sync is a no-op.

3. **Race condition on startup** — `restoreFromRemote()` fires after setup completes. If setup is fast and user immediately starts a session, local mutations could be overwritten by stale remote data. Mitigation: remote pull only adds missing data, never overwrites existing session outcomes or signals.

4. **AsyncStorage size limits** — On Android, default AsyncStorage has a ~6MB limit. The sync queue is small (operation metadata only), but interaction signals and session outcomes accumulate in the performance store. Mitigation: cap stored signals to last 5000 items in the store; archive older ones.

5. **OpenTelemetry dependency** — `@supabase/supabase-js` v2.108+ pulls in `@opentelemetry/api`. If issues arise, pin to an older version like `2.45.x`.

6. **No encryption** — Cognitive profile data in transit uses HTTPS, but no client-side encryption layer exists. Acceptable for MVP; add encryption-at-rest for production.

7. **Periodic sync interval** — Currently 60s. May need adjustment based on battery/network usage patterns observed in the field.
