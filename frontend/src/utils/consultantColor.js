/**
 * 상담사 색상 유틸 — 폐기된 `components/schedule/ScheduleCalendar` 트리에서 추출.
 *
 * - 상담사 id 기반 deterministic 색상(디자인 토큰 변수) 매핑
 * - 통계·캘린더·레전드 등에서 동일 상담사를 동일 색으로 표시하기 위한 SSOT
 *
 * @author MindGarden
 * @since 2026-05-23
 */

const CONSULTANT_COLOR_PALETTE = [
  'var(--mg-primary-500)',
  'var(--mg-error-500)',
  'var(--mg-success-500)',
  'var(--mg-warning-500)',
  'var(--mg-purple-500)',
  'var(--mg-info-500)',
  'var(--mg-success-400)',
  'var(--mg-warning-500)',
  'var(--mg-pink-500)',
  'var(--mg-indigo-500)',
  'var(--mg-teal-500)',
  'var(--mg-purple-500)',
  'var(--mg-green-500)',
  'var(--mg-yellow-500)',
  'var(--mg-error-500)'
];

const FALLBACK_COLOR = 'var(--mg-gray-500)';

/**
 * 상담사 id 에서 색상 토큰을 deterministic 으로 추출한다.
 * 동일 상담사 → 동일 색.
 *
 * @param {number|string} consultantId
 * @returns {string} 디자인 토큰 var(...)
 */
export const getConsultantColor = (consultantId) => {
  if (!consultantId && consultantId !== 0) {
    return FALLBACK_COLOR;
  }

  const key = consultantId.toString();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32비트 정수
  }

  const index = Math.abs(hash) % CONSULTANT_COLOR_PALETTE.length;
  return CONSULTANT_COLOR_PALETTE[index];
};

export default getConsultantColor;
