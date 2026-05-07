/**
 * 통합 스케줄(/admin/integrated-schedule) 좌측 사이드바 필터 상수 SSOT
 *
 * - `canConfirmedScheduleForMapping`: 확정 예약(회기 차감) — 백엔드 `validateMappingForSchedule` +
 *   `validateRemainingSessions`와 정합 (ACTIVE + 남은 회기 1 이상).
 * - `canTentativeBeforeDepositScheduleForMapping`: 가예약 — `validateMappingForTentativeBeforeDepositSchedule`과 정합
 *   (ACTIVE만. 승인 대기 DEPOSIT_PENDING은 캘린더 드롭·가예약 불가).
 * - `canScheduleForMapping`: GET /api/v1/admin/mappings 의 `hasUpcomingConsultationSchedule` 가 true이면
 *   false (당일 이후 예약·확정·가예약 점유 시 «일정 등록» 숨김). 그 외에는 확정 예약 또는 가예약 경로 중 하나.
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

/** 백엔드 `ConsultantClientMapping.MappingStatus` 문자열과 동일 */
export const MAPPING_STATUS_ACTIVE = 'ACTIVE';

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 입금 확인 후 승인 대기 */
export const MAPPING_STATUS_DEPOSIT_PENDING = 'DEPOSIT_PENDING';

const normalizedRemainingSessions = (mapping) => {
  const raw = mapping?.remainingSessions;
  if (raw == null) {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 확정 예약(회기 차감) 가능 여부.
 *
 * @param {object} [mapping] - 매칭 DTO
 * @returns {boolean}
 */
export const canConfirmedScheduleForMapping = (mapping) =>
  mapping?.status === MAPPING_STATUS_ACTIVE && normalizedRemainingSessions(mapping) > 0;

/**
 * 입금 전 가예약 등록 가능 매핑 여부 (회기 0이어도 허용).
 *
 * @param {object} [mapping] - 매칭 DTO
 * @returns {boolean}
 */
export const canTentativeBeforeDepositScheduleForMapping = (mapping) => {
  const s = mapping?.status;
  return s === MAPPING_STATUS_ACTIVE;
};

/**
 * 통합 스케줄 사이드바 «일정 등록» 허용 (백엔드 `hasUpcomingConsultationSchedule` 와 조합).
 *
 * @param {object} [mapping] - 매칭 DTO (`hasUpcomingConsultationSchedule` 선택)
 * @returns {boolean}
 */
export const canScheduleForMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  if (mapping.hasUpcomingConsultationSchedule === true) {
    return false;
  }
  return (
    canConfirmedScheduleForMapping(mapping) ||
    canTentativeBeforeDepositScheduleForMapping(mapping)
  );
};

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
