/**
 * 상담사 스케줄 목록 행 액션 SSOT (Expo consultantScheduleCardUi 포팅)
 *
 * @author MindGarden
 * @since 2026-09-03
 * @see expo-app/src/utils/consultantScheduleCardUi.ts
 */

/**
 * @param {string} v
 * @returns {string}
 */
function normalizeHm(v) {
  const s = String(v ?? '').trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * @param {string} dateYmd
 * @param {string} hm
 * @returns {number|null}
 */
function parseLocalDateTimeMs(dateYmd, hm) {
  const d = String(dateYmd ?? '').slice(0, 10);
  const t = normalizeHm(hm);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || t.length < 4) {
    return null;
  }
  const ms = Date.parse(`${d}T${t}:00`);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * 슬롯 종료 시각이 지났는지(로컬 날짜·시각 기준).
 *
 * @param {string} dateYmd
 * @param {string} endTime
 * @returns {boolean}
 */
export function isConsultantSchedulePastSlotEnd(dateYmd, endTime) {
  const ms = parseLocalDateTimeMs(dateYmd, endTime);
  if (ms == null) {
    return false;
  }
  return Date.now() > ms;
}

/**
 * @param {{ status?: string, date?: string, startTime?: string, endTime?: string }} schedule
 * @returns {{ primaryActionLabel: string|undefined, primaryActionKind: 'start'|'complete'|undefined }}
 */
export function getConsultantScheduleListRowActions(schedule) {
  const status = String(schedule?.status ?? '').toUpperCase();
  const dateYmd = String(schedule?.date ?? '').slice(0, 10);
  const endTime = schedule?.endTime ?? '';
  const pastEnd = isConsultantSchedulePastSlotEnd(dateYmd, endTime);

  if (status === 'IN_PROGRESS') {
    return { primaryActionLabel: '상담 완료', primaryActionKind: 'complete' };
  }

  const canStart =
    (status === 'BOOKED' || status === 'CONFIRMED' || status === 'SCHEDULED')
    && !pastEnd;

  if (canStart) {
    return { primaryActionLabel: '상담 시작', primaryActionKind: 'start' };
  }

  return { primaryActionLabel: undefined, primaryActionKind: undefined };
}
