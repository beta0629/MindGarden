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
