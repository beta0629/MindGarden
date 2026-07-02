/**
 * dashboardKpiSparklineUtils — 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import {
  buildTrendAriaLabel,
  extractSparklineValues
} from '../dashboardKpiSparklineUtils';

describe('dashboardKpiSparklineUtils', () => {
  describe('extractSparklineValues', () => {
    test('주간 bookedCount 배열을 sparkline 값으로 추출한다', () => {
      const rows = [
        { bookedCount: 1 },
        { bookedCount: 3 },
        { bookedCount: 2 }
      ];
      expect(extractSparklineValues(rows, 'bookedCount')).toEqual([1, 3, 2]);
    });

    test('전부 0이면 null을 반환한다', () => {
      const rows = [{ completedCount: 0 }, { completedCount: 0 }];
      expect(extractSparklineValues(rows, 'completedCount')).toBeNull();
    });

    test('빈 배열이면 null을 반환한다', () => {
      expect(extractSparklineValues([], 'bookedCount')).toBeNull();
    });
  });

  describe('buildTrendAriaLabel', () => {
    test('양수 증감은 상승 라벨', () => {
      expect(buildTrendAriaLabel(5)).toBe('5% 상승');
    });

    test('음수 증감은 하락 라벨', () => {
      expect(buildTrendAriaLabel(-1.2)).toBe('1.2% 하락');
    });

    test('0은 변동 없음', () => {
      expect(buildTrendAriaLabel(0)).toBe('변동 없음');
    });

    test('null/undefined는 undefined', () => {
      expect(buildTrendAriaLabel(null)).toBeUndefined();
      expect(buildTrendAriaLabel(undefined)).toBeUndefined();
    });
  });
});
