/**
 * 상담일지 서버 초안(DRAFT) — 세션 쿠키·X-Tenant-Id 기반 연동 (1차 저장소).
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

import {
  CONSULTATION_LOG_DRAFT_EXPECTED_VERSION_FIELD,
  CONSULTATION_LOG_DRAFT_VERSION_CONFLICT_RETRY_COUNT,
  CONSULTATION_LOG_SERVER_DRAFT_API_PATH
} from '../constants/consultationLogAutosaveConstants';
import { apiDelete, apiGet, apiPut } from './ajax';
import { getDefaultApiHeaders } from './apiHeaders';

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
 * 초안 요청 쿼리 문자열.
 *
 * @param {string} consultationId
 * @param {number} consultantId
 * @returns {string}
 */
export function buildConsultationLogDraftQuery(consultationId, consultantId) {
  return new URLSearchParams({
    consultationId: String(consultationId),
    consultantId: String(consultantId)
  }).toString();
}

/**
 * 인증 만료(401) 오류 여부.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isConsultationLogDraftUnauthorized(error) {
  if (!error || typeof error !== 'object') return false;
  return Number(error.status) === 401;
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
 * 서버 초안 조회(복구 후보·버전 시드).
 *
 * @param {{ consultationId: string, consultantId: number }} args
 * @returns {Promise<{
 *   ok: boolean,
 *   skipped?: boolean,
 *   hasDraft?: boolean,
 *   version?: number,
 *   payloadJson?: string|null,
 *   updatedAt?: string|null,
 *   notAuthenticated?: boolean,
 *   forbidden?: boolean
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
    return {
      ok: true,
      hasDraft: Boolean(data.hasDraft),
      version: toOptionalFiniteLong(data.version),
      payloadJson: data.payloadJson != null ? String(data.payloadJson) : null,
      updatedAt: data.updatedAt != null ? String(data.updatedAt) : null
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      notAuthenticated: isConsultationLogDraftUnauthorized(error),
      forbidden: Number(error?.status) === 403
    };
  }
}

/**
 * @param {{
 *   consultationId: string,
 *   consultantId: number,
 *   payloadJson: string,
 *   expectedVersion?: number|null
 * }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean, version?: number, updatedAt?: string|null }>}
 */
async function putDraftOnce({ consultationId, consultantId, payloadJson, expectedVersion }) {
  const body = { payloadJson };
  const ev = toOptionalFiniteLong(expectedVersion);
  if (ev != null) {
    body.expectedVersion = ev;
  }
  const query = buildConsultationLogDraftQuery(consultationId, consultantId);
  const data = await apiPut(`${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?${query}`, body);
  if (data == null) {
    return { ok: false, skipped: false };
  }
  return {
    ok: true,
    version: toOptionalFiniteLong(data.version),
    updatedAt: data.updatedAt != null ? String(data.updatedAt) : null
  };
}

/**
 * 서버 초안 upsert (1차 저장). expectedVersion 400 시 재조회 후 1회 재시도.
 *
 * @param {{
 *   consultationId: string,
 *   consultantId: number,
 *   payloadJson: string,
 *   expectedVersion?: number|null
 * }} args
 * @returns {Promise<{
 *   ok: boolean, skipped?: boolean, version?: number, updatedAt?: string|null,
 *   versionConflict?: boolean, notAuthenticated?: boolean
 * }>}
 */
export async function pushConsultationLogDraftToServer({
  consultationId,
  consultantId,
  payloadJson,
  expectedVersion
}) {
  const cid = consultationId != null ? String(consultationId).trim() : '';
  const consId = toOptionalFiniteLong(consultantId);
  if (!cid || consId == null || typeof payloadJson !== 'string') {
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
      if (isConsultationLogDraftUnauthorized(error)) {
        return { ok: false, skipped: false, notAuthenticated: true };
      }
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

/**
 * 서버 초안 삭제 (버리기·확정 저장 후 정리).
 *
 * @param {{ consultationId: string, consultantId: number }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean }>}
 */
export async function deleteConsultationLogDraftOnServer({ consultationId, consultantId }) {
  const cid = consultationId != null ? String(consultationId).trim() : '';
  const consId = toOptionalFiniteLong(consultantId);
  if (!cid || consId == null) {
    return { ok: false, skipped: true };
  }
  try {
    const query = buildConsultationLogDraftQuery(cid, consId);
    await apiDelete(`${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?${query}`);
    return { ok: true };
  } catch {
    return { ok: false, skipped: false };
  }
}

/**
 * 화면 이탈(visibilitychange hidden · pagehide) 시 마지막 초안을 끝까지 보낸다.
 *
 * <p>{@code sendBeacon} 은 커스텀 헤더(X-XSRF-TOKEN 등)를 붙일 수 없고 메서드가 POST 로
 * 고정되어 초안 PUT 엔드포인트·CSRF 정책과 맞지 않는다. 그래서
 * <strong>{@code fetch(..., { keepalive: true })}</strong> 를 쓴다. 세션 쿠키는
 * {@code credentials: 'include'} 로 함께 가고, 기존 공통 헤더(테넌트·CSRF)도 그대로
 * 적용할 수 있다. keepalive 미지원 브라우저에서는 일반 비동기 PUT 으로 폴백한다.</p>
 *
 * @param {{ consultationId: string, consultantId: number, payloadJson: string,
 *   expectedVersion?: number|null }} args
 * @returns {Promise<{ ok: boolean, skipped?: boolean }>}
 */
export async function flushConsultationLogDraftWithKeepalive({
  consultationId,
  consultantId,
  payloadJson,
  expectedVersion
}) {
  const cid = consultationId != null ? String(consultationId).trim() : '';
  const consId = toOptionalFiniteLong(consultantId);
  if (!cid || consId == null || typeof payloadJson !== 'string') {
    return { ok: false, skipped: true };
  }
  const supportsKeepalive = typeof fetch === 'function'
    && typeof Request === 'function'
    && 'keepalive' in Request.prototype;
  if (!supportsKeepalive) {
    const res = await pushConsultationLogDraftToServer({
      consultationId: cid,
      consultantId: consId,
      payloadJson,
      expectedVersion
    });
    return { ok: Boolean(res.ok) };
  }
  const body = { payloadJson };
  const ev = toOptionalFiniteLong(expectedVersion);
  if (ev != null) {
    body.expectedVersion = ev;
  }
  const query = buildConsultationLogDraftQuery(cid, consId);
  try {
    const response = await fetch(`${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?${query}`, {
      method: 'PUT',
      credentials: 'include',
      keepalive: true,
      headers: getDefaultApiHeaders(),
      body: JSON.stringify(body)
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}
