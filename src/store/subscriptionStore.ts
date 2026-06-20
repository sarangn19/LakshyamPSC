import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'canceled' | 'incomplete' | 'past_due';

export interface SubscriptionState {
  status: SubscriptionStatus;
  plan: 'free' | 'premium';
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  subscribe: () => Promise<void>;
  checkStatus: () => Promise<void>;
  cancel: () => Promise<void>;
}

const TRIAL_DAYS = 30;

function getDefaultTrialEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      status: 'trialing',
      plan: 'premium',
      trialStart: new Date().toISOString(),
      trialEnd: getDefaultTrialEnd(),
      currentPeriodEnd: null,
      isLoading: false,
      initialized: false,

      initialize: async () => {
        if (get().initialized) return;
        set({ initialized: true });

        // If supabase configured, try to sync from backend
        if (supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (sub) {
                set({
                  status: sub.status,
                  plan: 'premium',
                  trialStart: sub.trial_start,
                  trialEnd: sub.trial_end,
                  currentPeriodEnd: sub.current_period_end,
                });
                return;
              }
            }
          } catch {
            // Fall through to local defaults
          }
        }

        // Local fallback: start trial if not already set
        const state = get();
        if (!state.trialStart) {
          set({ trialStart: new Date().toISOString(), trialEnd: getDefaultTrialEnd() });
        }
      },

      subscribe: async () => {
        set({ isLoading: true });
        try {
          if (!supabase) {
            set({ status: 'active', currentPeriodEnd: getDefaultTrialEnd(), isLoading: false });
            return;
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            set({ isLoading: false });
            return;
          }

          const res = await fetch(
            `${supabase.supabaseUrl}/functions/v1/create-subscription`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await res.json();

          if (data.short_url && data.short_url !== '#') {
            // Open Razorpay checkout page
            // On web: window.open(data.short_url)
            // On mobile: Linking.openURL(data.short_url)
            set({ isLoading: false });
            return { url: data.short_url };
          }

          // Mock/dev fallback — activate immediately
          if (data.id?.startsWith('sub_mock_')) {
            set({
              status: 'active',
              currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
              trialEnd: null,
              isLoading: false,
            });
          }
        } catch (err) {
          console.error('Subscription error:', err);
        }
        set({ isLoading: false });
      },

      checkStatus: async () => {
        if (!supabase) return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (sub) {
            set({
              status: sub.status,
              currentPeriodEnd: sub.current_period_end,
            });
          }
        } catch {
          // Ignore
        }
      },

      cancel: async () => {
        if (!supabase) {
          set({ status: 'canceled' });
          return;
        }
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          await fetch(`${supabase.supabaseUrl}/functions/v1/cancel-subscription`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          set({ status: 'canceled' });
        } catch {
          set({ status: 'canceled' });
        }
      },
    }),
    {
      name: 'lakshyam-subscription',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper: check if user has premium access (trial or paid)
export function hasPremiumAccess(status: SubscriptionStatus): boolean {
  return status === 'trialing' || status === 'active';
}

// Helper: get remaining trial days
export function getTrialDaysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd).getTime();
  const now = Date.now();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / 86400000));
}
