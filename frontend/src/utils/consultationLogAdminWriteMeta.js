/**
 * 상담일지 응답의 관리자 작성·수정 메타(lastEditedById·lastEditedByRole·lastEditedAt·writtenByAdmin·editedByAdmin)를
 * 배지 표시용 값으로 정규화한다. 본문 필드는 읽지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import {
  CONSULTATION_LOG_ADMIN_ROLE_LABELS,
  CONSULTATION_LOG_ADMIN_WRITE_STRINGS
} from '../constants/consultationLogAdminWriteStrings';
import { toDisplayString } from './safeDisplay';

const ISO_DATE_TIME_LENGTH = 16;

/**
 * 서버 LocalDateTime 문자열(KST) → "YYYY-MM-DD HH:mm". 해석 불가 시 빈 문자열.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const formatConsultationLogEditedAt = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '';
  }
  const normalized = value.trim().replace('T', ' ');
  return normalized.length >= ISO_DATE_TIME_LENGTH
    ? normalized.slice(0, ISO_DATE_TIME_LENGTH)
    : normalized;
};

/**
 * @param {unknown} role
 * @returns {string}
 */
export const resolveConsultationLogEditorRoleLabel = (role) => {
  const code = typeof role === 'string' ? role.trim().toUpperCase() : '';
  if (code && CONSULTATION_LOG_ADMIN_ROLE_LABELS[code]) {
    return CONSULTATION_LOG_ADMIN_ROLE_LABELS[code];
  }
  return CONSULTATION_LOG_ADMIN_WRITE_STRINGS.ROLE_FALLBACK;
};

/**
 * @param {object|null|undefined} record 상담일지 응답(단건·목록 메타)
 * @returns {{ kind: 'edited'|'written', label: string, editorRoleLabel: string, editedAtLabel: string }|null}
 *   관리자 작성·수정 이력이 없으면 null
 */
export const resolveConsultationLogAdminWriteMeta = (record) => {
  if (!record || typeof record !== 'object') {
    return null;
  }
  const edited = record.editedByAdmin === true;
  const written = record.writtenByAdmin === true;
  if (!edited && !written) {
    return null;
  }
  return {
    kind: edited ? 'edited' : 'written',
    label: edited
      ? CONSULTATION_LOG_ADMIN_WRITE_STRINGS.BADGE_EDITED
      : CONSULTATION_LOG_ADMIN_WRITE_STRINGS.BADGE_WRITTEN,
    editorRoleLabel: toDisplayString(
      resolveConsultationLogEditorRoleLabel(record.lastEditedByRole),
      CONSULTATION_LOG_ADMIN_WRITE_STRINGS.ROLE_FALLBACK
    ),
    editedAtLabel: formatConsultationLogEditedAt(record.lastEditedAt)
  };
};
