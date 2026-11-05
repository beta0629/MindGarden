/**
 * 상담일지 서버 초안(DRAFT) — 세션 쿠키·X-Tenant-Id 기반 ajax 연동.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

import {
  CONSULTATION_LOG_DRAFT_EXPECTED_VERSION_FIELD,
  CONSULTATION_LOG_DRAFT_VERSION_CONFLICT_RETRY_COUNT,
  CONSULTATION_LOG_SERVER_DRAFT_API_PATH
} from '../constants/consultationLogAutosaveConstants';
import { apiGet, apiPut } from './ajax';

/**
 * @param {*} v
 * @returns {number|undefined}
 */
function toOptionalFiniteLong(v) {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * expectedVersion 불일치(400) 여부.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isConsultationLogDraftVersionConflict(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }
  if (error.status != null && Number(error.status) !== 400) {
    return false;
  }
  const data = error.response?.data;
  const field = data?.field ?? data?.error ?? data?.errorCode ?? '';
  if (String(field) === CONSULTATION_LOG_DRAFT_EXPECTED_VERSION_FIELD) {
    return true;
  }
  const message = String(error.message || data?.message || '');
  return message.includes(CONSULTATION_LOG_DRAFT_EXPECTED_VERSION_FIELD)
    || message.includes('초안 버전');
}

/**
 * 서버 초안 조회(버전 시드·hasDraft).
 *
 * @param {{ consultationId: string, consultantId: number }} args
 * @returns {Promise<{
 *   ok: boolean,
 *   skipped?: boolean,
 *   hasDraft?: boolean,
 *   version?: number,
 *   payloadJson?: string|null,
 *   notAuthenticated?: boolean
 * }>}
 */
export async function fetchConsultationLogDraftFromServer({ consultationId, consultantId }) {
  const cid = consultationId != null ? String(consultationId).trim() : '';
  const consId = toOptionalFiniteLong(consultantId);
  if (!cid || consId == null) {
    return { ok: false, skipped: true };
  }
  try {
    const data = await apiGet(CONSULTATION_LOG_SERVER_DRAFT_API_PATH, {
      consultationId: cid,
      consultantId: String(consId)
    });
    if (data == null) {
      return { ok: false, skipped: false, notAuthenticated: true };
    }
    const version = toOptionalFiniteLong(data.version);
    const hasDraft = Boolean(data.hasDraft);
    const payloadJson = data.payloadJson != null ? String(data.payloadJson) : null;
    return {
      ok: true,
      hasDraft,
      version,
      payloadJson
    };
  } catch {
    return { ok: false, skipped: false };
  }
}

/**
 * @param {{
 *   consultationId: string,
 *   consultantId: number,
 *   payloadJson: string,
 *   expectedVersion?: number|null
 * }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean, version?: number }>}
 */
async function putDraftOnce({ consultationId, consultantId, payloadJson, expectedVersion }) {
  const body = { payloadJson };
  const ev = toOptionalFiniteLong(expectedVersion);
  if (ev != null) {
    body.expectedVersion = ev;
  }
  const query = new URLSearchParams({
    consultationId,
    consultantId: String(consultantId)
  }).toString();
  const data = await apiPut(`${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?${query}`, body);
  if (data == null) {
    return { ok: false, skipped: false };
  }
  const version = toOptionalFiniteLong(data.version);
  return { ok: true, version };
}

/**
 * 서버 초안 upsert(로컬 저장 성공 후 비동기 호출).
 * expectedVersion 400 시 재조회 후 합리적 1회 재시도.
 *
 * @param {{
 *   consultationId: string,
 *   consultantId: number,
 *   formData: object,
 *   memoDraft: string,
 *   expectedVersion?: number|null
 * }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean, version?: number, versionConflict?: boolean }>}
 */
export async function pushConsultationLogDraftToServer({
  consultationId,
  consultantId,
  formData,
  memoDraft,
  expectedVersion
}) {
  const cid = consultationId != null ? String(consultationId).trim() : '';
  const consId = toOptionalFiniteLong(consultantId);
  if (!cid || consId == null) {
    return { ok: false, skipped: true };
  }
  let payloadJson;
  try {
    payloadJson = JSON.stringify({ formData, memoDraft });
  } catch {
    return { ok: false, skipped: true };
  }

  let attemptVersion = expectedVersion;
  const maxAttempts = 1 + CONSULTATION_LOG_DRAFT_VERSION_CONFLICT_RETRY_COUNT;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await putDraftOnce({
        consultationId: cid,
        consultantId: consId,
        payloadJson,
        expectedVersion: attemptVersion
      });
    } catch (error) {
      const canRetry = attempt < CONSULTATION_LOG_DRAFT_VERSION_CONFLICT_RETRY_COUNT
        && isConsultationLogDraftVersionConflict(error);
      if (!canRetry) {
        return {
          ok: false,
          skipped: false,
          versionConflict: isConsultationLogDraftVersionConflict(error)
        };
      }
      const latest = await fetchConsultationLogDraftFromServer({
        consultationId: cid,
        consultantId: consId
      });
      if (!latest.ok || latest.version == null) {
        return { ok: false, skipped: false, versionConflict: true };
      }
      attemptVersion = latest.version;
    }
  }

  return { ok: false, skipped: false, versionConflict: true };
}
