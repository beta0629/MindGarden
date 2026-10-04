import { apiGet } from './ajax';

/**
 * 테넌트 ERD 조회 API 유틸리티.
 * 세션 테넌트 관리자 전용(/api/v1/tenants/{tenantId}/erd). 운영 포털 ERD(/api/v1/ops/erd)는 Ops 운영자 전용이라 여기서 호출하지 않는다.
 */

const ERD_API = {
  // 테넌트 포털 API
  GET_TENANT_ERDS: '/api/v1/tenants',
  GET_ERD_DETAIL: '/api/v1/tenants',
  GET_ERD_HISTORY: '/api/v1/tenants'
};

/**
 * 테넌트 ERD 목록 조회
/**
 * @param {string} tenantId - 테넌트 ID
/**
 * @returns {Promise<Array>} ERD 목록
 */
export const getTenantErds = async(tenantId) => {
  try {
    const response = await apiGet(`${ERD_API.GET_TENANT_ERDS}/${tenantId}/erd`);
    return response || [];
  } catch (error) {
    console.error('ERD 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * ERD 상세 조회
/**
 * @param {string} tenantId - 테넌트 ID
/**
 * @param {string} diagramId - ERD 다이어그램 ID
/**
 * @returns {Promise<Object>} ERD 상세 정보
 */
export const getErdDetail = async(tenantId, diagramId) => {
  try {
    const response = await apiGet(`${ERD_API.GET_ERD_DETAIL}/${tenantId}/erd/${diagramId}`);
    return response;
  } catch (error) {
    console.error('ERD 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * ERD 변경 이력 조회
/**
 * @param {string} tenantId - 테넌트 ID
/**
 * @param {string} diagramId - ERD 다이어그램 ID
/**
 * @returns {Promise<Array>} ERD 변경 이력 목록
 */
export const getErdHistory = async(tenantId, diagramId) => {
  try {
    const response = await apiGet(`${ERD_API.GET_ERD_HISTORY}/${tenantId}/erd/${diagramId}/history`);
    return response || [];
  } catch (error) {
    console.error('ERD 변경 이력 조회 실패:', error);
    throw error;
  }
};
