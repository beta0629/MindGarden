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
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
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

export function useConsultantMindWeatherInbox() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const userTenantId = useAuthStore((s) => s.user?.tenantId);
  const headerTenantId = useTenantStore((s) => s.tenantId);
  const tenantCode = useTenantStore((s) => s.tenantCode);
  const recentTenants = useTenantStore((s) => s.recentTenants);
  const tenantId = useMemo(() => {
    const h = (headerTenantId ?? '').trim();
    if (h.length > 0) {
      return h;
    }
    const u = (userTenantId ?? '').trim();
    if (u.length > 0) {
      return u;
    }
    const c = (tenantCode ?? '').trim();
    if (c.length > 0 && recentTenants.length > 0) {
      const hit = recentTenants.find((t) => t.code === c);
      const fromRecent = hit?.id?.trim();
      if (fromRecent && fromRecent.length > 0) {
        return fromRecent;
      }
    }
    return '';
  }, [headerTenantId, userTenantId, tenantCode, recentTenants]);
  const consultantId = useAuthStore((s) => s.user?.id);
  const enabled = Boolean(accessToken && tenantId && role === 'consultant' && consultantId);

  return useQuery({
    queryKey: [...MIND_WEATHER_QUERY_KEYS.inbox(), tenantId, String(consultantId ?? '')] as const,
    queryFn: () => fetchConsultantMindWeatherInbox(),
    enabled,
    staleTime: 1000 * 60,
    /** 토큰 주입 직후·탭 재진입 시 서버 목록 재확인 (Android SecureStore 지연 레이스 완화) */
    refetchOnMount: 'always',
  });
}

export { MIND_WEATHER_QUERY_KEYS };
