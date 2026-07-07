/**
 * 테넌트 공통코드 관리 API (StandardizedApi SSOT)
 *
 * @author Core Solution
 * @version 3.0.0
 * @since 2025-12-03
 */

import StandardizedApi from './standardizedApi';
import {
  extractTenantCommonCodeGroupList,
  normalizeTenantCommonCodeRow
} from '../constants/professionalProviderRoles';

const TENANT_COMMON_CODES_BASE = '/api/v1/tenant/common-codes';

/**
 * ApiResponse 또는 unwrap 데이터를 { success, data, message } 형태로 정규화
 * @param {*} response
 * @param {string} failFallback
 * @returns {{ success: boolean, data?: *, message?: string }}
 */
const wrapApiResult = (response, failFallback) => {
  if (response == null) {
    return { success: false, message: failFallback };
  }
  if (typeof response === 'object' && 'success' in response) {
    return {
      success: Boolean(response.success),
      data: response.data,
      message: response.message || (response.success ? undefined : failFallback)
    };
  }
  return { success: true, data: response };
};

/**
 * 코드 행 배열 DTO 매핑 (React #130 방지)
 * @param {*} response
 * @returns {Array<Record<string, *>>}
 */
const mapCodeRows = (response) =>
  extractTenantCommonCodeGroupList(response)
    .map((row) => normalizeTenantCommonCodeRow(row))
    .filter(Boolean);

/**
 * 코드 그룹 메타데이터 DTO 매핑
 * @param {*} response
 * @returns {Array<Record<string, *>>}
 */
const mapCodeGroups = (response) => {
  const list = extractTenantCommonCodeGroupList(response);
  return list.map((group) => {
    const groupName = group.groupName || group.codeGroup || group;
    return {
      ...group,
      groupName: typeof groupName === 'string' ? groupName : String(groupName)
    };
  });
};

/**
 * 테넌트 공통코드 그룹 목록 조회
 */
export const getTenantCodeGroups = async() => {
  try {
    const response = await StandardizedApi.get(`${TENANT_COMMON_CODES_BASE}/groups`);
    const wrapped = wrapApiResult(response, '코드 그룹 조회 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    return { success: true, data: mapCodeGroups(wrapped.data ?? wrapped) };
  } catch (error) {
    console.error('테넌트 공통코드 그룹 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 그룹의 테넌트 공통코드 목록 조회
 */
export const getTenantCodesByGroup = async(codeGroup) => {
  try {
    const response = await StandardizedApi.get(
      `${TENANT_COMMON_CODES_BASE}/groups/${encodeURIComponent(codeGroup)}`
    );
    const wrapped = wrapApiResult(response, '코드 조회 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    return { success: true, data: mapCodeRows(wrapped.data ?? wrapped) };
  } catch (error) {
    console.error(`테넌트 공통코드 조회 실패 (${codeGroup}):`, error);
    throw error;
  }
};

/**
 * 테넌트 공통코드 생성
 */
export const createTenantCode = async(codeData) => {
  try {
    const response = await StandardizedApi.post(TENANT_COMMON_CODES_BASE, codeData);
    const wrapped = wrapApiResult(response, '코드 생성 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    const row = normalizeTenantCommonCodeRow(wrapped.data);
    return { success: true, data: row };
  } catch (error) {
    console.error('테넌트 공통코드 생성 실패:', error);
    throw error;
  }
};

/**
 * 테넌트 공통코드 수정
 */
export const updateTenantCode = async(codeId, codeData) => {
  try {
    const response = await StandardizedApi.put(
      `${TENANT_COMMON_CODES_BASE}/${codeId}`,
      codeData
    );
    const wrapped = wrapApiResult(response, '코드 수정 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    const row = normalizeTenantCommonCodeRow(wrapped.data);
    return { success: true, data: row };
  } catch (error) {
    console.error('테넌트 공통코드 수정 실패:', error);
    throw error;
  }
};

/**
 * 테넌트 공통코드 삭제
 */
export const deleteTenantCode = async(codeId) => {
  try {
    const response = await StandardizedApi.delete(`${TENANT_COMMON_CODES_BASE}/${codeId}`);
    const wrapped = wrapApiResult(response, '코드 삭제 실패');
    return { success: wrapped.success !== false, message: wrapped.message };
  } catch (error) {
    console.error('테넌트 공통코드 삭제 실패:', error);
    throw error;
  }
};

/**
 * 테넌트 공통코드 활성화/비활성화
 */
export const toggleTenantCodeActive = async(codeId, isActive) => {
  try {
    const response = await StandardizedApi.patch(
      `${TENANT_COMMON_CODES_BASE}/${codeId}/active`,
      { isActive }
    );
    const wrapped = wrapApiResult(response, '상태 변경 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    const row = normalizeTenantCommonCodeRow(wrapped.data);
    return { success: true, data: row };
  } catch (error) {
    console.error('테넌트 공통코드 활성화 토글 실패:', error);
    throw error;
  }
};

/**
 * 테넌트 공통코드 정렬 순서 변경
 */
export const updateTenantCodeOrder = async(codeId, sortOrder) => {
  try {
    const response = await StandardizedApi.patch(
      `${TENANT_COMMON_CODES_BASE}/${codeId}/order`,
      { sortOrder }
    );
    const wrapped = wrapApiResult(response, '상태 변경 실패');
    if (!wrapped.success) {
      return wrapped;
    }
    const row = normalizeTenantCommonCodeRow(wrapped.data);
    return { success: true, data: row };
  } catch (error) {
    console.error('테넌트 공통코드 정렬 순서 변경 실패:', error);
    throw error;
  }
};

/**
 * 상담 패키지 생성 (금액 포함)
 */
export const createConsultationPackage = async(packageData) => {
  try {
    const response = await StandardizedApi.post(
      `${TENANT_COMMON_CODES_BASE}/consultation-packages`,
      packageData
    );
    return wrapApiResult(response, '패키지 생성 실패');
  } catch (error) {
    console.error('상담 패키지 생성 실패:', error);
    throw error;
  }
};

/**
 * 평가 유형 생성 (금액 포함)
 */
export const createAssessmentType = async(assessmentData) => {
  try {
    const response = await StandardizedApi.post(
      `${TENANT_COMMON_CODES_BASE}/assessment-types`,
      assessmentData
    );
    return wrapApiResult(response, '평가 유형 생성 실패');
  } catch (error) {
    console.error('평가 유형 생성 실패:', error);
    throw error;
  }
};
