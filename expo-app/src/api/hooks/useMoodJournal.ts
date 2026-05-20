/**
 * 감정 일기 TanStack Query 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import type { EmotionTag, MoodStatPeriod } from '@/constants/moodConstants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { resolveTenantIdForApi, useResolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import {
  createMoodJournalRemote,
  deleteMoodJournalRemote,
  fetchConsultantMoodJournalInbox,
  fetchMoodJournalDetail,
  fetchMoodJournalMonth,
  fetchMoodStats,
  updateMoodJournalRemote,
  type MoodJournalEntry,
  type MoodJournalInboxPayload,
  type MoodStat,
} from '@/services/moodJournalService';

export type { MoodJournalEntry, MoodJournalInboxItem, MoodStat } from '@/services/moodJournalService';

const MOOD_QUERY_KEYS = {
  all: ['mood-journal'] as const,
  monthly: (month: string) => [...MOOD_QUERY_KEYS.all, 'monthly', month] as const,
  detail: (date: string) => [...MOOD_QUERY_KEYS.all, 'detail', date] as const,
  stats: (period: MoodStatPeriod) => [...MOOD_QUERY_KEYS.all, 'stats', period] as const,
  inbox: () => [...MOOD_QUERY_KEYS.all, 'inbox'] as const,
};

export function useMoodJournals(month: string) {
  return useQuery<Record<string, MoodJournalEntry>>({
    queryKey: MOOD_QUERY_KEYS.monthly(month),
    queryFn: () => fetchMoodJournalMonth(month),
    staleTime: 1000 * 60,
  });
}

export function useMoodJournalDetail(date: string) {
  return useQuery<MoodJournalEntry | null>({
    queryKey: MOOD_QUERY_KEYS.detail(date),
    queryFn: () => fetchMoodJournalDetail(date),
    enabled: !!date,
    staleTime: 1000 * 60,
  });
}

interface CreateMoodJournalParams {
  date: string;
  moodValue: number;
  tags: EmotionTag[];
  memo: string;
  sharedWithConsultant: boolean;
}

export function useCreateMoodJournal() {
  const queryClient = useQueryClient();
  return useMutation<MoodJournalEntry, Error, CreateMoodJournalParams>({
    mutationFn: (params) => createMoodJournalRemote(params),
    onSuccess: (_data, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(variables.date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
      if (variables.sharedWithConsultant) {
        queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.inbox() });
      }
    },
  });
}

export function useUpdateMoodJournal() {
  const queryClient = useQueryClient();
  return useMutation<MoodJournalEntry, Error, CreateMoodJournalParams>({
    mutationFn: (params) => updateMoodJournalRemote(params),
    onSuccess: (_data, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(variables.date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.inbox() });
    },
  });
}

export function useDeleteMoodJournal() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (date) => deleteMoodJournalRemote(date),
    onSuccess: (_data, date) => {
      const month = date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
    },
  });
}

export function useMoodStats(period: MoodStatPeriod) {
  return useQuery<MoodStat[]>({
    queryKey: MOOD_QUERY_KEYS.stats(period),
    queryFn: () => fetchMoodStats(period),
    staleTime: 1000 * 60,
  });
}

export type ConsultantMoodJournalInboxBlockReason =
  | 'auth_loading'
  | 'tenant_hydrating'
  | 'no_token'
  | 'no_tenant'
  | 'not_consultant'
  | null;

export function useConsultantMoodJournalInbox() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const authHasHydrated = useAuthStore((s) => s._hasHydrated);
  const role = useAuthStore((s) => s.role);
  const tenantHasHydrated = useTenantStore((s) => s._hasHydrated);
  const tenantId = useResolveTenantIdForApi();
  const consultantId = useAuthStore((s) => s.user?.id);
  const apiReady = useApiQueryReady({ requireUserId: true });

  useEffect(() => {
    if (tenantHasHydrated) return;
    const timer = setTimeout(() => {
      if (!useTenantStore.getState()._hasHydrated) {
        useTenantStore.setState({ _hasHydrated: true });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [tenantHasHydrated]);

  const blockReason: ConsultantMoodJournalInboxBlockReason = useMemo(() => {
    if (authIsLoading || !authHasHydrated) return 'auth_loading';
    if (!tenantHasHydrated) return 'tenant_hydrating';
    if (!accessToken) return 'no_token';
    if (role !== 'consultant' || !consultantId) return 'not_consultant';
    if (!tenantId) return 'no_tenant';
    return null;
  }, [authIsLoading, authHasHydrated, tenantHasHydrated, accessToken, role, consultantId, tenantId]);

  const enabled = blockReason === null && apiReady.ready;
  const prevEnabledRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    const before = resolveTenantIdForApi();
    syncTenantFromAccessToken(accessToken);
    if (before !== resolveTenantIdForApi()) {
      void queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.inbox() });
    }
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (enabled && !prevEnabledRef.current) {
      void queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.inbox() });
    }
    prevEnabledRef.current = enabled;
  }, [enabled, queryClient]);

  const query = useQuery<MoodJournalInboxPayload>({
    queryKey: [...MOOD_QUERY_KEYS.inbox(), tenantId, String(consultantId ?? '')] as const,
    queryFn: () => fetchConsultantMoodJournalInbox(),
    enabled,
    staleTime: 1000 * 60,
    refetchOnMount: 'always',
  });

  return { ...query, blockReason, isQueryReady: enabled, resolvedTenantId: tenantId };
}

export { MOOD_QUERY_KEYS };
