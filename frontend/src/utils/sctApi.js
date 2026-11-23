/**
 * SCT 온라인 질문지 API 클라이언트 (StandardizedApi 전용)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import StandardizedApi from './standardizedApi';
import { resolveApiObjectData, asArray } from './apiResponseNormalize';
import { SCT_API, SCT_VERIFY_SESSION_HEADER } from '../constants/sctOnline';

/**
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function fetchSctPublicMeta(token) {
  const res = await StandardizedApi.get(SCT_API.publicMeta(token), {}, { skipSessionRefresh: true });
  return resolveApiObjectData(res) || res;
}

/**
 * @param {string} token
 * @param {{ phone?: string, email?: string }} body
 * @returns {Promise<object>}
 */
export async function verifySctPublic(token, body) {
  const res = await StandardizedApi.post(SCT_API.publicVerify(token), body, {
    skipSessionRefresh: true
  });
  return resolveApiObjectData(res) || res;
}

/**
 * GET form — verifySessionId 는 쿼리가 아니라 헤더 {@link SCT_VERIFY_SESSION_HEADER}.
 *
 * @param {string} token
 * @param {string} verifySessionId
 * @returns {Promise<object>}
 */
export async function fetchSctPublicForm(token, verifySessionId) {
  const res = await StandardizedApi.get(
    SCT_API.publicForm(token),
    {},
    {
      skipSessionRefresh: true,
      headers: { [SCT_VERIFY_SESSION_HEADER]: verifySessionId }
    }
  );
  return resolveApiObjectData(res) || res;
}

/**
 * @param {string} token
 * @param {{ verifySessionId: string, answers: Array }} body
 * @returns {Promise<*>}
 */
export async function saveSctDraft(token, body) {
  return StandardizedApi.put(SCT_API.publicDraft(token), body, { skipSessionRefresh: true });
}

/**
 * @param {string} token
 * @param {object} body
 * @returns {Promise<*>}
 */
export async function saveSctConsent(token, body) {
  return StandardizedApi.post(SCT_API.publicConsents(token), body, { skipSessionRefresh: true });
}

/**
 * @param {string} token
 * @param {{ verifySessionId: string }} body
 * @returns {Promise<*>}
 */
export async function submitSct(token, body) {
  return StandardizedApi.post(SCT_API.publicSubmit(token), body, { skipSessionRefresh: true });
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchSctForms() {
  const res = await StandardizedApi.get(SCT_API.FORMS);
  return asArray(res, 'data');
}

/**
 * @param {number|string} clientId
 * @returns {Promise<object[]>}
 */
export async function fetchSctClientInvitations(clientId) {
  const res = await StandardizedApi.get(SCT_API.clientInvitations(clientId));
  return asArray(res, 'data');
}

/**
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function createSctInvitation(body) {
  const res = await StandardizedApi.post(SCT_API.INVITATIONS, body);
  return resolveApiObjectData(res) || res;
}

/**
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function fetchSctInvitation(id) {
  const res = await StandardizedApi.get(SCT_API.invitation(id));
  return resolveApiObjectData(res) || res;
}

/**
 * @param {number|string} id
 * @returns {Promise<*>}
 */
export async function cancelSctInvitation(id) {
  return StandardizedApi.post(SCT_API.cancelInvitation(id), {});
}

/**
 * ADMIN — 파기 대상 응답 수동 파기.
 *
 * @param {number|string} id
 * @returns {Promise<*>}
 */
export async function destroySctInvitation(id) {
  return StandardizedApi.delete(SCT_API.destroyInvitation(id));
}

/**
 * @param {number|string} id
 * @returns {Promise<*>}
 */
export async function resendSctSms(id) {
  return StandardizedApi.post(SCT_API.resendSms(id), {});
}

/**
 * 공개 링크 재발급(토큰 회전, SMS 없음).
 *
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function reissueSctLink(id) {
  const res = await StandardizedApi.post(SCT_API.reissueLink(id), {});
  return resolveApiObjectData(res) || res;
}

/**
 * 미연결 초대 목록(ADMIN/STAFF).
 *
 * @returns {Promise<object[]>}
 */
export async function fetchSctUnlinkedInvitations() {
  const res = await StandardizedApi.get(SCT_API.UNLINKED);
  return asArray(res, 'data');
}

/**
 * @param {{ clientId: number, mappingId?: number }} params
 * @returns {Promise<object>}
 */
export async function fetchSctSessionView(params) {
  const res = await StandardizedApi.get(SCT_API.SESSION_VIEW, params);
  return resolveApiObjectData(res) || res;
}

/**
 * @param {number|string} clientId
 * @returns {Promise<object>}
 */
export async function fetchSctLatestSubmitted(clientId) {
  const res = await StandardizedApi.get(SCT_API.clientLatestSubmitted(clientId));
  return resolveApiObjectData(res) || res;
}

/**
 * @returns {Promise<object>}
 */
export async function fetchSctSettings() {
  const res = await StandardizedApi.get(SCT_API.SETTINGS);
  return resolveApiObjectData(res) || res;
}

/**
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function updateSctSettings(body) {
  const res = await StandardizedApi.put(SCT_API.SETTINGS, body);
  return resolveApiObjectData(res) || res;
}

/**
 * @param {number|string} id
 * @returns {Promise<object[]>}
 */
export async function fetchSctLinkCandidates(id) {
  const res = await StandardizedApi.get(SCT_API.linkCandidates(id));
  return asArray(res, 'data');
}

/**
 * @param {number|string} id
 * @param {{ clientId: number, mappingId?: number }} body
 * @returns {Promise<object>}
 */
export async function linkSctInvitation(id, body) {
  const res = await StandardizedApi.post(SCT_API.link(id), body);
  return resolveApiObjectData(res) || res;
}

/**
 * @param {number|string} id
 * @returns {Promise<*>}
 */
export async function unlinkSctInvitation(id) {
  return StandardizedApi.delete(SCT_API.link(id));
}

/**
 * @param {number|string} invitationId
 * @returns {Promise<object[]>}
 */
export async function fetchSctDomainMemos(invitationId) {
  const res = await StandardizedApi.get(SCT_API.domainMemos(invitationId));
  return asArray(res, 'data');
}

/**
 * @param {number|string} invitationId
 * @param {string} domainCode
 * @param {{ memoText: string }} body
 * @returns {Promise<object>}
 */
export async function upsertSctDomainMemo(invitationId, domainCode, body) {
  const res = await StandardizedApi.put(SCT_API.domainMemo(invitationId, domainCode), body);
  return resolveApiObjectData(res) || res;
}

/**
 * ADMIN — 내담자 단위 동의 철회.
 *
 * @param {number|string} clientId
 * @returns {Promise<*>}
 */
export async function revokeSctClientConsent(clientId) {
  return StandardizedApi.post(SCT_API.revokeConsent(clientId), {});
}

/**
 * 응답 인쇄 감사 로그(VIEW 와 별도 PRINT).
 *
 * @param {number|string} invitationId
 * @returns {Promise<*>}
 */
export async function recordSctPrintAudit(invitationId) {
  return StandardizedApi.post(SCT_API.printAudit(invitationId), {});
}
