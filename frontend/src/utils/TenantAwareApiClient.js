/**
 * TenantAwareApiClient — 테넌트 인식 API 클라이언트
 *
 * 기존 StandardizedApi를 래핑하여 모든 요청에 X-Tenant-Id 헤더를 자동 삽입.
 * tenantId는 localStorage에서 조회.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import StandardizedApi from './standardizedApi';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_TENANT_VALIDATE_CODE = '/api/v1/tenant/validate-code';


const TENANT_ID_KEY = 'mg_tenant_id';

class TenantAwareApiClient {
  /**
   * 현재 저장된 tenantId 조회
   */
  static getTenantId() {
    return localStorage.getItem(TENANT_ID_KEY) || '';
  }

  /**
   * tenantId 저장
   * @param {string} tenantId
   */
  static setTenantId(tenantId) {
    if (tenantId) {
      localStorage.setItem(TENANT_ID_KEY, tenantId);
    } else {
      localStorage.removeItem(TENANT_ID_KEY);
    }
  }

  /**
   * tenantId 삭제 (로그아웃 시)
   */
  static clearTenantId() {
    localStorage.removeItem(TENANT_ID_KEY);
  }

  /**
   * X-Tenant-Id 헤더가 포함된 옵션 빌드
   * @param {Object} options
   * @returns {Object}
   */
  static buildOptions(options) {
    const tenantId = TenantAwareApiClient.getTenantId();
    if (!tenantId) return options || {};

    const opts = options || {};
    const existingHeaders = opts.headers || {};
    return {
      ...opts,
      headers: {
        ...existingHeaders,
        'X-Tenant-Id': tenantId
      }
    };
  }

  /**
   * GET 요청
   * @param {string} endpoint
   * @param {Object} params
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async get(endpoint, params = {}, options = {}) {
    return StandardizedApi.get(endpoint, params, TenantAwareApiClient.buildOptions(options));
  }

  /**
   * POST 요청
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async post(endpoint, data = {}, options = {}) {
    return StandardizedApi.post(endpoint, data, TenantAwareApiClient.buildOptions(options));
  }

  /**
   * PUT 요청
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async put(endpoint, data = {}, options = {}) {
    return StandardizedApi.put(endpoint, data, TenantAwareApiClient.buildOptions(options));
  }

  /**
   * DELETE 요청
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async delete(endpoint, options = {}) {
    return StandardizedApi.delete(endpoint, TenantAwareApiClient.buildOptions(options));
  }

  /**
   * FormData POST 요청 (파일 업로드 등)
   * @param {string} endpoint
   * @param {FormData} formData
   * @param {Object} options
   * @returns {Promise<any>}
   */
  static async postFormData(endpoint, formData, options = {}) {
    return StandardizedApi.postFormData(endpoint, formData, TenantAwareApiClient.buildOptions(options));
  }

  /**
   * 테넌트 코드 유효성 검증
   * @param {string} tenantCode 기관 코드
   * @returns {Promise<{valid: boolean, tenantId: string, tenantName: string}>}
   */
  static async validateTenantCode(tenantCode) {
    const response = await StandardizedApi.post(API_TENANT_VALIDATE_CODE, {
      code: tenantCode
    });
    return response;
  }
}

export default TenantAwareApiClient;
