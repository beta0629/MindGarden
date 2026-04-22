import {
  CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
  CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS
} from '../constants/consultationLogAutosaveConstants';

const KEY_PREFIX = 'mg.cl.localDraft';

/**
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 * @returns {string}
 */
export function buildConsultationLogDraftStorageKey(tenantId, scope) {
  return `${KEY_PREFIX}.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:${tenantId}:${scope.type}:${scope.id}`;
}

/**
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 * @returns {{ formData: object, memoDraft: string } | null}
 */
export function readConsultationLogLocalDraft(tenantId, scope) {
  if (!tenantId || !scope?.type || scope.id == null || String(scope.id).trim() === '') {
    return null;
  }
  try {
    const raw = localStorage.getItem(buildConsultationLogDraftStorageKey(tenantId, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION) return null;
    if (typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS) {
      removeConsultationLogLocalDraft(tenantId, scope);
      return null;
    }
    if (!parsed.formData || typeof parsed.formData !== 'object') return null;
    return {
      formData: parsed.formData,
      memoDraft: typeof parsed.memoDraft === 'string' ? parsed.memoDraft : ''
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 * @param {{ formData: object, memoDraft: string }} payload
 */
export function writeConsultationLogLocalDraft(tenantId, scope, payload) {
  if (!tenantId || !scope?.type || scope.id == null || String(scope.id).trim() === '') {
    return;
  }
  const body = {
    v: CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
    savedAt: Date.now(),
    formData: payload.formData,
    memoDraft: payload.memoDraft ?? ''
  };
  localStorage.setItem(buildConsultationLogDraftStorageKey(tenantId, scope), JSON.stringify(body));
}

/**
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 */
export function removeConsultationLogLocalDraft(tenantId, scope) {
  if (!tenantId || !scope?.type || scope.id == null || String(scope.id).trim() === '') {
    return;
  }
  try {
    localStorage.removeItem(buildConsultationLogDraftStorageKey(tenantId, scope));
  } catch {
    // ignore
  }
}
