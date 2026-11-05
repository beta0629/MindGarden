/**
 * 회기권 패키지 만료 임박 판별 (관리자 통합 스케줄)
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  normalizedRemainingSessions,
  PAYMENT_TIMING_ADVANCE
} from '../../constants/integratedScheduleSidebarFilterConstants';
import {
  PACKAGE_EXPIRY_REMINDER_MAX_REMAINING_SESSIONS,
  PACKAGE_EXPIRY_REMINDER_MIN_REMAINING_SESSIONS
} from '../constants/packageExpiryReminderConstants';
import { SCHEDULE_MAPPING_ID_FIELD } from '../../../../../constants/schedule';

/**
 * 선납 회기권 매핑인지.
 * ADVANCE 및 레거시 null만 true. 타기관·당일카드·바우처 등 그 외 timing은 false.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export function isPrepaidSessionPackageMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  const timing = mapping.paymentTiming;
  if (timing == null || String(timing).trim() === '') {
    return true;
  }
  return String(timing).trim().toUpperCase() === PAYMENT_TIMING_ADVANCE;
}

/**
 * 회기권 잔여가 만료 임박 구간(1~2회)인지.
 *
 * @param {object} [mapping]
 * @returns {boolean}
 */
export function isSessionPackageExpiryImminent(mapping) {
  if (!isPrepaidSessionPackageMapping(mapping)) {
    return false;
  }
  const remaining = normalizedRemainingSessions(mapping);
  return remaining >= PACKAGE_EXPIRY_REMINDER_MIN_REMAINING_SESSIONS
    && remaining <= PACKAGE_EXPIRY_REMINDER_MAX_REMAINING_SESSIONS;
}

/**
 * 캘린더 이벤트에서 매핑 ID를 꺼낸다.
 *
 * @param {object} [event]
 * @returns {string|number|null}
 */
export function resolveEventMappingId(event) {
  const props = event?.extendedProps || {};
  const raw = props[SCHEDULE_MAPPING_ID_FIELD] ?? props.mappingId ?? props.mapping_id;
  if (raw == null || raw === '') {
    return null;
  }
  return raw;
}

/**
 * 이벤트 시작 시각 라벨 (HH:mm 상담)
 *
 * @param {object} event
 * @returns {string}
 */
export function formatPackageExpiryStartTimeLabel(event) {
  if (!event?.start) {
    return '';
  }
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) {
    return '';
  }
  const hours = String(start.getHours()).padStart(2, '0');
  const minutes = String(start.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} 상담`;
}
