/**
 * 날짜 유틸리티
 * API 응답의 다양한 날짜 형식(문자열, 객체, 배열)을 YYYY-MM-DD로 통일
 *
 * @author Core Solution
 * @since 2025-03
 */

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
