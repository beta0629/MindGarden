/**
 * Dashboard KPI sparkline 데이터 추출 유틸
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import { toSafeNumber } from '../../../utils/safeDisplay';

const DEFAULT_MAX_POINTS = 7;

/**
 * consultation-completion trend row 배열에서 sparkline 숫자 배열 추출
 *
 * @param {Array<{[key:string]: unknown}>|null|undefined} rows
 * @param {string} field - 예: 'completedCount', 'bookedCount'
 * @param {number} [maxPoints=7]
 * @returns {number[]|null} 전부 0이거나 데이터 없으면 null
 */
export function extractSparklineValues(rows, field, maxPoints = DEFAULT_MAX_POINTS) {
  if (!Array.isArray(rows) || rows.length === 0 || !field) {
    return null;
  }
  const slice = rows.slice(-maxPoints);
  const values = slice.map((row) => toSafeNumber(row?.[field], 0));
  if (values.length === 0 || values.every((value) => value === 0)) {
    return null;
  }
  return values;
}

/**
 * 증감률(%)을 스크린리더용 추세 라벨로 변환
 *
 * @param {number|null|undefined} growthRate
 * @returns {string|undefined}
 */
export function buildTrendAriaLabel(growthRate) {
  if (growthRate == null || !Number.isFinite(Number(growthRate))) {
    return undefined;
  }
  const rate = Number(growthRate);
  if (rate === 0) {
    return '변동 없음';
  }
  if (rate > 0) {
    return `${rate}% 상승`;
  }
  return `${Math.abs(rate)}% 하락`;
}
