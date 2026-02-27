/**
 * 표준화된 API 호출 유틸리티
 * 
 * 모든 API 호출은 이 유틸리티를 통해 수행되어야 합니다.
 * 표준화 문서: docs/standards/API_DESIGN_STANDARD.md
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-06
 */

import { apiGet, apiPost, apiPostFormData, apiPut, apiDelete } from './ajax';
import { getDefaultApiHeadersAsync } from './apiHeaders';
import { getApiBaseUrl } from '../constants/api';

/**
 * 표준화된 API 호출 래퍼
 * - 자동 tenantId 헤더 추가
 * - 세션 자동 갱신
 * - 에러 핸들링 통일
 * - 로깅 통일
 */
class StandardizedApi {
    /**
     * GET 요청 (표준화)
     * @param {string} endpoint API 엔드포인트 (예: '/api/v1/admin/consultants/with-stats')
     * @param {Object} params 쿼리 파라미터
     * @param {Object} options 추가 옵션
     * @returns {Promise<any>} API 응답 데이터
     */
    static async get(endpoint, params = {}, options = {}) {
        try {
            // 엔드포인트 검증 (콜백으로 전달 시 this 상실 방지)
            StandardizedApi.validateEndpoint(endpoint);
            
            // 세션 갱신 및 헤더 준비
            const headers = await getDefaultApiHeadersAsync({}, true);
            const finalOptions = {
                ...options,
                headers: { ...headers, ...(options.headers || {}) }
            };
            
            console.log(`📤 [표준화 API] GET ${endpoint}`, { params, tenantId: headers['X-Tenant-Id'] });
            
            const response = await apiGet(endpoint, params, finalOptions);
            
            console.log(`✅ [표준화 API] GET ${endpoint} 성공`);
            return response;
        } catch (error) {
            console.error(`❌ [표준화 API] GET ${endpoint} 실패:`, error);
            throw StandardizedApi.handleError(error, endpoint, 'GET');
        }
    }
    
    /**
     * POST 요청 (표준화)
     * @param {string} endpoint API 엔드포인트
     * @param {Object} data 요청 본문
     * @param {Object} options 추가 옵션
     * @returns {Promise<any>} API 응답 데이터
     */
    static async post(endpoint, data = {}, options = {}) {
        try {
            StandardizedApi.validateEndpoint(endpoint);
            
            const headers = await getDefaultApiHeadersAsync({}, true);
            const finalOptions = {
                ...options,
                headers: { ...headers, ...(options.headers || {}) }
            };
            
            console.log(`📤 [표준화 API] POST ${endpoint}`, { data, tenantId: headers['X-Tenant-Id'] });
            
            const response = await apiPost(endpoint, data, finalOptions);
            
            console.log(`✅ [표준화 API] POST ${endpoint} 성공`);
            return response;
        } catch (error) {
            console.error(`❌ [표준화 API] POST ${endpoint} 실패:`, error);
            throw StandardizedApi.handleError(error, endpoint, 'POST');
        }
    }
    
    /**
     * PUT 요청 (표준화)
     * @param {string} endpoint API 엔드포인트
     * @param {Object} data 요청 본문
     * @param {Object} options 추가 옵션
     * @returns {Promise<any>} API 응답 데이터
     */
    static async put(endpoint, data = {}, options = {}) {
        try {
            StandardizedApi.validateEndpoint(endpoint);
            
            const headers = await getDefaultApiHeadersAsync({}, true);
            const finalOptions = {
                ...options,
                headers: { ...headers, ...(options.headers || {}) }
            };
            
            console.log(`📤 [표준화 API] PUT ${endpoint}`, { data, tenantId: headers['X-Tenant-Id'] });
            
            const response = await apiPut(endpoint, data, finalOptions);
            
            console.log(`✅ [표준화 API] PUT ${endpoint} 성공`);
            return response;
        } catch (error) {
            console.error(`❌ [표준화 API] PUT ${endpoint} 실패:`, error);
            throw StandardizedApi.handleError(error, endpoint, 'PUT');
        }
    }
    
