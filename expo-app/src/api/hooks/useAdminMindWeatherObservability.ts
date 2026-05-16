/**
 * 어드민 마음날씨 관측 — 카드 페이지·요약 (읽기 전용, ADMIN 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  normalizeAdminMindWeatherCardsPage,
  normalizeAdminMindWeatherSummary,
  type AdminMindWeatherCardsPage,
  type AdminMindWeatherSummary,
} from '@/utils/adminMindWeatherNormalize';

const QUERY_BASE = ['adminMindWeatherObservability'] as const;

export const ADMIN_MIND_WEATHER_QUERY_KEYS = {
  all: QUERY_BASE,
  cards: (tenantId: string, page: number) => [...QUERY_BASE, 'cards', tenantId, page] as const,
  summary: (tenantId: string) => [...QUERY_BASE, 'summary', tenantId] as const,
};

export const ADMIN_MIND_WEATHER_PAGE_SIZE = 20;

function assertApiSuccess(raw: unknown, fallback: string): void {
  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (root.success === false) {
      throw new Error(toDisplayString(root.message, fallback));
    }
  }
}

async function fetchCardsPage(page: number): Promise<AdminMindWeatherCardsPage> {
  const raw = await apiGet(ADMIN_MOBILE_API.MIND_WEATHER_CARDS, {
    page,
    size: ADMIN_MIND_WEATHER_PAGE_SIZE,
    sort: 'createdAt,desc',
  });
  assertApiSuccess(raw, '카드 목록을 불러오지 못했습니다.');
  const inner = unwrapApiResponse<unknown>(raw) ?? raw;
  return normalizeAdminMindWeatherCardsPage(inner);
}

async function fetchSummary(): Promise<AdminMindWeatherSummary | null> {
  const raw = await apiGet(ADMIN_MOBILE_API.MIND_WEATHER_SUMMARY, {});
  assertApiSuccess(raw, '요약을 불러오지 못했습니다.');
  const inner = unwrapApiResponse<unknown>(raw) ?? raw;
  return normalizeAdminMindWeatherSummary(inner);
}

export function useAdminMindWeatherCards(page = 0) {
  const { ready, tenantId } = useApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);

  return useQuery({
    queryKey: ADMIN_MIND_WEATHER_QUERY_KEYS.cards(tenantId, page),
    queryFn: () => fetchCardsPage(page),
    enabled: ready && allowed,
    staleTime: 1000 * 30,
    refetchOnMount: 'always',
  });
}

export function useAdminMindWeatherSummary() {
  const { ready, tenantId } = useApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);

  return useQuery({
    queryKey: ADMIN_MIND_WEATHER_QUERY_KEYS.summary(tenantId),
    queryFn: fetchSummary,
    enabled: ready && allowed,
    staleTime: 1000 * 60,
    refetchOnMount: 'always',
  });
}

export function getMindWeatherQueryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return toDisplayString(error.message, fallback);
  }
  if (error != null && typeof error === 'object' && 'message' in error) {
    return toDisplayString((error as { message: unknown }).message, fallback);
  }
  return fallback;
}
