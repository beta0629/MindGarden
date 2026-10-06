import {
  COMMON_CODE_SORT_ORDER_STEP,
  COMMON_CODE_SORT_ORDER_WHEN_EMPTY,
  nextCommonCodeSortOrder
} from '../commonCodeSortOrder';

describe('nextCommonCodeSortOrder', () => {
  test('코드가 없으면 기존 기본값', () => {
    expect(COMMON_CODE_SORT_ORDER_STEP).toBe(10);
    expect(nextCommonCodeSortOrder([])).toBe(COMMON_CODE_SORT_ORDER_WHEN_EMPTY);
    expect(nextCommonCodeSortOrder(null)).toBe(COMMON_CODE_SORT_ORDER_WHEN_EMPTY);
  });

  test('현재 그룹 최댓값 + 10', () => {
    expect(nextCommonCodeSortOrder([
      { codeValue: 'DEFAULT_COUNSELOR', sortOrder: 0 },
      { codeValue: 'PLAY_THERAPY', sortOrder: 10 },
      { codeValue: 'CLINICAL_PSYCHOLOGIST', sortOrder: 90 }
    ])).toBe(100);
  });

  test('숫자가 아닌 정렬은 건너뛴다', () => {
    expect(nextCommonCodeSortOrder([
      { sortOrder: 'abc' },
      null,
      { sortOrder: 20 }
    ])).toBe(30);
  });
});
