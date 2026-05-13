/**
 * TanStack Query MMKV 영속화 화이트리스트
 * 토큰·세션 쿼리는 키 자체가 없으며, 민감 API(결제·메시지 등)는 의도적으로 제외
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import type { Query } from '@tanstack/react-query';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';

const PERSIST_ROOTS = {
  schedules: 'schedules',
  clients: 'clients',
  consultations: 'consultations',
} as const;

function isConsultationPersistBranch(key: readonly unknown[]): boolean {
  const branch = key[1];
  return (
    branch === 'list' ||
    branch === 'detail' ||
    branch === 'upcoming' ||
    branch === 'dashboard'
  );
}

/**
 * 오프라인 읽기용으로 MMKV에 저장할 쿼리 키 여부
 * - 상담사: 스케줄·내담자·대시보드 요약(schedules.dashboard)
 * - 내담자: 상담 목록·다가오는 일정·홈 대시보드 요약
 */
export function isOfflinePersistedQueryKey(queryKey: readonly unknown[]): boolean {
  if (queryKey.length === 0 || typeof queryKey[0] !== 'string') {
    return false;
  }
  const root = queryKey[0];
  if (root === PERSIST_ROOTS.schedules || root === PERSIST_ROOTS.clients) {
    return true;
  }
  if (root === PERSIST_ROOTS.consultations) {
    return isConsultationPersistBranch(queryKey);
  }
  return false;
}

/**
 * PersistQueryClient dehydrate용: 성공 상태 + 화이트리스트만 저장
 */
export function shouldDehydrateOfflinePersistedQuery(query: Query): boolean {
  if (!defaultShouldDehydrateQuery(query)) {
    return false;
  }
  return isOfflinePersistedQueryKey(query.queryKey);
}
