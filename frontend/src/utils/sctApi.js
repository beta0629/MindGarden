/**
 * SCT 온라인 질문지 API 클라이언트 (StandardizedApi 전용)
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import StandardizedApi from './standardizedApi';
import { resolveApiObjectData, asArray } from './apiResponseNormalize';
import { SCT_API } from '../constants/sctOnline';

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
 * @param {string} token
 * @param {string} verifySessionId
 * @returns {Promise<object>}
 */
export async function fetchSctPublicForm(token, verifySessionId) {
  const res = await StandardizedApi.get(
    SCT_API.publicForm(token),
    { verifySessionId },
    { skipSessionRefresh: true }
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
 * @param {number|string} id
 * @returns {Promise<*>}
 */
export async function resendSctSms(id) {
  return StandardizedApi.post(SCT_API.resendSms(id), {});
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
