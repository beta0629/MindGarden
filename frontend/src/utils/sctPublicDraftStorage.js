/**
 * SCT 공개 응답 — 기기 로컬 임시저장 (verify 세션 만료 대비).
 * opaque token 키만 사용. PII는 사용자가 입력한 답 텍스트만.
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
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null|undefined} answersMap
 * @returns {boolean} 저장 성공 여부
 */
export function saveSctPublicDraft(token, answersMap) {
  const key = buildSctPublicDraftKey(token);
  if (!key || typeof localStorage === 'undefined') {
    return false;
  }
  const normalized = normalizeAnswersMap(answersMap || {});
  if (normalized == null) {
    return false;
  }
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        v: 1,
        savedAt: new Date().toISOString(),
        answersMap: normalized
      })
    );
    return true;
  } catch {
    return false;
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
 * 서버 답 + 로컬 답 병합. 로컬의 비어 있지 않은 값이 우선.
 *
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>} serverMap
 * @param {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>|null} localMap
 * @returns {Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>}
 */
export function mergeSctPublicAnswers(serverMap, localMap) {
  const base = { ...(serverMap || {}) };
  if (!localMap || typeof localMap !== 'object') {
    return base;
  }
  Object.keys(localMap).forEach((key) => {
    const local = localMap[key];
    if (!local || local.formItemId == null) {
      return;
    }
    const id = String(local.formItemId);
    const hasText = local.answerText != null && String(local.answerText).trim() !== '';
    const hasNa = Boolean(local.notApplicable);
    if (!hasText && !hasNa) {
      return;
    }
    base[id] = {
      formItemId: Number(local.formItemId),
      answerText: hasText ? String(local.answerText) : '',
      notApplicable: hasNa
    };
  });
  return base;
}
