/**
 * 어드민 모바일 TanStack Query 캐시 무효화 — tenantId·JWT 재동기화 후
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import type { QueryClient } from '@tanstack/react-query';

const ADMIN_QUERY_PREFIXES = [
  ['admin-mobile'],
  ['adminCommunityModeration'],
  ['adminMindWeatherObservability'],
] as const;

export function invalidateAdminApiQueries(queryClient: QueryClient): void {
  for (const prefix of ADMIN_QUERY_PREFIXES) {
    void queryClient.invalidateQueries({ queryKey: [...prefix] });
  }
}
