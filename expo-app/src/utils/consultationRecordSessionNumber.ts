/**
 * 상담일지 sessionNumber fail-closed 검증 (기본값 1 금지).
 *
 * @author MindGarden
 * @since 2026-09-10
 */

/**
 * 회기수 필수 검증 — BE fail-closed 계약과 동일하게 기본값(1)을 적용하지 않는다.
 *
 * @param value 요청·레코드·스케줄에서 온 회기수
 * @param fieldName 에러 메시지용 필드명
 * @returns 유효한 정수 회기수
 * @throws Error 누락·NaN·비정수
 */
export function requireSessionNumber(value: unknown, fieldName = 'sessionNumber'): number {
  if (value == null || value === '') {
    throw new Error(`회기수(${fieldName})는 필수입니다.`);
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`회기수(${fieldName}) 형식이 올바르지 않습니다.`);
  }
  return n;
}

/**
 * 스케줄에서 일지용 sessionNumber 추출.
 * sessionSequence 우선, 없으면 sessionNumber. 둘 다 없으면 null (기본값 1 금지).
 *
 * @param schedule sessionSequence / sessionNumber 보유 객체
 * @returns 회기수 또는 null
 */
export function resolveSessionNumberFromSchedule(schedule: {
  sessionSequence?: number;
  sessionNumber?: number;
}): number | null {
  const fromSequence = schedule.sessionSequence;
  if (typeof fromSequence === 'number' && Number.isFinite(fromSequence)) {
    return fromSequence;
  }
  const fromNumber = schedule.sessionNumber;
  if (typeof fromNumber === 'number' && Number.isFinite(fromNumber)) {
    return fromNumber;
  }
  return null;
}
