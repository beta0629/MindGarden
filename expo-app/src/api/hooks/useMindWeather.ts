/**
 * 마음 날씨 — Phase 4-A TanStack Query 훅.
 *
 * - `analyzeMindWeather` 는 mutation으로 노출 (성공 시 목록 invalidate)
 * - 공유 옵트인 토글은 단일 카드 단위
 * - 상담사 수신함은 별도 쿼리 키
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeMindWeather,
  fetchConsultantMindWeatherInbox,
  fetchMindWeatherDetail,
  fetchMindWeatherList,
  shareMindWeatherCard,
  unshareMindWeatherCard,
  type MindWeatherAnalyzeRequest,
  type MindWeatherCard,
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
      queryClient.invalidateQueries({ queryKey: MIND_WEATHER_QUERY_KEYS.list() });
      queryClient.setQueryData(
        MIND_WEATHER_QUERY_KEYS.detail(card.id),
        card,
      );
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
  return useQuery({
    queryKey: MIND_WEATHER_QUERY_KEYS.inbox(),
    queryFn: () => fetchConsultantMindWeatherInbox(),
    staleTime: 1000 * 60,
  });
}

export { MIND_WEATHER_QUERY_KEYS };
