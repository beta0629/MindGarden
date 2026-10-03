/**
 * 통합 스케줄 내담자 특이사항 noteType 라벨 SSOT
 * 라벨 우선순위: 공통코드(koreanName → codeLabel) → SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS → 중립 라벨.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import {
  CLIENT_SCHEDULE_NOTE_SCHEDULE_DATE_FIELD,
  CLIENT_SCHEDULE_NOTES_META_PROMISE_PREFIX,
  CLIENT_SCHEDULE_NOTES_META_SCHEDULE_DATE_PREFIX,
  SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS,
  SCHEDULE_CLIENT_NOTE_TYPE_GROUP,
  SCHEDULE_CLIENT_NOTE_TYPE_UNKNOWN_LABEL
} from '../constants/clientScheduleNoteConstants';

export { SCHEDULE_CLIENT_NOTE_TYPE_GROUP };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {Array<object>} codes getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP) 결과
 * @returns {Record<string, string>} codeValue → 표시 라벨
 */
export function buildScheduleClientNoteTypeLabelMap(codes) {
  const map = {};
  (codes || []).forEach((code) => {
    const value = code?.codeValue;
    if (!value) return;
    const label = code.koreanName || code.codeLabel;
    if (label) {
      map[value] = label;
    }
  });
  return map;
}

/**
 * @param {string} codeValue
 * @param {Record<string, string>} labelMap 공통코드 라벨 맵
 * @returns {string} 한글 라벨. 미등록 코드는 중립 라벨, 빈 값은 ''
 */
export function resolveScheduleClientNoteTypeLabel(codeValue, labelMap) {
  if (!codeValue) return '';
  return labelMap?.[codeValue]
    || SCHEDULE_CLIENT_NOTE_TYPE_FALLBACK_LABELS[codeValue]
    || SCHEDULE_CLIENT_NOTE_TYPE_UNKNOWN_LABEL;
}

/**
 * @param {object} note
 * @param {(codeValue: string) => string} getLabel
 * @param {{ includeScheduleDate?: boolean }} [options]
 * @returns {string}
 */
export function formatScheduleClientNoteMeta(note, getLabel, { includeScheduleDate = false } = {}) {
  const typeLabel = getLabel(note?.noteType);
  const parts = [typeLabel].filter(Boolean);
  if (note?.promiseDate) {
    parts.push(`${CLIENT_SCHEDULE_NOTES_META_PROMISE_PREFIX} ${note.promiseDate}`);
  }
  const scheduleDate = note?.[CLIENT_SCHEDULE_NOTE_SCHEDULE_DATE_FIELD];
  if (includeScheduleDate && scheduleDate) {
    parts.push(`${CLIENT_SCHEDULE_NOTES_META_SCHEDULE_DATE_PREFIX} ${scheduleDate}`);
  }
  return parts.join(' · ');
}

/**
 * @param {object} note
 * @returns {boolean} 해소 전 노트 여부
 */
export function isScheduleClientNoteUnresolved(note) {
  return !note?.resolvedAt;
}

/**
 * 미해소 노트의 약속일(yyyy-MM-dd)이 오늘(로컬 날짜)보다 이전이면 true.
 *
 * @param {object} note
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isScheduleClientNotePromiseOverdue(note, now = new Date()) {
  if (!isScheduleClientNoteUnresolved(note) || !note?.promiseDate) return false;
  const d = String(note.promiseDate).trim();
  if (!ISO_DATE_PATTERN.test(d)) return false;
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return d < `${y}-${m}-${day}`;
}
