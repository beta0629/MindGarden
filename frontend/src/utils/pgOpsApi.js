import { apiGet, apiPost } from './ajax';

/**
 * 운영 포털 PG 설정 관련 API 호출 유틸리티
 * 운영 포털용 PG 설정 승인/관리 API
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

const PG_OPS_API = {
  // 운영 포털 API
  GET_PENDING: '/api/v1/ops/pg-configurations/pending',
  APPROVE: '/api/v1/ops/pg-configurations',
  REJECT: '/api/v1/ops/pg-configurations',
  GET_ALL: '/api/v1/ops/pg-configurations',
  GET_DETAIL: '/api/v1/ops/pg-configurations',
  TEST_CONNECTION: '/api/v1/ops/pg-configurations',
  ACTIVATE: '/api/v1/ops/pg-configurations',
  DEACTIVATE: '/api/v1/ops/pg-configurations',
  DECRYPT_KEYS: '/api/v1/ops/pg-configurations',
};

/**
 * 승인 대기 중인 PG 설정 목록 조회
 * @param {Object} filters - 필터 옵션 (tenantId, pgProvider)
 * @returns {Promise<Array>} 승인 대기 목록
 */
export const getPendingPgConfigurations = async (filters = {}) => {
  try {
    const response = await apiGet(PG_OPS_API.GET_PENDING, filters);
    return response || [];
  } catch (error) {
    console.error('승인 대기 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 모든 PG 설정 목록 조회 (운영 포털용)
 * @param {Object} filters - 필터 옵션
 * @returns {Promise<Array>} PG 설정 목록
 */
export const getAllPgConfigurationsForOps = async (filters = {}) => {
  try {
    const response = await apiGet(PG_OPS_API.GET_ALL, filters);
    return response || [];
  } catch (error) {
    console.error('PG 설정 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 상세 조회 (운영 포털용)
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} PG 설정 상세 정보
 */
export const getPgConfigurationDetailForOps = async (configId) => {
  try {
    const response = await apiGet(`${PG_OPS_API.GET_DETAIL}/${configId}`);
    return response;
  } catch (error) {
    console.error('PG 설정 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 승인
 * @param {string} configId - PG 설정 ID
 * @param {Object} request - 승인 요청 (approvedBy, testConnection 등)
 * @returns {Promise<Object>} 승인된 PG 설정 정보
 */
export const approvePgConfiguration = async (configId, request) => {
  try {
    const response = await apiPost(`${PG_OPS_API.APPROVE}/${configId}/approve`, request);
    return response;
  } catch (error) {
    console.error('PG 설정 승인 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 거부
 * @param {string} configId - PG 설정 ID
 * @param {Object} request - 거부 요청 (rejectedBy, rejectionReason)
 * @returns {Promise<Object>} 거부된 PG 설정 정보
 */
export const rejectPgConfiguration = async (configId, request) => {
  try {
    const response = await apiPost(`${PG_OPS_API.REJECT}/${configId}/reject`, request);
    return response;
  } catch (error) {
    console.error('PG 설정 거부 실패:', error);
    throw error;
  }
};

/**
 * PG 연결 테스트 (운영 포털용)
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} 연결 테스트 결과
 */
export const testPgConnectionForOps = async (configId) => {
  try {
    const response = await apiPost(`${PG_OPS_API.TEST_CONNECTION}/${configId}/test-connection`, {});
    return response;
  } catch (error) {
    console.error('PG 연결 테스트 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 활성화
 * @param {string} configId - PG 설정 ID
 * @param {string} activatedBy - 활성화한 사용자
 * @returns {Promise<Object>} 활성화된 PG 설정 정보
 */
export const activatePgConfiguration = async (configId, activatedBy) => {
  try {
    const response = await apiPost(`${PG_OPS_API.ACTIVATE}/${configId}/activate`, { activatedBy });
    return response;
  } catch (error) {
    console.error('PG 설정 활성화 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 비활성화
 * @param {string} configId - PG 설정 ID
 * @param {string} deactivatedBy - 비활성화한 사용자
 * @returns {Promise<Object>} 비활성화된 PG 설정 정보
 */
export const deactivatePgConfiguration = async (configId, deactivatedBy) => {
  try {
    const response = await apiPost(`${PG_OPS_API.DEACTIVATE}/${configId}/deactivate`, { deactivatedBy });
    return response;
  } catch (error) {
    console.error('PG 설정 비활성화 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 키 복호화 (운영 포털용)
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} 복호화된 키 정보
 */
export const decryptPgKeysForOps = async (configId) => {
  try {
    const response = await apiPost(`${PG_OPS_API.DECRYPT_KEYS}/${configId}/decrypt-keys`, {});
    return response;
  } catch (error) {
    console.error('PG 설정 키 복호화 실패:', error);
    throw error;
  }
};

