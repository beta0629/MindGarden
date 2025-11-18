import { apiGet, apiPost } from './ajax';

/**
 * ERD 관련 API 호출 유틸리티
 */

const ERD_API = {
  // 테넌트 포털 API
  GET_TENANT_ERDS: '/api/v1/tenants',
  GET_ERD_DETAIL: '/api/v1/tenants',
  GET_ERD_HISTORY: '/api/v1/tenants',
  
  // HQ 운영 포털 API
  OPS_GET_ALL_ERDS: '/api/v1/ops/erd',
  OPS_GET_ERD_DETAIL: '/api/v1/ops/erd',
  OPS_GENERATE_FULL_SYSTEM: '/api/v1/ops/erd/generate/full-system',
  OPS_GENERATE_TENANT: '/api/v1/ops/erd/generate/tenant',
  OPS_GENERATE_MODULE: '/api/v1/ops/erd/generate/module',
  OPS_GENERATE_CUSTOM: '/api/v1/ops/erd/generate/custom',
  OPS_VALIDATE_ERD: '/api/v1/ops/erd',
  OPS_DOWNLOAD_REPORT_JSON: '/api/v1/ops/erd',
  OPS_DOWNLOAD_REPORT_HTML: '/api/v1/ops/erd',
  OPS_DOWNLOAD_REPORT_MARKDOWN: '/api/v1/ops/erd',
  OPS_COMPARE_VERSIONS: '/api/v1/ops/erd',
  OPS_GET_TABLE_NAMES: '/api/v1/ops/erd/tables',
};

/**
 * 테넌트 ERD 목록 조회
 * @param {string} tenantId - 테넌트 ID
 * @returns {Promise<Array>} ERD 목록
 */
export const getTenantErds = async (tenantId) => {
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
 * @param {string} tenantId - 테넌트 ID
 * @param {string} diagramId - ERD 다이어그램 ID
 * @returns {Promise<Object>} ERD 상세 정보
 */
export const getErdDetail = async (tenantId, diagramId) => {
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
 * @param {string} tenantId - 테넌트 ID
 * @param {string} diagramId - ERD 다이어그램 ID
 * @returns {Promise<Array>} ERD 변경 이력 목록
 */
export const getErdHistory = async (tenantId, diagramId) => {
  try {
    const response = await apiGet(`${ERD_API.GET_ERD_HISTORY}/${tenantId}/erd/${diagramId}/history`);
    return response || [];
  } catch (error) {
    console.error('ERD 변경 이력 조회 실패:', error);
    throw error;
  }
};

// ==================== HQ 운영 포털 ERD API ====================

/**
 * HQ 운영 포털: 모든 ERD 목록 조회
 * @param {Object} filters - 필터 옵션 (tenantId, diagramType, isActive, search)
 * @returns {Promise<Array>} ERD 목록
 */
export const getAllErdsForOps = async (filters = {}) => {
  try {
    const params = {};
    if (filters.tenantId) params.tenantId = filters.tenantId;
    if (filters.diagramType) params.diagramType = filters.diagramType;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.search) params.search = filters.search;
    
    const response = await apiGet(ERD_API.OPS_GET_ALL_ERDS, params);
    return response || [];
  } catch (error) {
    console.error('HQ 운영 포털 ERD 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: ERD 상세 조회
 * @param {string} diagramId - ERD 다이어그램 ID
 * @returns {Promise<Object>} ERD 상세 정보
 */
export const getErdDetailForOps = async (diagramId) => {
  try {
    const response = await apiGet(`${ERD_API.OPS_GET_ERD_DETAIL}/${diagramId}`);
    return response;
  } catch (error) {
    console.error('HQ 운영 포털 ERD 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: 전체 시스템 ERD 생성
 * @param {string} schemaName - 스키마 이름 (선택)
 * @returns {Promise<Object>} 생성된 ERD 정보
 */
export const generateFullSystemErdForOps = async (schemaName = null) => {
  try {
    let url = ERD_API.OPS_GENERATE_FULL_SYSTEM;
    if (schemaName) {
      url += `?schemaName=${encodeURIComponent(schemaName)}`;
    }
    const response = await apiPost(url, {});
    return response;
  } catch (error) {
    console.error('전체 시스템 ERD 생성 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: 테넌트 ERD 생성
 * @param {string} tenantId - 테넌트 ID
 * @param {string} schemaName - 스키마 이름 (선택)
 * @returns {Promise<Object>} 생성된 ERD 정보
 */
export const generateTenantErdForOps = async (tenantId, schemaName = null) => {
  try {
    let url = `${ERD_API.OPS_GENERATE_TENANT}/${tenantId}`;
    if (schemaName) {
      url += `?schemaName=${encodeURIComponent(schemaName)}`;
    }
    const response = await apiPost(url, {});
    return response;
  } catch (error) {
    console.error('테넌트 ERD 생성 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: 모듈 ERD 생성
 * @param {string} moduleType - 모듈 타입
 * @param {string} schemaName - 스키마 이름 (선택)
 * @returns {Promise<Object>} 생성된 ERD 정보
 */
export const generateModuleErdForOps = async (moduleType, schemaName = null) => {
  try {
    let url = `${ERD_API.OPS_GENERATE_MODULE}/${moduleType}`;
    if (schemaName) {
      url += `?schemaName=${encodeURIComponent(schemaName)}`;
    }
    const response = await apiPost(url, {});
    return response;
  } catch (error) {
    console.error('모듈 ERD 생성 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: ERD 검증 실행
 * @param {string} diagramId - ERD 다이어그램 ID
 * @param {string} schemaName - 스키마 이름 (선택)
 * @returns {Promise<Object>} 검증 리포트
 */
export const validateErdForOps = async (diagramId, schemaName = null) => {
  try {
    let url = `${ERD_API.OPS_VALIDATE_ERD}/${diagramId}/validate`;
    if (schemaName) {
      url += `?schemaName=${encodeURIComponent(schemaName)}`;
    }
    const response = await apiPost(url, {});
    return response;
  } catch (error) {
    console.error('ERD 검증 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: 테이블 목록 조회
 * @param {string} schemaName - 스키마 이름 (선택)
 * @returns {Promise<Array<string>>} 테이블 이름 목록
 */
export const getTableNamesForOps = async (schemaName = null) => {
  try {
    const params = schemaName ? { schemaName } : {};
    const response = await apiGet(ERD_API.OPS_GET_TABLE_NAMES, params);
    return response || [];
  } catch (error) {
    console.error('테이블 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: 커스텀 ERD 생성
 * @param {Object} request - 커스텀 ERD 생성 요청 (tableNames, name, description, schemaName)
 * @returns {Promise<Object>} 생성된 ERD 정보
 */
export const generateCustomErdForOps = async (request) => {
  try {
    const response = await apiPost(ERD_API.OPS_GENERATE_CUSTOM, request);
    return response;
  } catch (error) {
    console.error('커스텀 ERD 생성 실패:', error);
    throw error;
  }
};

/**
 * HQ 운영 포털: ERD 버전 비교
 * @param {string} diagramId - ERD 다이어그램 ID
 * @param {number} fromVersion - 시작 버전
 * @param {number} toVersion - 종료 버전
 * @returns {Promise<string>} 버전 비교 결과
 */
export const compareErdVersionsForOps = async (diagramId, fromVersion, toVersion) => {
  try {
    const response = await apiGet(`${ERD_API.OPS_COMPARE_VERSIONS}/${diagramId}/compare`, {
      fromVersion,
      toVersion
    });
    return response;
  } catch (error) {
    console.error('ERD 버전 비교 실패:', error);
    throw error;
  }
};