    /**
     * POST FormData 요청 (표준화) - 파일 업로드 등
     * @param {string} endpoint API 엔드포인트
     * @param {FormData} formData FormData 객체
     * @param {Object} options 추가 옵션
     * @returns {Promise<any>} API 응답 데이터
     */
    static async postFormData(endpoint, formData, options = {}) {
        try {
            StandardizedApi.validateEndpoint(endpoint);
            
            const headers = await getDefaultApiHeadersAsync({}, true);
            delete headers['Content-Type']; // multipart/form-data 자동 설정
            const finalOptions = {
                ...options,
                headers: { ...headers, ...(options.headers || {}) }
            };
            
            const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
                ? endpoint
                : `${getApiBaseUrl()}${endpoint}`;
            
            console.log(`📤 [표준화 API] POST FormData ${endpoint}`, { tenantId: headers['X-Tenant-Id'] });
            
            const response = await apiPostFormData(url, formData, finalOptions);
            
            console.log(`✅ [표준화 API] POST FormData ${endpoint} 성공`);
            return response;
        } catch (error) {
            console.error(`❌ [표준화 API] POST FormData ${endpoint} 실패:`, error);
            throw StandardizedApi.handleError(error, endpoint, 'POST');
        }
    }
    
    /**
     * DELETE 요청 (표준화)
     * @param {string} endpoint API 엔드포인트
     * @param {Object} options 추가 옵션
     * @returns {Promise<any>} API 응답 데이터
     */
    static async delete(endpoint, options = {}) {
        try {
            StandardizedApi.validateEndpoint(endpoint);
            
            const headers = await getDefaultApiHeadersAsync({}, true);
            const finalOptions = {
                ...options,
                headers: { ...headers, ...(options.headers || {}) }
            };
            
            console.log(`📤 [표준화 API] DELETE ${endpoint}`, { tenantId: headers['X-Tenant-Id'] });
            
            const response = await apiDelete(endpoint, finalOptions);
            
            console.log(`✅ [표준화 API] DELETE ${endpoint} 성공`);
            return response;
        } catch (error) {
            console.error(`❌ [표준화 API] DELETE ${endpoint} 실패:`, error);
            throw StandardizedApi.handleError(error, endpoint, 'DELETE');
        }
    }
    
    /**
     * 엔드포인트 검증
     * @param {string} endpoint API 엔드포인트
     * @throws {Error} 엔드포인트가 표준에 맞지 않으면 에러 발생
     */
    static validateEndpoint(endpoint) {
        // /api/v1/로 시작해야 함
        if (!endpoint.startsWith('/api/v1/')) {
            console.warn(`⚠️ [표준화 경고] 엔드포인트가 /api/v1/로 시작하지 않음: ${endpoint}`);
            // 경고만 하고 계속 진행 (하위 호환성)
        }
        
        // 절대 URL은 허용하지 않음
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            throw new Error(`엔드포인트는 상대 경로여야 합니다: ${endpoint}`);
        }
    }
    
    /**
     * 에러 핸들링 (표준화)
     * @param {Error} error 에러 객체
     * @param {string} endpoint API 엔드포인트
     * @param {string} method HTTP 메서드
     * @returns {Error} 처리된 에러
     */
    static handleError(error, endpoint, method) {
        // 에러 타입별 처리
        if (error.status === 400) {
            return new Error(`잘못된 요청입니다: ${endpoint}`);
        } else if (error.status === 401) {
            return new Error('인증이 필요합니다. 다시 로그인해주세요.');
        } else if (error.status === 403) {
            return new Error('접근 권한이 없습니다.');
        } else if (error.status === 404) {
            return new Error(`요청한 리소스를 찾을 수 없습니다: ${endpoint}`);
        } else if (error.status >= 500) {
            return new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        return error;
    }
}

export default StandardizedApi;

