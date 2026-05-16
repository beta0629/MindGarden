/**
 * 마음 날씨 — Phase 4-A TanStack Query 훅.
 *
 * - `analyzeMindWeather` 는 mutation으로 노출 (성공 시 목록 캐시 선반영 + invalidate)
 * - 공유 옵트인 토글은 단일 카드 단위
 * - 상담사 수신함은 별도 쿼리 키
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { resolveTenantIdForApi, useResolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import {
  analyzeMindWeather,
  fetchConsultantMindWeatherInbox,
  fetchMindWeatherDetail,
  fetchMindWeatherList,
  shareMindWeatherCard,
  unshareMindWeatherCard,
  type MindWeatherAnalyzeRequest,
  type MindWeatherCard,
  type MindWeatherListPayload,
  type MindWeatherShareInput,
} from '@/services/mindWeatherService';

export type {
  MindWeatherAnalyzeRequest,
  MindWeatherCard,
  MindWeatherKeyword,
  MindWeatherShareConsent,
  MindWeatherShareInput,
} from '@/services/mindWeatherService';

const MIND_WEATHER_QUERY_KEYS = {
  all: ['mind-weather'] as const,
  list: () => [...MIND_WEATHER_QUERY_KEYS.all, 'list'] as const,
  detail: (id: string) => [...MIND_WEATHER_QUERY_KEYS.all, 'detail', id] as const,
  inbox: () => [...MIND_WEATHER_QUERY_KEYS.all, 'inbox'] as const,
};

export function useMindWeatherList() {
  return useQuery({
    queryKey: MIND_WEATHER_QUERY_KEYS.list(),
    queryFn: () => fetchMindWeatherList(),
    staleTime: 1000 * 30,
  });
}

export function useMindWeatherDetail(id: string) {
  return useQuery<MindWeatherCard | null>({
    queryKey: MIND_WEATHER_QUERY_KEYS.detail(id),
    queryFn: () => fetchMindWeatherDetail(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useAnalyzeMindWeather() {
  const queryClient = useQueryClient();
  return useMutation<MindWeatherCard, Error, MindWeatherAnalyzeRequest>({
    mutationFn: (request) => analyzeMindWeather(request),
    onSuccess: (card) => {
      queryClient.setQueryData<MindWeatherListPayload | undefined>(
        MIND_WEATHER_QUERY_KEYS.list(),
        (old) => {
          const prev = old?.items ?? [];
          const nextItems = [card, ...prev.filter((c) => c.id !== card.id)];
          return {
            items: nextItems,
            source: old?.source ?? 'api',
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.list() });
      queryClient.setQueryData(MIND_WEATHER_QUERY_KEYS.detail(card.id), card);
    },
  });
}

export function useShareMindWeatherCard() {
  const queryClient = useQueryClient();
  return useMutation<MindWeatherCard, Error, MindWeatherShareInput>({
    mutationFn: (input) => shareMindWeatherCard(input),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
      queryClient.setQueryData(MIND_WEATHER_QUERY_KEYS.detail(card.id), card);
    },
  });
}

export function useUnshareMindWeatherCard() {
  const queryClient = useQueryClient();
  return useMutation<MindWeatherCard, Error, string>({
    mutationFn: (cardId) => unshareMindWeatherCard(cardId),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
      queryClient.setQueryData(MIND_WEATHER_QUERY_KEYS.detail(card.id), card);
    },
  });
}

export type ConsultantMindWeatherInboxBlockReason =
  | 'auth_loading'
  | 'tenant_hydrating'
  | 'no_token'
  | 'no_tenant'
  | 'not_consultant'
  | null;

export function useConsultantMindWeatherInbox() {
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
    if (tenantHasHydrated) {
      return;
    }
    const timer = setTimeout(() => {
      if (!useTenantStore.getState()._hasHydrated) {
        useTenantStore.setState({ _hasHydrated: true });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [tenantHasHydrated]);

  const blockReason: ConsultantMindWeatherInboxBlockReason = useMemo(() => {
    if (authIsLoading || !authHasHydrated) {
      return 'auth_loading';
    }
    if (!tenantHasHydrated) {
      return 'tenant_hydrating';
    }
    if (!accessToken) {
      return 'no_token';
    }
    if (role !== 'consultant' || !consultantId) {
      return 'not_consultant';
    }
    if (!tenantId) {
      return 'no_tenant';
    }
    return null;
  }, [
    authIsLoading,
    authHasHydrated,
    tenantHasHydrated,
    accessToken,
    role,
    consultantId,
    tenantId,
  ]);

  const enabled = blockReason === null && apiReady.ready;

  const prevEnabledRef = useRef(false);
  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const before = resolveTenantIdForApi();
    syncTenantFromAccessToken(accessToken);
    const after = resolveTenantIdForApi();
    if (before !== after) {
      void queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
    }
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (enabled && !prevEnabledRef.current) {
      void queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.inbox() });
    }
    prevEnabledRef.current = enabled;
  }, [enabled, queryClient]);

  const query = useQuery({
    queryKey: [...MIND_WEATHER_QUERY_KEYS.inbox(), tenantId, String(consultantId ?? '')] as const,
    queryFn: () => fetchConsultantMindWeatherInbox(),
    enabled,
    staleTime: 1000 * 60,
    /** 토큰 주입 직후·탭 재진입 시 서버 목록 재확인 (Android SecureStore 지연 레이스 완화) */
    refetchOnMount: 'always',
  });

  return {
    ...query,
    blockReason,
    isQueryReady: enabled,
    resolvedTenantId: tenantId,
  };
}

export { MIND_WEATHER_QUERY_KEYS };
