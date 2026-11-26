/**
 * 매핑 회기 수 불변식 — BE MappingSessionCountInvariant 미러.
 * totalSessions == usedSessions + remainingSessions (null → 0).
 *
 * @author CoreSolution
 * @since 2026-11-26
 */

import { MAPPING_SESSION_COUNT_MESSAGES } from '../constants/mappingSessionCountMessages';

/**
 * null/undefined/''/NaN → 0.
 *
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
export function nullToZero(value) {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * 불변식 검증. 통과 시 null, 실패 시 한국어 메시지.
 *
 * @param {number|string|null|undefined} total
 * @param {number|string|null|undefined} used
 * @param {number|string|null|undefined} remaining
 * @returns {string|null}
 */
export function validateInvariant(total, used, remaining) {
  const totalValue = nullToZero(total);
  const usedValue = nullToZero(used);
  const remainingValue = nullToZero(remaining);

  if (totalValue < 0 || usedValue < 0 || remainingValue < 0) {
    return MAPPING_SESSION_COUNT_MESSAGES.NEGATIVE;
  }
  if (totalValue !== usedValue + remainingValue) {
    return MAPPING_SESSION_COUNT_MESSAGES.MISMATCH;
  }
  return null;
}

/**
 * 총 회기만 변경 — used 고정, total >= used 및 total >= 0.
 *
 * @param {number|string|null|undefined} totalSessions
 * @param {number|string|null|undefined} usedSessions
 * @returns {string|null} 오류 메시지 또는 null
 */
export function validateTotalSessionsAgainstUsed(totalSessions, usedSessions) {
  if (totalSessions === '' || totalSessions == null || Number.isNaN(Number(totalSessions))) {
    return null;
  }
  const totalValue = Number(totalSessions);
  const usedValue = nullToZero(usedSessions);

  if (totalValue < 0) {
    return MAPPING_SESSION_COUNT_MESSAGES.TOTAL_NEGATIVE;
  }
  if (usedValue < 0) {
    return MAPPING_SESSION_COUNT_MESSAGES.USED_NEGATIVE;
  }
  if (totalValue < usedValue) {
    return MAPPING_SESSION_COUNT_MESSAGES.TOTAL_LESS_THAN_USED;
  }
  return null;
}

/**
 * 잔여 회기 SSOT — remaining 범위 검증 (used = total - remaining 파생 가능 여부).
 *
 * @param {number|string|null|undefined} total
 * @param {number|string|null|undefined} remaining
 * @returns {string|null}
 */
export function validateRemainingAgainstTotal(total, remaining) {
  if (remaining === '' || remaining == null || Number.isNaN(Number(remaining))) {
    return null;
  }
  const totalValue = nullToZero(total);
  const remainingValue = Number(remaining);

  if (totalValue < 0) {
    return MAPPING_SESSION_COUNT_MESSAGES.TOTAL_NEGATIVE;
  }
  if (remainingValue < 0) {
    return MAPPING_SESSION_COUNT_MESSAGES.REMAINING_NEGATIVE;
  }
  if (remainingValue > totalValue) {
    return MAPPING_SESSION_COUNT_MESSAGES.REMAINING_EXCEEDS_TOTAL;
  }
  return null;
}

/**
 * total-only 변경 시 파생 remaining = total - used.
 *
 * @param {number|string|null|undefined} total
 * @param {number|string|null|undefined} used
 * @returns {number}
 * @throws {Error} 검증 실패 시 message 포함
 */
export function deriveRemainingFromTotalAndUsed(total, used) {
  const err = validateTotalSessionsAgainstUsed(total, used);
  if (err) {
    throw new Error(err);
  }
  return nullToZero(total) - nullToZero(used);
}

/**
 * remaining SSOT — used = total - remaining.
 *
 * @param {number|string|null|undefined} total
 * @param {number|string|null|undefined} remaining
 * @returns {number}
 * @throws {Error} 검증 실패 시 message 포함
 */
export function deriveUsedFromTotalAndRemaining(total, remaining) {
  const err = validateRemainingAgainstTotal(total, remaining);
  if (err) {
    throw new Error(err);
  }
  return nullToZero(total) - nullToZero(remaining);
}
