/**
 * 상담일지 서버 초안(DRAFT) — 세션 쿠키·X-Tenant-Id 기반 ajax 연동.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

import { CONSULTATION_LOG_SERVER_DRAFT_API_PATH } from '../constants/consultationLogAutosaveConstants';
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
 * 서버 초안 upsert(로컬 저장 성공 후 비동기 호출).
 *
 * @param {{
 *   consultationId: string,
 *   consultantId: number,
 *   formData: object,
 *   memoDraft: string,
 *   expectedVersion?: number|null
 * }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean, version?: number }>}
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
  const body = { payloadJson };
  const ev = toOptionalFiniteLong(expectedVersion);
  if (ev != null) {
    body.expectedVersion = ev;
  }
  const query = new URLSearchParams({
    consultationId: cid,
    consultantId: String(consId)
  }).toString();
  try {
    const data = await apiPut(`${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?${query}`, body);
    if (data == null) {
      return { ok: false, skipped: false };
    }
    const version = toOptionalFiniteLong(data.version);
    return { ok: true, version };
  } catch {
    return { ok: false, skipped: false };
  }
}
