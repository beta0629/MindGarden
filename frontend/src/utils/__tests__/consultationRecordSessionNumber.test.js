/**
 * 상담일지 sessionNumber 유틸 — null→1 폴백 금지, 가예약 신규 저장 허용.
 *
 * @author MindGarden
 * @since 2026-09-14
 */

import {
  isConsultationLogSessionNumberAssigned,
  parseOptionalSessionNumber,
  resolveSessionNumberFromSchedule,
  shouldBlockSaveForMissingSessionNumber
} from '../consultationRecordSessionNumber';

describe('parseOptionalSessionNumber', () => {
  test('유효 정수를 그대로 반환한다', () => {
    expect(parseOptionalSessionNumber(3)).toBe(3);
  });

  test('null/빈값은 null (기본값 1 금지)', () => {
    expect(parseOptionalSessionNumber(null)).toBeNull();
    expect(parseOptionalSessionNumber(undefined)).toBeNull();
    expect(parseOptionalSessionNumber('')).toBeNull();
  });
});

describe('resolveSessionNumberFromSchedule', () => {
  test('sessionSequence를 sessionNumber보다 우선한다', () => {
    expect(resolveSessionNumberFromSchedule({ sessionSequence: 4, sessionNumber: 1 })).toBe(4);
  });

  test('둘 다 없으면 null (기본값 1 금지)', () => {
    expect(resolveSessionNumberFromSchedule({})).toBeNull();
  });
});

describe('isConsultationLogSessionNumberAssigned', () => {
  test('1 이상이면 부여됨', () => {
    expect(isConsultationLogSessionNumberAssigned(1)).toBe(true);
  });

  test('null이면 미부여', () => {
    expect(isConsultationLogSessionNumberAssigned(null)).toBe(false);
  });
});

describe('shouldBlockSaveForMissingSessionNumber', () => {
  test('신규 작성에서 sessionNumber null이면 차단하지 않는다 (가예약 BE 부여)', () => {
    expect(shouldBlockSaveForMissingSessionNumber(null, false)).toBe(false);
  });

  test('수정 모드에서 sessionNumber null이면 차단한다', () => {
    expect(shouldBlockSaveForMissingSessionNumber(null, true)).toBe(true);
  });

  test('부여된 회차는 모드와 무관하게 차단하지 않는다', () => {
    expect(shouldBlockSaveForMissingSessionNumber(1, false)).toBe(false);
    expect(shouldBlockSaveForMissingSessionNumber(2, true)).toBe(false);
  });
});
