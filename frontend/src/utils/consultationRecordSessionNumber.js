/**
 * 상담일지 sessionNumber fail-closed 검증 (기본값 1 금지).
 * BE assertSessionNumberMatchesSchedule · Schedule.sessionSequence SSOT.
 *
 * @author MindGarden
 * @since 2026-09-14
 */

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseOptionalSessionNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return null;
  }
  return n;
}

/**
 * 스케줄에서 일지용 sessionNumber 추출.
 * sessionSequence 우선, 없으면 sessionNumber. 둘 다 없으면 null (기본값 1 금지).
 *
 * @param {{ sessionSequence?: unknown, sessionNumber?: unknown }|null|undefined} schedule
 * @returns {number|null}
 */
export function resolveSessionNumberFromSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return null;
  }
  const fromSequence = parseOptionalSessionNumber(schedule.sessionSequence);
  if (fromSequence != null) {
    return fromSequence;
  }
  return parseOptionalSessionNumber(schedule.sessionNumber);
}

/**
 * 회기수 필수 검증 — BE fail-closed 계약과 동일하게 기본값(1)을 적용하지 않는다.
 *
 * @param {unknown} value
 * @param {string} [fieldName='sessionNumber']
 * @returns {number}
 * @throws {Error}
 */
export function requireSessionNumber(value, fieldName = 'sessionNumber') {
  const n = parseOptionalSessionNumber(value);
  if (n == null) {
    throw new Error(`회기수(${fieldName})는 필수입니다.`);
  }
  return n;
}
