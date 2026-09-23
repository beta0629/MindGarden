/**
 * 통합 스케줄(/admin/integrated-schedule) 좌측 사이드바 필터 상수 SSOT
 *
 * - `canConfirmedScheduleForMapping`: 확정 예약(회기 차감) — 백엔드 `validateMappingForSchedule` +
 *   `validateRemainingSessions`와 정합 (ACTIVE + 남은 회기 1 이상, 또는 타기관 연계).
 * - `canTentativeBeforeDepositScheduleForMapping`: 가예약 — `validateMappingForTentativeBeforeDepositSchedule`과 정합
 *   (ACTIVE만. 승인 대기 DEPOSIT_PENDING은 캘린더 드롭·가예약 불가).
 * - `canScheduleForMapping`: remainingSessions > 0이면 드래그 허용, 0이면 불가.
 *   타기관 연계(INSTITUTION_LINK)는 회기권이 아니므로 rem=0이어도 허용.
 *   남은 회기수만큼 다중 스케줄 생성을 허용하며, 확정 예약 또는 가예약 경로 중 하나를 만족해야 함.
 * - `isOngoingMapping`: 기본 ongoing에서 소진/종료/취소 제외. CANCELLED라도 rem>0이면
 *   일정 취소 동기 잔여 배정으로 포함한다. ACTIVE rem=0 / fully-consumed 는
 *   `shouldExcludeFromAssignmentQueues` 로 「오늘 처리할 배정」에서도 제외.
 * - `shouldExcludeFromAssignmentQueues` / `isEligibleForAssignmentQueues`:
 *   NEW·ongoing 공통 제외(rem&lt;=0, 비-IL, 비-액션필요). REMAINING 은 rem&gt;0 또는 IL.
 * - `isPaymentConfirmed`: PENDING_PAYMENT 이전 상태는 결제 미확인으로 차단.
 *
 * @author CoreSolution
 * @since 2026-04-30
 */

import { isInstitutionLinkEngagement } from '../../../../constants/clientEngagementType';

/** 신규 배정 필터 기간(일) — 운영 피드백으로 조정 가능 */
export const NEW_DAYS = 7;

export function getNewDaysLabel(days) {
  if (days === 1) return '1일';
  if (days === 7) return '7일';
  if (days === 14) return '2주';
  if (days === 30) return '30일';
  return `${days}일`;
}

export const NEW_DAYS_LABEL = getNewDaysLabel(NEW_DAYS);

/**
 * 사이드바 드래그 가능 카드 클래스 (FullCalendar `.fc-event` 와 분리).
 * FC 전역 `.fc-event:focus`/::before/::after/opacity 가 사이드바 li 에 충돌하지 않도록
 * External Draggable 전용 클래스를 사용한다.
 */
export const SIDEBAR_CARD_DRAGGABLE_CLASS = 'integrated-schedule__card--draggable';

/** FullCalendar Draggable `itemSelector` */
export const SIDEBAR_CARD_DRAGGABLE_SELECTOR = `.${SIDEBAR_CARD_DRAGGABLE_CLASS}`;

/** 좌측 목록 보기 필터 */
export const VIEW_FILTER_NEW = 'new';
export const VIEW_FILTER_REMAINING = 'remaining';
export const VIEW_FILTER_ALL = 'all';

export const VIEW_FILTER_NEW_LABEL = `신규 배정 (${NEW_DAYS_LABEL})`;

