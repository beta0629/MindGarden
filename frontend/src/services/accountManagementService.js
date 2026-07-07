/**
 * 계좌 관리 API — StandardizedApi (tenantId 자동)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import StandardizedApi from '../utils/standardizedApi';
import {
  ACCOUNT_API,
  buildAccountItemPath,
  buildAccountSetPrimaryPath,
  buildAccountToggleStatusPath
} from '../constants/account';

function unwrapList(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && Array.isArray(raw.data)) return raw.data;
  return [];
}

function unwrapData(raw) {
  if (raw && raw.success === true && raw.data !== undefined) {
    return raw.data;
  }
  if (raw && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

/**
 * 활성 계좌 목록 조회
 * @returns {Promise<Array>}
 */
export async function listActiveAccounts() {
  const raw = await StandardizedApi.get(ACCOUNT_API.ACTIVE);
  return unwrapList(raw);
}

/**
 * 은행 목록 조회
 * @returns {Promise<Array>}
 */
export async function listAccountBanks() {
  const raw = await StandardizedApi.get(ACCOUNT_API.BANKS);
  return unwrapList(raw);
}

/**
 * 계좌 등록
 * @param {object} payload
 * @returns {Promise<any>}
 */
export async function createAccount(payload) {
  const raw = await StandardizedApi.post(ACCOUNT_API.BASE, payload);
  return unwrapData(raw);
}

/**
 * 계좌 수정
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<any>}
 */
export async function updateAccount(id, payload) {
  const raw = await StandardizedApi.put(buildAccountItemPath(id), payload);
  return unwrapData(raw);
}

/**
 * 계좌 삭제
 * @param {number|string} id
 * @returns {Promise<any>}
 */
export async function deleteAccount(id) {
  const raw = await StandardizedApi.delete(buildAccountItemPath(id));
  return unwrapData(raw);
}

/**
 * 활성 상태 토글
 * @param {number|string} id
 * @returns {Promise<any>}
 */
export async function toggleAccountStatus(id) {
  const raw = await StandardizedApi.patch(buildAccountToggleStatusPath(id));
  return unwrapData(raw);
}

/**
 * 기본 계좌 설정
 * @param {number|string} id
 * @returns {Promise<any>}
 */
export async function setPrimaryAccount(id) {
  const raw = await StandardizedApi.patch(buildAccountSetPrimaryPath(id));
  return unwrapData(raw);
}
