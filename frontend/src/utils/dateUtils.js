/**
 * 날짜 유틸리티
 * API 응답의 다양한 날짜 형식(문자열, 객체, 배열)을 YYYY-MM-DD로 통일
 *
 * @author Core Solution
 * @since 2025-03
 */
import { DEFAULT_ZONE, formatDateKeyInZone } from './zonedDateTime';

/**
 * 다양한 형식의 날짜 값을 YYYY-MM-DD 문자열로 변환
 * @param {string|Date|object|number[]} val - 날짜 값 (ISO 문자열, Date, {year,month,day}, [y,m,d])
 * @returns {string} YYYY-MM-DD 또는 빈 문자열
 */
export const toDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0].trim();
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (Array.isArray(val) && val.length >= 3) {
    const [y, m, d] = val;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (typeof val === 'object') {
    const y = val.year ?? val.Year;
    const m = val.month ?? val.monthValue ?? val.Month ?? 1;
    const d = val.day ?? val.dayOfMonth ?? val.Day ?? 1;
    if (y != null) {
      const ms = String(m).padStart(2, '0');
      const ds = String(d).padStart(2, '0');
      return `${y}-${ms}-${ds}`;
    }
  }
  return '';
};

/** Empty native date input display placeholder (Korean locale, ISO order) */
export const ISO_DATE_DISPLAY_PLACEHOLDER = 'YYYY-MM-DD';

/**
 * Format ISO date string (YYYY-MM-DD) for display without timezone shift.
 * @param {string} val - ISO date string or empty
 * @param {{ separator?: string, placeholder?: string }} [options]
 * @returns {string} Formatted date or placeholder when empty/invalid
 */
export const formatIsoDateForDisplay = (
  val,
  { separator = '-', placeholder = ISO_DATE_DISPLAY_PLACEHOLDER } = {}
) => {
  if (!val || typeof val !== 'string') {
    return placeholder;
  }
  const datePart = val.split('T')[0].trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    return placeholder;
  }
  const [, year, month, day] = match;
  return `${year}${separator}${month}${separator}${day}`;
};

/**
 * 달력 표시 연·월(1–12)의 로컬 yyyy-MM-dd 시작·종료일.
 * IMS cold-load schedules 월 스코프 등에 사용 (timezone shift 없음).
 *
 * @param {number|string} year - 전체 연도 (예: 2026)
 * @param {number|string} month - 1–12
 * @returns {{ startDate: string, endDate: string }}
 */
export const buildMonthDateRangeYmd = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return { startDate: '', endDate: '' };
  }
  const monthPart = String(m).padStart(2, '0');
  const startDate = `${y}-${monthPart}-01`;
  // Date: monthIndex = m (다음 달), day 0 → 해당 월 마지막 일
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${monthPart}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};


const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_QUARTER = 3;
const MONTHS_PER_YEAR = 12;

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * 달력일(YYYY-MM-DD)에 일수를 더한다. UTC 날짜 산술만 사용해 브라우저 로컬 TZ 영향을 받지 않는다.
 *
 * @param {string} ymd
 * @param {number} days
 * @returns {string}
 */
const addDaysYmd = (ymd, days) => {
  const match = YMD.exec(String(ymd || ''));
  if (!match) {
    return '';
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + Number(days));
  const d = new Date(utc);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

/**
 * 운영 타임존(기본 Asia/Seoul) 기준 오늘이 속한 달의 startDate/endDate.
 *
 * @param {Date} [now]
 * @param {string} [timeZone]
 * @returns {{ startDate: string, endDate: string }}
 */
export const buildCurrentMonthDateRangeYmd = (now = new Date(), timeZone = DEFAULT_ZONE) => {
  const key = formatDateKeyInZone(now, timeZone);
  const match = YMD.exec(key);
  if (!match) {
    return { startDate: '', endDate: '' };
  }
  return buildMonthDateRangeYmd(Number(match[1]), Number(match[2]));
};

/**
 * 운영 타임존 기준 오늘이 속한 주(월–일)의 startDate/endDate.
 *
 * @param {Date} [now]
 * @param {string} [timeZone]
 * @returns {{ startDate: string, endDate: string }}
 */
export const buildCurrentWeekDateRangeYmd = (now = new Date(), timeZone = DEFAULT_ZONE) => {
  const today = formatDateKeyInZone(now, timeZone);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(now);
  const mondayOffset = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[weekday];
  if (mondayOffset == null) {
    return { startDate: today, endDate: today };
  }
  return {
    startDate: addDaysYmd(today, -mondayOffset),
    endDate: addDaysYmd(today, DAYS_PER_WEEK - 1 - mondayOffset)
  };
};

/**
 * 보고서 기간 선택(MONTH/YEAR/QUARTER/WEEK)에 맞는 startDate/endDate.
 * year/month 가 없으면 운영 타임존의 오늘 연·월을 쓴다.
 *
 * @param {{ period?: string, year?: number, month?: number, now?: Date, timeZone?: string }} [opts]
 * @returns {{ startDate: string, endDate: string }}
 */
export const buildSelectedPeriodDateRangeYmd = ({
  period = 'MONTH',
  year,
  month,
  now = new Date(),
  timeZone = DEFAULT_ZONE
} = {}) => {
  const today = formatDateKeyInZone(now, timeZone);
  const match = YMD.exec(today);
  const fallbackYear = match ? Number(match[1]) : NaN;
  const fallbackMonth = match ? Number(match[2]) : NaN;
  const y = Number(year);
  const m = Number(month);
  const useYear = Number.isFinite(y) ? y : fallbackYear;
  const useMonth = Number.isFinite(m) ? m : fallbackMonth;
  const kind = String(period || 'MONTH').toUpperCase();
  if (kind === 'YEAR' && Number.isFinite(useYear)) {
    return {
      startDate: `${useYear}-01-01`,
      endDate: `${useYear}-${pad2(MONTHS_PER_YEAR)}-31`
    };
  }
  if (kind === 'QUARTER' && Number.isFinite(useYear) && Number.isFinite(useMonth)) {
    const quarterStart = Math.floor((useMonth - 1) / MONTHS_PER_QUARTER) * MONTHS_PER_QUARTER + 1;
    return {
      startDate: buildMonthDateRangeYmd(useYear, quarterStart).startDate,
      endDate: buildMonthDateRangeYmd(useYear, quarterStart + MONTHS_PER_QUARTER - 1).endDate
    };
  }
  if (kind === 'WEEK') {
    return buildCurrentWeekDateRangeYmd(now, timeZone);
  }
  return buildMonthDateRangeYmd(useYear, useMonth);
};

/**
 * 관리자 스케줄 통계 API 쿼리 — userRole + 기간(필수).
 * period 가 있으면 그 선택 기간, 없으면 이번 달(KST).
 *
 * @param {{ userRole: string, period?: string, year?: number, month?: number, now?: Date, timeZone?: string }} opts
 * @returns {{ userRole: string, startDate: string, endDate: string }}
 */
export const buildAdminScheduleStatisticsQuery = ({
  userRole,
  period,
  year,
  month,
  now,
  timeZone
} = {}) => {
  const range = period
    ? buildSelectedPeriodDateRangeYmd({ period, year, month, now, timeZone })
    : buildCurrentMonthDateRangeYmd(now, timeZone);
  return {
    userRole,
    startDate: range.startDate,
    endDate: range.endDate
  };
};
