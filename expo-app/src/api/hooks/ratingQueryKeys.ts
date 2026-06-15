/**
 * 상담사 평가(Rating) TanStack Query 캐시 키 SSOT.
 *
 * `useRatings` 와 별도 모듈로 분리한 이유:
 * - 훅은 `apiPost` 경유로 react-native 의존을 끌고 와 ts-jest node 환경 단위 테스트에 부적합.
 * - 캐시 키 컨트랙트 회귀 방지는 순수 객체 단위에서 검증한다.
 *
 * 평가 가능 목록 조회 hook 이 향후 추가되더라도 동일 키를 재사용해 invalidate 가 자동 적용된다.
 *
 * @author MindGarden
 * @since 2026-06-15
 */
export const RATING_QUERY_KEYS = {
  all: ['ratings'] as const,
  ratableSchedules: (clientId: string | number) =>
    [...RATING_QUERY_KEYS.all, 'ratable-schedules', clientId] as const,
  consultantStats: (consultantId: string | number) =>
    [...RATING_QUERY_KEYS.all, 'consultant-stats', consultantId] as const,
} as const;
