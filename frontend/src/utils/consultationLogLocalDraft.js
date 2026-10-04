/**
 * 상담일지 **레거시** localStorage 초안 — 읽기 1회 + 전량 삭제 전용.
 *
 * <p>2026-10-04 이전 버전은 초안 본문을 {@code mg.cl.localDraft.v1:...} 키에 평문으로
 * 저장했다. 평문 보관은 금지되었으므로 쓰기 함수는 제거했고, 이 모듈은 다음만 한다.</p>
 * <ul>
 *   <li>{@link readLegacyConsultationLogLocalDraft} — 배포 후 첫 진입에서 남아 있는 값을
 *       <strong>한 번</strong> 읽어 복구 제안에 쓴다(사용자 글을 조용히 잃지 않기 위함).</li>
 *   <li>{@link removeConsultationLogLocalDraft} /
 *       {@link purgeAllLegacyConsultationLogLocalDrafts} — 삭제.</li>
 * </ul>
 * <p>복구 제안 이후에는 서버 초안으로 올리고 레거시 키를 즉시 지운다.</p>
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

import {
  CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX,
  CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
  CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS
} from '../constants/consultationLogAutosaveConstants';

/**
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 * @returns {string}
 */
export function buildConsultationLogDraftStorageKey(tenantId, scope) {
  return `${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}`
    + `.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:${tenantId}:${scope.type}:${scope.id}`;
}

function isValidScope(tenantId, scope) {
  return Boolean(tenantId) && Boolean(scope?.type) && scope.id != null && String(scope.id).trim() !== '';
}

/**
 * 레거시 평문 초안을 읽는다 (복구 제안 1회용). TTL 초과분은 읽지 않고 즉시 삭제한다.
 *
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 * @returns {{ formData: object, memoDraft: string, savedAt: number } | null}
 */
export function readLegacyConsultationLogLocalDraft(tenantId, scope) {
  if (!isValidScope(tenantId, scope)) {
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
      memoDraft: typeof parsed.memoDraft === 'string' ? parsed.memoDraft : '',
      savedAt: parsed.savedAt
    };
  } catch {
    return null;
  }
}

/**
 * 레거시 초안 1건 삭제.
 *
 * @param {string} tenantId
 * @param {{ type: string, id: string }} scope
 */
export function removeConsultationLogLocalDraft(tenantId, scope) {
  if (!isValidScope(tenantId, scope)) {
    return;
  }
  try {
    localStorage.removeItem(buildConsultationLogDraftStorageKey(tenantId, scope));
  } catch {
    // private mode 등
  }
}

/**
 * 레거시 평문 초안 키를 전부 삭제한다 (배포 후 첫 로드·로그아웃·계정 전환).
 *
 * @returns {number} 삭제한 키 개수
 */
export function purgeAllLegacyConsultationLogLocalDrafts() {
  let removed = 0;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => {
      localStorage.removeItem(key);
      removed += 1;
    });
  } catch {
    // private mode 등
  }
  return removed;
}
