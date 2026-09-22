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
 * 일지 저장에 쓸 회차가 부여됐는지. 1 미만·null은 미부여.
 *
 * @param {unknown} sessionNumber
 * @returns {boolean}
 */
export function isConsultationLogSessionNumberAssigned(sessionNumber) {
  const n = parseOptionalSessionNumber(sessionNumber);
  return n != null && n >= 1;
}

/**
 * 작성(신규) 시 sessionNumber 미부여를 클라이언트가 막지 않는다.
 * 가예약은 BE가 remaining 차감 없이 회차를 부여한다. 수정 모드는 기존 회차가 필수.
 *
 * @param {unknown} sessionNumber
 * @param {boolean} isEditMode
 * @returns {boolean} true면 저장을 클라이언트에서 차단
 */
export function shouldBlockSaveForMissingSessionNumber(sessionNumber, isEditMode) {
  if (isConsultationLogSessionNumberAssigned(sessionNumber)) {
    return false;
  }
  return Boolean(isEditMode);
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
