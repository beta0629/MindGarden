/**
 * 상담사 본인 완료 회기 통계 조회 (StandardizedApi)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

import StandardizedApi from '../utils/standardizedApi';
import { CONSULTATION_API } from '../constants/api';
import { CONSULTANT_SESSION_KPI_USE_MOCK } from '../constants/consultantSessionKpiStrings';
import { toSafeNumber } from '../utils/safeDisplay';

/**
 * @param {string} ymd
 * @returns {Date}
 */
function parseYmd(ymd) {
  const parts = String(ymd).split('-').map((x) => parseInt(x, 10));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} granularity
 * @returns {{ totalCompleted: number, previousPeriodTotal: number|null, buckets: Array<{ label: string, value: number }> }}
 */
function buildMockSessionStatistics(startDate, endDate, granularity) {
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  const buckets = [];
  const cursor = new Date(start.getTime());
  let i = 0;
  while (cursor <= end && i < 64) {
    const label =
      granularity === 'MONTH'
        ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        : `${cursor.getMonth() + 1}/${cursor.getDate()}`;
    const value = (i * 3 + (cursor.getDate() % 5)) % 8;
    buckets.push({ label, value });
    if (granularity === 'MONTH') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else if (granularity === 'WEEK') {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
    i += 1;
  }
  const totalCompleted = buckets.reduce((acc, b) => acc + b.value, 0);
  return {
    totalCompleted,
    previousPeriodTotal: Math.max(0, totalCompleted - 4),
    buckets
  };
}

/**
 * @param {*} b
 * @param {number} idx
 * @returns {{ label: string, value: number }}
 */
function normalizeBucket(b, idx) {
  const value = toSafeNumber(
    b?.value ?? b?.count ?? b?.completed ?? b?.totalCompleted ?? b?.sessionCount,
    0
  );
  const rawLabel =
    b?.label
    ?? b?.periodLabel
    ?? b?.bucketLabel
    ?? b?.startDate
    ?? b?.periodStart
    ?? b?.date;
  const label =
    rawLabel != null && String(rawLabel).trim() !== ''
      ? String(rawLabel)
      : `항목 ${idx + 1}`;
  return { label, value };
}

/**
 * @param {*} raw
 * @returns {{ totalCompleted: number, previousPeriodTotal: number|null, buckets: Array<{ label: string, value: number }> }}
 */
export function normalizeSessionStatistics(raw) {
  let src =
    raw != null && typeof raw === 'object' && !Array.isArray(raw)
      ? raw
      : {};
  if (
    src.data != null
    && typeof src.data === 'object'
    && !Array.isArray(src.data)
    && ('totalCompleted' in src.data || 'buckets' in src.data)
  ) {
    src = src.data;
  }
  const totalCompleted = toSafeNumber(src.totalCompleted, 0);
  const prevRaw = src.previousPeriodTotal;
  let previousPeriodTotal = null;
  if (prevRaw != null && prevRaw !== '') {
    const p = toSafeNumber(prevRaw, Number.NaN);
    if (Number.isFinite(p)) {
      previousPeriodTotal = p;
    }
  }
  const rawBuckets = Array.isArray(src.buckets) ? src.buckets : [];
  const buckets = rawBuckets.map((b, idx) => normalizeBucket(b, idx));
  return { totalCompleted, previousPeriodTotal, buckets };
}

/**
 * @param {{ startDate: string, endDate: string, granularity: string }} params
 * @returns {Promise<{ totalCompleted: number, previousPeriodTotal: number|null, buckets: Array<{ label: string, value: number }> }>}
 */
export async function fetchConsultantSessionStatistics(params) {
  const { startDate, endDate, granularity } = params;
  if (CONSULTANT_SESSION_KPI_USE_MOCK) {
    return buildMockSessionStatistics(startDate, endDate, granularity);
  }
  const raw = await StandardizedApi.get(CONSULTATION_API.GET_MY_SESSION_STATISTICS, {
    startDate,
    endDate,
    granularity
  });
  return normalizeSessionStatistics(raw);
}
