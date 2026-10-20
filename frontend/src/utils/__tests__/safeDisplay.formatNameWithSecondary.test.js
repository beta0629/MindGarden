/**
 * formatNameWithSecondary — React #130 / 표시 경계 (undefined 괄호 금지)
 */
import { formatNameWithSecondary } from '../safeDisplay';

describe('formatNameWithSecondary', () => {
  test('secondary 없으면 이름만', () => {
    expect(formatNameWithSecondary('이내담')).toBe('이내담');
    expect(formatNameWithSecondary('이내담', null)).toBe('이내담');
    expect(formatNameWithSecondary('이내담', undefined)).toBe('이내담');
    expect(formatNameWithSecondary('이내담', '')).toBe('이내담');
  });

  test('secondary 있으면 괄호 부가', () => {
    expect(formatNameWithSecondary('이내담', '부가')).toBe('이내담 (부가)');
  });

  test('이름 비고 secondary 만 있으면 secondary', () => {
    expect(formatNameWithSecondary('', '부가')).toBe('부가');
    expect(formatNameWithSecondary(null, '부가')).toBe('부가');
  });
});
