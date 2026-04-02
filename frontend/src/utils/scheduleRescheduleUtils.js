/**
 * 스케줄 재예약(드래그·폼 공통) 검증·페이로드 유틸
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

/** API·input[type=time] 공통 HH:mm 길이 */
const HM_LEN = 5;

/**
 * 로컬 Date 기준으로 PUT /api/v1/schedules/{id} 본문 생성 (handleEventDrop과 동일)
 * @param {Date} newStart 시작
 * @param {Date} newEnd 종료
 * @returns {{ date: string, startTime: string, endTime: string }}
 */
export function buildScheduleDatetimeUpdateBody(newStart, newEnd) {
  const ts = (d) => d.toTimeString().split(' ')[0].slice(0, HM_LEN);
  return {
    date: newStart.toISOString().split('T')[0],
    startTime: ts(newStart),
    endTime: ts(newEnd)
  };
}

/**
 * YYYY-MM-DD + HH:mm 로 로컬 Date 생성
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeHm HH:mm
 * @returns {Date}
 */
export function combineDateAndTimeHm(dateStr, timeHm) {
  const [y, mo, d] = String(dateStr || '').split('-').map((n) => parseInt(n, 10));
  const [hh, mmRaw] = String(timeHm || '00:00').split(':').map((n) => parseInt(n, 10));
  const mm = Number.isFinite(mmRaw) ? mmRaw : 0;
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
}

/**
 * 같은 상담사 기준 시간 겹침 (캘린더 events 배열, 드래그 로직과 동일)
 * @param {Array} events UnifiedScheduleComponent state 이벤트
 * @param {string|number} excludeEventId 이동 중인 스케줄 id
 * @param {string|number|null|undefined} consultantId 상담사 id
 * @param {Date} newStart 새 시작
 * @param {Date} newEnd 새 종료
 * @returns {boolean}
 */
export function hasConsultantScheduleTimeOverlap(events, excludeEventId, consultantId, newStart, newEnd) {
  if (consultantId == null) {
    return false;
  }
  const newStartMs = newStart.getTime();
  const newEndMs = newEnd.getTime();
  return events.some((e) => {
    if (String(e.id) === String(excludeEventId)) {
      return false;
    }
    const otherConsultantId = e.extendedProps?.consultantId;
    if (otherConsultantId == null || String(otherConsultantId) !== String(consultantId)) {
      return false;
    }
    const otherStart = e.start instanceof Date ? e.start : new Date(e.start);
    const otherEnd = e.end instanceof Date ? e.end : new Date(e.end);
    const otherStartMs = otherStart.getTime();
    const otherEndMs = otherEnd.getTime();
    return newStartMs < otherEndMs && newEndMs > otherStartMs;
  });
}

/**
 * 자정 기준 과거 날짜 여부
 * @param {Date} day
 * @returns {boolean}
 */
export function isPastDateOnly(day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dropDate = new Date(day);
  dropDate.setHours(0, 0, 0, 0);
  return dropDate.getTime() < today.getTime();
}
