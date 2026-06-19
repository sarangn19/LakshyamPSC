import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_SCOPED_STORAGE_KEYS = [
  'lakshyam-user',
  'lakshyam-knowledge',
  'lakshyam-mcq',
  'lakshyam-flashcards',
  'lakshyam-bkt',
  'lakshyam-performance',
  'lakshyam-cognitive-twin-v2',
  'lakshyam-study-validation',
  'lakshyam-admin',
  'lakshyam-analytics',
];

export type Role = 'student' | 'admin' | 'superadmin';

export interface Permission {
  resource: string;
  action: string;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: [],
  admin: [
    { resource: 'questions', action: 'create' },
    { resource: 'questions', action: 'read' },
    { resource: 'questions', action: 'update' },
    { resource: 'questions', action: 'delete' },
    { resource: 'questions', action: 'approve' },
    { resource: 'current_affairs', action: 'create' },
    { resource: 'current_affairs', action: 'read' },
    { resource: 'current_affairs', action: 'update' },
    { resource: 'current_affairs', action: 'delete' },
    { resource: 'current_affairs', action: 'publish' },
    { resource: 'content_quality', action: 'read' },
    { resource: 'content_quality', action: 'update' },
    { resource: 'content_quality', action: 'delete' },
    { resource: 'learner_support', action: 'read' },
    { resource: 'learner_support', action: 'update' },
    { resource: 'learner_support', action: 'assign' },
    { resource: 'analytics', action: 'read' },
  ],
  superadmin: [
    { resource: 'questions', action: 'create' },
    { resource: 'questions', action: 'read' },
    { resource: 'questions', action: 'update' },
    { resource: 'questions', action: 'delete' },
    { resource: 'questions', action: 'approve' },
    { resource: 'current_affairs', action: 'create' },
    { resource: 'current_affairs', action: 'read' },
    { resource: 'current_affairs', action: 'update' },
    { resource: 'current_affairs', action: 'delete' },
    { resource: 'current_affairs', action: 'publish' },
    { resource: 'content_quality', action: 'read' },
    { resource: 'content_quality', action: 'update' },
    { resource: 'content_quality', action: 'delete' },
    { resource: 'learner_support', action: 'read' },
    { resource: 'learner_support', action: 'update' },
    { resource: 'learner_support', action: 'assign' },
    { resource: 'analytics', action: 'read' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'users', action: 'assign_role' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'feature_flags', action: 'read' },
    { resource: 'feature_flags', action: 'update' },
    { resource: 'cognitive_twin', action: 'read' },
    { resource: 'cognitive_twin', action: 'update' },
    { resource: 'recommendations', action: 'read' },
    { resource: 'recommendations', action: 'update' },
    { resource: 'experiments', action: 'create' },
    { resource: 'experiments', action: 'read' },
    { resource: 'experiments', action: 'update' },
    { resource: 'experiments', action: 'delete' },
    { resource: 'system', action: 'read' },
    { resource: 'audit_logs', action: 'read' },
  ],
};

const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  ai_question_generation: true,
  bkt_parameter_fitting: true,
  cognitive_twin_sync: true,
  malayalam_ml_questions: true,
  flashcard_sm2: true,
  recommendation_engine: true,
  experiment_a_b_testing: false,
};

interface AuthState {
  role: Role;
  isAuthenticated: boolean;
  permissions: Permission[];
  featureFlags: Record<string, boolean>;
  sessionUser: { email: string; name: string } | null;

  setRole: (role: Role) => void;
  login: (email: string, password: string, role: Role, displayName?: string) => Promise<boolean>;
  logout: () => void;
  setAuthenticated: (value: boolean) => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (resource: string, ...actions: string[]) => boolean;
  isFeatureEnabled: (flag: string) => boolean;
  setFeatureFlag: (flag: string, value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: 'student',
      isAuthenticated: false,
      permissions: [],
      featureFlags: DEFAULT_FEATURE_FLAGS,
      sessionUser: null,

      setRole: (role: Role) => {
        set({ role, permissions: ROLE_PERMISSIONS[role] });
      },

  login: async (email: string, password: string, role: Role, displayName?: string): Promise<boolean> => {
    // In production this calls supabase.auth.signIn and checks user_roles table.
    // For local dev, we simulate admin login.
    if (email && password && password.length >= 6) {
      set({
        role,
        isAuthenticated: true,
        permissions: ROLE_PERMISSIONS[role],
        sessionUser: { email, name: displayName || (role === 'student' ? email.split('@')[0] : role === 'admin' ? 'Admin' : 'Super Admin') },
      });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          role: 'student',
          isAuthenticated: false,
          permissions: [],
          sessionUser: null,
        });
        AsyncStorage.multiRemove(USER_SCOPED_STORAGE_KEYS).catch(() => {});
      },

      setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),

      hasPermission: (resource: string, action: string): boolean => {
        return get().permissions.some((p) => p.resource === resource && p.action === action);
      },

      hasAnyPermission: (resource: string, ...actions: string[]): boolean => {
        return actions.some((action) => get().hasPermission(resource, action));
      },

      isFeatureEnabled: (flag: string): boolean => {
        return get().featureFlags[flag] ?? false;
      },

      setFeatureFlag: (flag: string, value: boolean) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, [flag]: value },
        }));
      },
    }),
    {
      name: 'lakshyam-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        featureFlags: state.featureFlags,
        sessionUser: state.sessionUser,
      }),
    }
  )
);