/** 상태별 필터 옵션 (value: 'ongoing' = 신규 배정 중, value: '' = 전체) */
export const STATUS_FILTER_OPTIONS = [
  { value: 'ongoing', label: '신규 배정 중' },
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

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 취소 */
export const MAPPING_STATUS_CANCELLED = 'CANCELLED';

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 입금 확인 후 승인 대기 */
export const MAPPING_STATUS_DEPOSIT_PENDING = 'DEPOSIT_PENDING';

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 결제 대기 (미확인) */
export const MAPPING_STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';

/** 백엔드 `ConsultantClientMapping.MappingStatus` — 결제 확인 완료 */
export const MAPPING_STATUS_PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED';

/** 백엔드 paymentTiming — 선납 입금 회기권 (현행 기본 흐름) */
export const PAYMENT_TIMING_ADVANCE = 'ADVANCE';

/** 백엔드 paymentTiming — 옵션 B 사후 카드 결제 (당일 방문) */
export const PAYMENT_TIMING_SAME_DAY_CARD = 'SAME_DAY_CARD';

/** 백엔드 paymentTiming — 타기관 연계. 회기권·바우처와 별 파이프라인. 결제 주기는 후속(고정 월 단위 아님). */
export const PAYMENT_TIMING_INSTITUTION_LINK = 'INSTITUTION_LINK';

/** 사이드바·카드 — 기관연계는 회기 「잔여」로 표시하지 않음. 결제 주기는 표시하지 않음. */
export const INSTITUTION_LINK_LABEL = '기관연계';

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
 * @param {object} [mapping] - 배정 DTO
 * @returns {boolean}
 */
/**
 * 확정 예약·Comfortable 카드 액션이 가능한 상태.
 * ACTIVE 또는 (일정 취소 동기로 남은) CANCELLED + rem&gt;0.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const isActiveAssignableMapping = (mapping) => {
  if (!mapping?.status) {
    return false;
  }
  if (mapping.status === MAPPING_STATUS_ACTIVE) {
    return true;
  }
  return mapping.status === MAPPING_STATUS_CANCELLED
    && normalizedRemainingSessions(mapping) > 0;
};

export const canConfirmedScheduleForMapping = (mapping) =>
  isActiveAssignableMapping(mapping)
  && (isInstitutionLinkMapping(mapping) || normalizedRemainingSessions(mapping) > 0);

/**
 * 입금 전 가예약 등록 가능 매핑 여부 (회기 0이어도 허용).
 *
 * @param {object} [mapping] - 배정 DTO
 * @returns {boolean}
 */
export const canTentativeBeforeDepositScheduleForMapping = (mapping) => {
  if (isInstitutionLinkMapping(mapping)) {
    return false;
  }
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
 * @param {object} [mapping] - 배정 DTO
 * @returns {boolean}
 */
export const isSameDayCardPending = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  // 타기관 내담자 오배정(SAME_DAY) 카드는 가예약 드래그 경로로 보내지 않는다.
  if (isInstitutionLinkMapping(mapping)) {
    return false;
  }
  return mapping.status === MAPPING_STATUS_PENDING_PAYMENT
    && String(mapping.paymentTiming || '').toUpperCase() === PAYMENT_TIMING_SAME_DAY_CARD;
};

/**
 * 타기관 연계 paymentTiming 여부 — 대소문자 안전.
 *
 * @param {string|null|undefined} paymentTiming
 * @returns {boolean}
 */
export const isInstitutionLinkPaymentTiming = (paymentTiming) => {
  if (paymentTiming == null || paymentTiming === '') {
    return false;
  }
  return String(paymentTiming).toUpperCase() === PAYMENT_TIMING_INSTITUTION_LINK;
};

/**
 * 타기관 연계 배정 여부. paymentTiming 또는 내담자 등록 유형. rem 으로 추정하지 않는다.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const isInstitutionLinkMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  return isInstitutionLinkPaymentTiming(mapping.paymentTiming)
    || isInstitutionLinkEngagement(mapping.clientEngagementType)
    || isInstitutionLinkEngagement(mapping.engagementType);
};

/**
 * 통합 스케줄 사이드바 «일정 등록» 허용 — remainingSessions 기반 다중 스케줄 허용.
 *
 * 분기:
 * 1. 옵션 B SAME_DAY_CARD + PENDING_PAYMENT 매핑은 가드 건너뛰고 드래그 허용.
 *    드래그 후 `CheckoutSameDayModal` 자동 진입으로 결제 + 활성화를 처리한다.
 * 2. 타기관 연계(ACTIVE)는 회기권이 아니므로 rem=0이어도 드래그 허용.
 * 3. 그 외 매핑은 결제 확인 + 남은 회기 + (확정/가예약) 가드를 통과해야 한다.
 *
 * @param {object} [mapping] - 배정 DTO
 * @returns {boolean}
 */
export const canScheduleForMapping = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  // 타기관 연계(내담자 유형 포함)는 가예약(SAME_DAY PENDING)보다 먼저 — 교차 드래그 금지.
  if (isInstitutionLinkMapping(mapping)) {
    return isPaymentConfirmed(mapping) && isActiveAssignableMapping(mapping);
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

export const ONGOING_EXCLUDED_STATUSES = new Set(['SESSIONS_EXHAUSTED', 'TERMINATED', 'CANCELLED']);

/**
 * 어드민 액션이 필요한 결제 상태 — rem=0이어도 「신규 배정」큐에 유지.
 * PENDING_PAYMENT(결제 대기), DEPOSIT_PENDING(승인 대기).
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const isActionNeededPaymentStatus = (mapping) => {
  const status = mapping?.status;
  return status === MAPPING_STATUS_PENDING_PAYMENT
    || status === MAPPING_STATUS_DEPOSIT_PENDING;
};

/**
 * 배정 큐(신규·오늘 처리·회기 남은)에서 제외할지 여부.
 *
 * <p>SSOT rem clamp 이후 {@code remainingSessions &lt;= 0} 이면, 타기관 연계·액션 필요 상태가
 * 아닌 매핑은 NEW / ongoing(오늘 패널)에서 제외한다. 완전 소비(COMPLETED 소진)도 rem=0 으로
 * 내려오므로 동일 규칙으로 가려진다.</p>
 *
 * @param {object} [mapping]
 * @returns {boolean} true 이면 배정 큐에서 제외
 */
export const shouldExcludeFromAssignmentQueues = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return true;
  }
  // 타기관 연계는 회기권이 아님 — rem=0이어도 remaining 뷰 예외와 동일하게 큐 유지.
  if (isInstitutionLinkMapping(mapping)) {
    return false;
  }
  // 결제/승인 액션이 남았으면 rem=0이어도 NEW·ongoing에 노출.
  if (isActionNeededPaymentStatus(mapping)) {
    return false;
  }
  return normalizedRemainingSessions(mapping) <= 0;
};

/**
 * 배정 큐(신규·오늘 처리) 노출 가능 여부 — {@link shouldExcludeFromAssignmentQueues} 의 역.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const isEligibleForAssignmentQueues = (mapping) =>
  !shouldExcludeFromAssignmentQueues(mapping);

export const isOngoingMapping = (m) => {
  if (!m?.status) {
    return false;
  }
  if (m.status === MAPPING_STATUS_CANCELLED) {
    return normalizedRemainingSessions(m) > 0;
  }
  if (ONGOING_EXCLUDED_STATUSES.has(m.status)) {
    return false;
  }
  // ACTIVE rem=0 / fully-consumed 등 — 「오늘 처리할 배정」패널에서도 제외.
  return isEligibleForAssignmentQueues(m);
};

/** 매칭 정렬·신규 판별용 타임스탬프 (createdAt → assignedAt → startDate) */
export const getMappingDate = (m) => {
  const raw = m.createdAt ?? m.assignedAt ?? m.startDate;
  if (!raw) return 0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};
