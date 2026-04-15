import StandardizedApi from './standardizedApi';

/**
 * PG 설정 관련 API 호출 유틸리티 (테넌트 포털).
 * 모든 호출은 StandardizedApi 를 통해 수행한다.
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

/** 테넌트 PG API 베이스 (백엔드: tenants/{tenantId}/pg-configurations) */
const getTenantPgBase = (tenantId) => `/api/v1/tenants/${tenantId}/pg-configurations`;

/**
 * PG 설정 목록 조회
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {Object} params - 쿼리 파라미터 (status, approvalStatus)
 * @returns {Promise<Array>} PG 설정 목록
 */
export const getPgConfigurations = async(tenantId, params = {}) => {
  try {
    const response = await StandardizedApi.get(getTenantPgBase(tenantId), params);
    return response || [];
  } catch (error) {
    console.error('PG 설정 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 상세 조회
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} PG 설정 상세 정보
 */
export const getPgConfigurationDetail = async(tenantId, configId) => {
  try {
    const response = await StandardizedApi.get(`${getTenantPgBase(tenantId)}/${configId}`);
    return response;
  } catch (error) {
    console.error('PG 설정 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 생성
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {Object} request - PG 설정 생성 요청
 * @returns {Promise<Object>} 생성된 PG 설정 정보
 */
export const createPgConfiguration = async(tenantId, request) => {
  try {
    const response = await StandardizedApi.post(getTenantPgBase(tenantId), request);
    return response;
  } catch (error) {
    console.error('PG 설정 생성 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 수정
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {string} configId - PG 설정 ID
 * @param {Object} request - PG 설정 수정 요청
 * @returns {Promise<Object>} 수정된 PG 설정 정보
 */
export const updatePgConfiguration = async(tenantId, configId, request) => {
  try {
    const response = await StandardizedApi.put(`${getTenantPgBase(tenantId)}/${configId}`, request);
    return response;
  } catch (error) {
    console.error('PG 설정 수정 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 삭제
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<void>}
 */
export const deletePgConfiguration = async(tenantId, configId) => {
  try {
    await StandardizedApi.delete(`${getTenantPgBase(tenantId)}/${configId}`);
  } catch (error) {
    console.error('PG 설정 삭제 실패:', error);
    throw error;
  }
};

/**
 * PG 연결 테스트
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} 연결 테스트 결과
 */
export const testPgConnection = async(tenantId, configId) => {
  try {
    const response = await StandardizedApi.post(
      `${getTenantPgBase(tenantId)}/${configId}/test-connection`,
      {}
    );
    return response;
  } catch (error) {
    console.error('PG 연결 테스트 실패:', error);
    throw error;
  }
};

/**
 * PG 설정 키 복호화 (테넌트용)
 *
 * @param {string} tenantId - 테넌트 ID
 * @param {string} configId - PG 설정 ID
 * @returns {Promise<Object>} 복호화된 키 정보
 */
export const decryptPgKeys = async(tenantId, configId) => {
  try {
    const response = await StandardizedApi.post(
      `${getTenantPgBase(tenantId)}/${configId}/decrypt-keys`,
      {}
    );
    return response;
  } catch (error) {
    console.error('PG 설정 키 복호화 실패:', error);
    throw error;
  }
};
