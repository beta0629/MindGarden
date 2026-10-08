/**
 * formatNameWithSecondary — 이메일 없을 때 빈 괄호·undefined 금지
 */
import { formatNameWithSecondary } from '../safeDisplay';

describe('formatNameWithSecondary', () => {
  test('email undefined → name only', () => {
    expect(formatNameWithSecondary('홍길동', undefined)).toBe('홍길동');
  });

  test('email null → name only', () => {
    expect(formatNameWithSecondary('홍길동', null)).toBe('홍길동');
  });

  test('email empty → name only', () => {
    expect(formatNameWithSecondary('홍길동', '')).toBe('홍길동');
    expect(formatNameWithSecondary('홍길동', '   ')).toBe('홍길동');
  });

  test('email present → name (email)', () => {
    expect(formatNameWithSecondary('홍길동', 'hong@example.com')).toBe(
      '홍길동 (hong@example.com)'
    );
  });

  test('never emits undefined/null in parentheses', () => {
    const labels = [
      formatNameWithSecondary('이름', undefined),
      formatNameWithSecondary('이름', null),
      formatNameWithSecondary('이름', ''),
      formatNameWithSecondary(undefined, undefined)
    ];
    labels.forEach((label) => {
      expect(label).not.toMatch(/undefined/);
      expect(label).not.toMatch(/null/);
      expect(label).not.toMatch(/\(\s*\)/);
    });
  });
});
