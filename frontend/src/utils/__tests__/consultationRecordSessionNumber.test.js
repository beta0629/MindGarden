/**
 * 상담일지 sessionNumber fail-closed 계약 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-14
 */

import {
  parseOptionalSessionNumber,
  requireSessionNumber,
  resolveSessionNumberFromSchedule
} from '../consultationRecordSessionNumber';

describe('consultationRecordSessionNumber', () => {
  test('parseOptionalSessionNumber — 정수만 허용, 기본값 1 금지', () => {
    expect(parseOptionalSessionNumber(15)).toBe(15);
    expect(parseOptionalSessionNumber('15')).toBe(15);
    expect(parseOptionalSessionNumber(null)).toBeNull();
    expect(parseOptionalSessionNumber(undefined)).toBeNull();
    expect(parseOptionalSessionNumber('')).toBeNull();
    expect(parseOptionalSessionNumber(1.5)).toBeNull();
    expect(parseOptionalSessionNumber(Number.NaN)).toBeNull();
  });

  test('resolveSessionNumberFromSchedule — sessionSequence 우선', () => {
    expect(resolveSessionNumberFromSchedule({
      sessionSequence: 15,
      sessionNumber: 1
    })).toBe(15);
  });

  test('resolveSessionNumberFromSchedule — sequence 없으면 sessionNumber', () => {
    expect(resolveSessionNumberFromSchedule({ sessionNumber: 4 })).toBe(4);
  });

  test('resolveSessionNumberFromSchedule — 둘 다 없으면 null (가짜 1 금지)', () => {
    expect(resolveSessionNumberFromSchedule({})).toBeNull();
    expect(resolveSessionNumberFromSchedule(null)).toBeNull();
  });

  test('requireSessionNumber — null이면 throw', () => {
    expect(() => requireSessionNumber(null)).toThrow(/sessionNumber/);
    expect(requireSessionNumber(15)).toBe(15);
  });
});
