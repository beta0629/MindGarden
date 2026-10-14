/**
 * getTeacherColor — 데이터 색 우선 / id 정렬(비활성 포함) / solid·hollow / 비활성 제거 불변
 */
import {
  TEACHER_PALETTE_SIZE,
  compareConsultantIdsAsc,
  getTeacherColor,
  sortConsultantsByIdAsc
} from '../getTeacherColor';

describe('getTeacherColor', () => {
  const consultants = [
    { id: 3, name: 'C', isActive: false },
    { id: 1, name: 'A', isActive: true },
    { id: 2, name: 'B', active: false },
    { id: 10, name: 'J' },
    { id: 4, name: 'D' },
    { id: 5, name: 'E' },
    { id: 6, name: 'F' },
    { id: 7, name: 'G' },
    { id: 8, name: 'H' },
    { id: 9, name: 'I' }
  ];

  test('데이터 색(CSS var) 우선 — 팔레트·해시 미사용', () => {
    const result = getTeacherColor({
      consultantId: 1,
      consultants,
      colorFromData: { color: 'var(--mg-v2-color-primary-main)' }
    });
    expect(result.token).toBe('var(--mg-v2-color-primary-main)');
    expect(result.paletteIndex).toBeNull();
    expect(result.hollow).toBe(false);
    expect(result.inlineColor).toBeUndefined();
  });

  test('데이터 hex 는 inlineColor 로 — 헬퍼 밖 팔레트 복제 없음', () => {
    const result = getTeacherColor({
      consultantId: 2,
      consultants,
      colorFromData: { gradeColor: '#112233' }
    });
    expect(result.token).toBeNull();
    expect(result.inlineColor).toBe('#112233');
    expect(result.hollow).toBe(false);
  });

  test('상담사 객체 colorCode 필드 우선', () => {
    const withCode = [
      { id: 1, name: 'A', colorCode: 'var(--mg-v2-teacher-3)' },
      { id: 2, name: 'B' }
    ];
    const result = getTeacherColor({
      consultantId: 1,
      consultants: withCode
    });
    expect(result.token).toBe('var(--mg-v2-teacher-3)');
    expect(result.hollow).toBe(false);
  });

  test('id 오름차순(비활성 포함) 순번 → teacher-(i%8+1)', () => {
    const sortedIds = sortConsultantsByIdAsc(consultants).map((c) => c.id);
    expect(sortedIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const first = getTeacherColor({ consultantId: 1, consultants });
    expect(first).toMatchObject({
      token: 'var(--mg-v2-teacher-1)',
      paletteIndex: 0,
      ordinal: 0,
      hollow: false
    });

    const eighth = getTeacherColor({ consultantId: 8, consultants });
    expect(eighth).toMatchObject({
      token: 'var(--mg-v2-teacher-8)',
      paletteIndex: 7,
      ordinal: 7,
      hollow: false
    });
  });

  test('i 8..15 는 hollow 이고 같은 팔레트 색', () => {
    const ninth = getTeacherColor({ consultantId: 9, consultants });
    expect(ninth).toMatchObject({
      token: 'var(--mg-v2-teacher-1)',
      paletteIndex: 0,
      ordinal: 8,
      hollow: true
    });

    const tenth = getTeacherColor({ consultantId: 10, consultants });
    expect(tenth).toMatchObject({
      token: 'var(--mg-v2-teacher-2)',
      paletteIndex: 1,
      ordinal: 9,
      hollow: true
    });
  });

  test('비활성 제거해도 타 상담사 색 불변 (활성만 재정렬하면 깨짐 — 비활성 포함 유지)', () => {
    const before = getTeacherColor({ consultantId: 10, consultants });
    expect(before.token).toBe('var(--mg-v2-teacher-2)');
    expect(before.ordinal).toBe(9);

    // 비활성(id 2,3)을 목록에 남긴 채 — 활성만 필터하면 ordinal 이 밀림
    const activeOnly = consultants.filter((c) => c.isActive !== false && c.active !== false);
    const brokenIfFiltered = getTeacherColor({
      consultantId: 10,
      consultants: activeOnly
    });
    expect(brokenIfFiltered.ordinal).not.toBe(before.ordinal);

    const stillFull = getTeacherColor({ consultantId: 10, consultants });
    expect(stillFull.token).toBe(before.token);
    expect(stillFull.ordinal).toBe(before.ordinal);
    expect(stillFull.hollow).toBe(before.hollow);
  });

  test('비활성 id가 중간에 있어도 활성 상담사 색이 안 밀리고, 비활성도 자기 순번 색', () => {
    // id 오름차순: 1(활성), 2(비활성), 3(활성) — 2가 중간
    const mixed = [
      { id: 3, name: 'Active-after', isActive: true },
      { id: 1, name: 'Active-first', isActive: true },
      { id: 2, name: 'Inactive-mid', isActive: false }
    ];

    const inactiveMid = getTeacherColor({ consultantId: 2, consultants: mixed });
    expect(inactiveMid).toMatchObject({
      token: 'var(--mg-v2-teacher-2)',
      paletteIndex: 1,
      ordinal: 1,
      hollow: false
    });

    const activeAfter = getTeacherColor({ consultantId: 3, consultants: mixed });
    expect(activeAfter).toMatchObject({
      token: 'var(--mg-v2-teacher-3)',
      paletteIndex: 2,
      ordinal: 2,
      hollow: false
    });

    // 비활성을 빼면 활성 id=3 이 teacher-2 로 밀림 — 포함 유지가 필수
    const withoutInactive = mixed.filter((c) => c.isActive !== false);
    const shifted = getTeacherColor({ consultantId: 3, consultants: withoutInactive });
    expect(shifted.ordinal).toBe(1);
    expect(shifted.token).toBe('var(--mg-v2-teacher-2)');
    expect(shifted.ordinal).not.toBe(activeAfter.ordinal);
    expect(shifted.token).not.toBe(activeAfter.token);
  });

  test('해시/modulo 문자열 해시 패턴을 쓰지 않는다 (순번만)', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '..', 'getTeacherColor.js'),
      'utf8'
    );
    expect(source).not.toMatch(/charCodeAt/);
    expect(source).not.toMatch(/<<\s*5/);
    expect(source).toContain('TEACHER_PALETTE_SIZE');
    expect(TEACHER_PALETTE_SIZE).toBe(8);
  });

  test('compareConsultantIdsAsc — 숫자·문자열 혼용', () => {
    expect(compareConsultantIdsAsc(2, 10)).toBeLessThan(0);
    expect(compareConsultantIdsAsc('10', '2')).toBeGreaterThan(0);
  });
});
