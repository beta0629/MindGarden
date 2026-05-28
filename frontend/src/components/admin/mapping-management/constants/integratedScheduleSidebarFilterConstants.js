/**
 * 통합 스케줄(/admin/integrated-schedule) 좌측 사이드바 필터 상수 SSOT
 *
 * - `canConfirmedScheduleForMapping`: 확정 예약(회기 차감) — 백엔드 `validateMappingForSchedule` +
 *   `validateRemainingSessions`와 정합 (ACTIVE + 남은 회기 1 이상).
 * - `canTentativeBeforeDepositScheduleForMapping`: 가예약 — `validateMappingForTentativeBeforeDepositSchedule`과 정합
 *   (ACTIVE만. 승인 대기 DEPOSIT_PENDING은 캘린더 드롭·가예약 불가).
 * - `canScheduleForMapping`: remainingSessions > 0이면 드래그 허용, 0이면 불가.
 *   남은 회기수만큼 다중 스케줄 생성을 허용하며, 확정 예약 또는 가예약 경로 중 하나를 만족해야 함.
 * - `isPaymentConfirmed`: PENDING_PAYMENT 이전 상태는 결제 미확인으로 차단.
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

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 결제 대기 (미확인) */
export const MAPPING_STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 결제 확인 완료 */
export const MAPPING_STATUS_PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED';

/** 백엔드 paymentTiming — 선납 입금 (현행 기본 흐름) */
export const PAYMENT_TIMING_ADVANCE = 'ADVANCE';

/** 백엔드 paymentTiming — 옵션 B 사후 카드 결제 (당일 방문) */
export const PAYMENT_TIMING_SAME_DAY_CARD = 'SAME_DAY_CARD';

/**
 * 결제 확인 이후 상태 집합.
 * PENDING_PAYMENT 만 결제 미확인. 그 외(PAYMENT_CONFIRMED, DEPOSIT_PENDING, ACTIVE 등)는 확인 완료 간주.
 */
const PAYMENT_UNCONFIRMED_STATUSES = new Set([MAPPING_STATUS_PENDING_PAYMENT]);

/**
 * 매칭이 결제 확인을 완료한 상태인지 판별.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const isPaymentConfirmed = (mapping) => {
  if (!mapping?.status) return false;
  return !PAYMENT_UNCONFIRMED_STATUSES.has(mapping.status);
};

export const normalizedRemainingSessions = (mapping) => {
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
 * 옵션 B 사후 카드 결제(SAME_DAY_CARD) + PENDING_PAYMENT 매핑 여부.
 *
 * 옵션 B 흐름은 매핑이 PENDING_PAYMENT 상태로 생성되고, 사용자가 캘린더에 일정을 등록(드래그)
 * 하면 그 직후 `CheckoutSameDayModal` 로 결제 + 활성화를 한 번에 처리한다. 따라서 일반 가드
 * (결제 확인 완료 + 회기 1 이상)를 통과하지 않더라도 드래그를 허용해야 한다.
 *
 * @param {object} [mapping] - 매칭 DTO
 * @returns {boolean}
 */
export const isSameDayCardPending = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  return mapping.status === MAPPING_STATUS_PENDING_PAYMENT
    && mapping.paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD;
};

/**
 * 통합 스케줄 사이드바 «일정 등록» 허용 — remainingSessions 기반 다중 스케줄 허용.
 *
 * 분기:
 * 1. 옵션 B SAME_DAY_CARD + PENDING_PAYMENT 매핑은 가드 건너뛰고 드래그 허용.
 *    드래그 후 `CheckoutSameDayModal` 자동 진입으로 결제 + 활성화를 처리한다.
 * 2. 그 외 매핑은 결제 확인 + 남은 회기 + (확정/가예약) 가드를 통과해야 한다.
 *
 * @param {object} [mapping] - 매칭 DTO
 * @returns {boolean}
 */
export const canScheduleForMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  if (isSameDayCardPending(mapping)) {
    return true;
  }
  if (!isPaymentConfirmed(mapping)) {
    return false;
  }
  if (normalizedRemainingSessions(mapping) <= 0) {
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
