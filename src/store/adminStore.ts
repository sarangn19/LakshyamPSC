import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FlaggedQuestion {
  id: string;
  questionId: string;
  questionText: string;
  reason: string;
  reportedBy: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  accuracyRate: number;
  errorRate: number;
  usageCount: number;
}

export interface CAEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledFor: string | null;
  publishedAt: string | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  category: string;
  subject: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string | null;
  resolution: string | null;
  createdAt: string;
}

export interface CognitiveTwinConfig {
  weaknessWeight: number;
  forgettingWeight: number;
  confusionWeight: number;
  coverageWeight: number;
  version: number;
}

export interface SystemHealth {
  syncFailures: number;
  queueFailures: number;
  apiFailures: number;
  dbHealth: 'healthy' | 'degraded' | 'down';
  storageUsedMb: number;
  lastChecked: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variantA: Record<string, number>;
  variantB: Record<string, number>;
  metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
}

export interface AuditEntry {
  id: string;
  authUserId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

interface AdminState {
  flaggedQuestions: FlaggedQuestion[];
  caEntries: CAEntry[];
  supportTickets: SupportTicket[];
  cognitiveTwinConfig: CognitiveTwinConfig;
  systemHealth: SystemHealth;
  experiments: Experiment[];
  auditLogs: AuditEntry[];
  activeLearnersToday: number;
  sessionCompletionRate: number;
  revisionAdherenceRate: number;
  averageAccuracy: number;
  recommendationsAccepted: number;

  setFlaggedQuestions: (q: FlaggedQuestion[]) => void;
  updateFlaggedStatus: (id: string, status: FlaggedQuestion['status'], notes?: string) => void;
  setCAEntries: (e: CAEntry[]) => void;
  updateCAStatus: (id: string, status: CAEntry['status']) => void;
  addCAEntry: (entry: CAEntry) => void;
  setSupportTickets: (t: SupportTicket[]) => void;
  updateTicketStatus: (id: string, status: SupportTicket['status'], resolution?: string) => void;
  assignTicket: (id: string, assignee: string) => void;
  setCognitiveTwinConfig: (c: CognitiveTwinConfig) => void;
  updateCognitiveTwinWeight: (key: keyof CognitiveTwinConfig, value: number) => void;
  setSystemHealth: (h: SystemHealth) => void;
  setExperiments: (e: Experiment[]) => void;
  updateExperimentStatus: (id: string, status: Experiment['status']) => void;
  setAuditLogs: (a: AuditEntry[]) => void;
  setDashboardMetrics: (m: {
    activeLearnersToday: number;
    sessionCompletionRate: number;
    revisionAdherenceRate: number;
    averageAccuracy: number;
    recommendationsAccepted: number;
  }) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      flaggedQuestions: [],
      caEntries: [],
      supportTickets: [],
      cognitiveTwinConfig: {
        weaknessWeight: 30,
        forgettingWeight: 25,
        confusionWeight: 20,
        coverageWeight: 25,
        version: 1,
      },
      systemHealth: {
        syncFailures: 2,
        queueFailures: 0,
        apiFailures: 1,
        dbHealth: 'healthy',
        storageUsedMb: 342,
        lastChecked: new Date().toISOString(),
      },
      experiments: [],
      auditLogs: [],
      activeLearnersToday: 0,
      sessionCompletionRate: 0,
      revisionAdherenceRate: 0,
      averageAccuracy: 0,
      recommendationsAccepted: 0,

      setFlaggedQuestions: (q) => set({ flaggedQuestions: q }),
      updateFlaggedStatus: (id, status, notes) =>
        set((s) => ({
          flaggedQuestions: s.flaggedQuestions.map((fq) =>
            fq.id === id ? { ...fq, status, ...(notes ? { reason: notes } : {}) } : fq
          ),
        })),
      setCAEntries: (e) => set({ caEntries: e }),
      updateCAStatus: (id, status) =>
        set((s) => ({
          caEntries: s.caEntries.map((ca) =>
            ca.id === id ? { ...ca, status, ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}) } : ca
          ),
        })),
      addCAEntry: (entry) =>
        set((s) => ({ caEntries: [entry, ...s.caEntries] })),
      setSupportTickets: (t) => set({ supportTickets: t }),
      updateTicketStatus: (id, status, resolution) =>
        set((s) => ({
          supportTickets: s.supportTickets.map((t) =>
            t.id === id ? { ...t, status, ...(resolution ? { resolution } : {}) } : t
          ),
        })),
      assignTicket: (id, assignee) =>
        set((s) => ({
          supportTickets: s.supportTickets.map((t) =>
            t.id === id ? { ...t, assignedTo: assignee, status: 'assigned' as const } : t
          ),
        })),
      setCognitiveTwinConfig: (c) => set({ cognitiveTwinConfig: c }),
      updateCognitiveTwinWeight: (key, value) =>
        set((s) => ({
          cognitiveTwinConfig: {
            ...s.cognitiveTwinConfig,
            [key]: Math.max(0, Math.min(100, value)),
            version: s.cognitiveTwinConfig.version + 1,
          },
        })),
      setSystemHealth: (h) => set({ systemHealth: h }),
      setExperiments: (e) => set({ experiments: e }),
      updateExperimentStatus: (id, status) =>
        set((s) => ({
          experiments: s.experiments.map((ex) =>
            ex.id === id ? { ...ex, status } : ex
          ),
        })),
      setAuditLogs: (a) => set({ auditLogs: a }),
      setDashboardMetrics: (m) => set(m),
    }),
    {
      name: 'lakshyam-admin',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cognitiveTwinConfig: state.cognitiveTwinConfig,
        experiments: state.experiments,
        flaggedQuestions: state.flaggedQuestions,
        caEntries: state.caEntries,
        supportTickets: state.supportTickets,
      }),
    }
  )
);
