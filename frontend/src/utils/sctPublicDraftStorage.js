/**
 * SCT 공개 응답 — 레거시 localStorage 초안 키 정리 전용.
 * 답변 본문(answersMap)은 localStorage에 저장하지 않는다. 서버 암호화 draft만 사용.
 *
 * @author MindGarden
 * @since 2026-03-27
 */

import { SCT_PUBLIC_DRAFT_LS_PREFIX } from '../constants/sctOnline';

/**
 * @param {string|null|undefined} token
 * @returns {string|null}
 */
export function buildSctPublicDraftKey(token) {
  if (token == null) return null;
  const t = String(token).trim();
  if (!t) return null;
  return `${SCT_PUBLIC_DRAFT_LS_PREFIX}:${t}`;
}

/**
 * @param {unknown} raw
 * @returns {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null}
 */
function normalizeAnswersMap(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const out = {};
  Object.keys(raw).forEach((key) => {
    const row = raw[key];
    if (row == null || typeof row !== 'object' || Array.isArray(row)) {
      return;
    }
    const formItemId = Number(row.formItemId);
    if (!Number.isFinite(formItemId)) {
      return;
    }
    out[String(formItemId)] = {
      formItemId,
      answerText: row.answerText == null ? '' : String(row.answerText),
      notApplicable: Boolean(row.notApplicable)
    };
  });
  return out;
}

/**
 * 레거시 키 읽기(정리용). 페이지 상태 병합에는 사용하지 않는다.
 *
 * @param {string|null|undefined} token
 * @returns {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null}
 */
export function loadSctPublicDraft(token) {
  const key = buildSctPublicDraftKey(token);
  if (!key || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const answers = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed.answersMap != null ? parsed.answersMap : parsed)
      : null;
    return normalizeAnswersMap(answers);
  } catch {
    return null;
  }
}

/**
 * @param {string|null|undefined} token
 */
export function clearSctPublicDraft(token) {
  const key = buildSctPublicDraftKey(token);
  if (!key || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * 답변 본문 localStorage 저장 금지. 레거시 키가 있으면 삭제만 수행.
 *
 * @param {string|null|undefined} token
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null|undefined} _answersMap
 * @returns {boolean} 항상 false (로컬 답변 미러 비활성)
 */
export function saveSctPublicDraft(token, _answersMap) {
  clearSctPublicDraft(token);
  return false;
}

/**
 * 서버 답만 사용. localMap은 무시(레거시 시그니처 유지).
 *
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>} serverMap
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null} _localMap
 * @returns {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>}
 */
export function mergeSctPublicAnswers(serverMap, _localMap) {
  return { ...(serverMap || {}) };
}
