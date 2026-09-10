/**
 * 상담일지 sessionNumber fail-closed 계약 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-10
 */
import { requireSessionNumber } from '../useRecords';

describe('requireSessionNumber', () => {
  it('유효한 정수를 그대로 반환한다', () => {
    expect(requireSessionNumber(3)).toBe(3);
    expect(requireSessionNumber(0)).toBe(0);
  });

  it('숫자 문자열을 정수로 파싱한다', () => {
    expect(requireSessionNumber('2')).toBe(2);
  });

  it('null/undefined/빈 문자열이면 throw (기본값 1 금지)', () => {
    expect(() => requireSessionNumber(null)).toThrow(/sessionNumber/);
    expect(() => requireSessionNumber(undefined)).toThrow(/sessionNumber/);
    expect(() => requireSessionNumber('')).toThrow(/sessionNumber/);
  });

  it('NaN·소수·비숫자면 throw', () => {
    expect(() => requireSessionNumber(Number.NaN)).toThrow(/sessionNumber/);
    expect(() => requireSessionNumber(1.5)).toThrow(/sessionNumber/);
    expect(() => requireSessionNumber('abc')).toThrow(/sessionNumber/);
  });
});
