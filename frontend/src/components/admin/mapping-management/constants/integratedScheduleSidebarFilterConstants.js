/**
 * 통합 스케줄(/admin/integrated-schedule) 좌측 사이드바 필터 상수 SSOT
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

/** 신규 매칭 필터 기간(일) — 운영 피드백으로 조정 가능 */
export const NEW_DAYS = 7;

export function getNewDaysLabel(days) {
  if (days === 1) return '1일';
  if (days === 7) return '7일';
  if (days === 14) return '2주';
  if (days === 30) return '30일';
  return `${days}일`;
}

export const NEW_DAYS_LABEL = getNewDaysLabel(NEW_DAYS);

/** 좌측 목록 보기 필터 */
export const VIEW_FILTER_NEW = 'new';
export const VIEW_FILTER_REMAINING = 'remaining';
export const VIEW_FILTER_ALL = 'all';

export const VIEW_FILTER_NEW_LABEL = `신규 매칭 (${NEW_DAYS_LABEL})`;

/** 상태별 필터 옵션 (value: 'ongoing' = 신규 매칭중, value: '' = 전체) */
export const STATUS_FILTER_OPTIONS = [
  { value: 'ongoing', label: '신규 매칭중' },
  { value: '', label: '전체' },
  { value: 'PENDING_PAYMENT', label: '결제 대기' },
  { value: 'PAYMENT_CONFIRMED', label: '결제 확인' },
  { value: 'DEPOSIT_PENDING', label: '승인 대기' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'TERMINATED', label: '종료됨' },
  { value: 'SESSIONS_EXHAUSTED', label: '회기 소진' },
  { value: 'SUSPENDED', label: '일시정지' }
];

/** 스케줄 등록 가능한 매칭 상태 */
export const SCHEDULABLE_STATUSES = new Set(['PAYMENT_CONFIRMED', 'DEPOSIT_PENDING', 'ACTIVE']);

export const canScheduleForMapping = (mapping) =>
  Boolean(mapping?.status && SCHEDULABLE_STATUSES.has(mapping.status));

export const ONGOING_EXCLUDED_STATUSES = new Set(['SESSIONS_EXHAUSTED', 'TERMINATED']);

export const isOngoingMapping = (m) =>
  Boolean(m?.status && !ONGOING_EXCLUDED_STATUSES.has(m.status));

/** 매칭 정렬·신규 판별용 타임스탬프 (createdAt → assignedAt → startDate) */
export const getMappingDate = (m) => {
  const raw = m.createdAt ?? m.assignedAt ?? m.startDate;
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};
