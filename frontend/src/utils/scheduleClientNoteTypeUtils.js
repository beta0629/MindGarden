/**
 * 통합 스케줄 내담자 특이사항 noteType 라벨 SSOT
 * ScheduleClientNotesSection 공통코드 매핑(koreanName → codeLabel → codeValue)과 동일.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import {
  DEFAULT_NOTE_TYPE_CODE,
  SCHEDULE_CLIENT_NOTE_TYPE_GROUP
} from '../constants/clientScheduleNoteConstants';
import { getCommonCodes } from './commonCodeUtils';

export { SCHEDULE_CLIENT_NOTE_TYPE_GROUP };

/**
 * @param {Array<object>} codes getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP) 결과
 * @returns {Record<string, string>} codeValue → 표시 라벨
 */
export function buildScheduleClientNoteTypeLabelMap(codes) {
  const map = {};
  (codes || []).forEach((code) => {
    const value = code?.codeValue;
    if (!value) return;
    map[value] = code.koreanName || code.codeLabel || value;
  });
  return map;
}

/**
 * @param {string} codeValue
 * @param {Record<string, string>} labelMap
 * @returns {string}
 */
export function resolveScheduleClientNoteTypeLabel(codeValue, labelMap) {
  if (!codeValue) return '';
  return labelMap?.[codeValue] || codeValue;
}

/**
 * @param {object} note
 * @param {(codeValue: string) => string} getLabel
 * @returns {string}
 */
export function formatScheduleClientNoteMeta(note, getLabel) {
  const typeLabel = getLabel(note?.noteType);
  const parts = [typeLabel].filter(Boolean);
  if (note?.promiseDate) {
    parts.push(`약속일 ${note.promiseDate}`);
  }
  return parts.join(' · ');
}

/**
 * @returns {Promise<Record<string, string>>}
 */
export async function loadScheduleClientNoteTypeLabelMap() {
  try {
    const codes = await getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP);
    if (codes && codes.length > 0) {
      return buildScheduleClientNoteTypeLabelMap(codes);
    }
  } catch (error) {
    console.warn('특이사항 유형 코드 로드 실패:', error);
  }
  return { [DEFAULT_NOTE_TYPE_CODE]: '기타' };
}
