/**
 * CSRF 토큰 관리 유틸리티
 * - CSRF 토큰 캐싱 및 자동 갱신
 * - fetch 요청에 자동으로 CSRF 토큰 포함
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-23
 */

import { API_BASE_URL } from '../constants/api';
import { getTenantId } from './apiHeaders';

/** CSRF 토큰을 얻지 못해 multipart 요청을 보낼 수 없을 때 */
const CSRF_TOKEN_UNAVAILABLE_MESSAGE =
  '보안 토큰을 확인할 수 없습니다. 페이지를 새로 고침한 뒤 다시 시도해 주세요.';

class CsrfTokenManager {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.isRefreshing = false;
        this.refreshPromise = null;
    }

/**
     * CSRF 토큰 가져오기 (캐시된 토큰이 있으면 사용, 없으면 새로 요청)
     */
    async getToken() {
        // 캐시된 토큰이 있고 유효하면 반환
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        // 이미 토큰을 가져오는 중이면 기다림
        if (this.isRefreshing && this.refreshPromise) {
            return await this.refreshPromise;
        }

        // 새로 토큰 요청
        return await this.refreshToken();
    }

/**
     * CSRF 토큰 새로고침
     */
    async refreshToken() {
        if (this.isRefreshing) {
            return await this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this._fetchToken();

        try {
            const token = await this.refreshPromise;
            return token;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

/**
     * 실제 토큰 요청
     */
    async _fetchToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/csrf-token`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const responseData = await response.json();
                // ApiResponse 래퍼 처리: { success: true, data: { token: '...' } } 형태면 data 추출
                const data = (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData)
                    ? responseData.data
                    : responseData;
                this.token = data.token || data;
                // 토큰을 30분간 유효하다고 가정 (실제로는 서버에서 만료 시간을 알려줘야 함)
                this.tokenExpiry = Date.now() + (30 * 60 * 1000);
                console.debug('CSRF 토큰 갱신 완료');
                return this.token;
            } else {
                console.warn('⚠️ CSRF 토큰 요청 실패:', response.status);
                return null;
            }
        } catch (error) {
            console.warn('⚠️ CSRF 토큰 가져오기 실패:', error);
            return null;
        }
    }

/**
     * fetch 요청에 CSRF 토큰을 자동으로 포함하는 래퍼 함수
     */
    async fetchWithCsrf(url, options = {}) {
        const token = await this.getToken();
        
        // URL이 상대 경로인 경우 API_BASE_URL 추가
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };
        
        // CSRF 토큰이 있으면 헤더에 추가
        if (token) {
            headers['X-XSRF-TOKEN'] = token;
        }
        
        // tenantId 헤더 추가 (모든 API 호출에 적용)
        const tenantId = await getTenantId();
        if (tenantId) {
            headers['X-Tenant-Id'] = tenantId;
        }
        
        return fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include'
        });
    }

/**
     * FormData(multipart) 업로드용 fetch — 브라우저가 boundary를 넣도록 Content-Type 미설정
     * @param {string} url
     * @param {RequestInit & { body?: FormData }} options
     */
    async fetchWithCsrfMultipart(url, options = {}) {
        const body = options.body;
        if (!(body instanceof FormData)) {
            throw new Error('fetchWithCsrfMultipart requires body to be FormData');
        }

        let token = await this.getToken();
        if (!token) {
            this.clearToken();
            token = await this.refreshToken();
        }
        if (!token) {
            throw new Error(CSRF_TOKEN_UNAVAILABLE_MESSAGE);
        }

        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

        const rawHeaders = options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)
            ? { ...options.headers }
            : {};
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                rawHeaders[key] = value;
            });
        }
        delete rawHeaders['Content-Type'];
        delete rawHeaders['content-type'];

        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            ...rawHeaders
        };

        headers['X-XSRF-TOKEN'] = token;

        const tenantId = await getTenantId();
        if (tenantId) {
            headers['X-Tenant-Id'] = tenantId;
        }

        const { headers: _omit, ...restOptions } = options;

        return fetch(fullUrl, {
            ...restOptions,
            body,
            headers,
            credentials: options.credentials ?? 'include'
        });
    }

/**
     * POST 요청 헬퍼
     */
    async post(url, data, options = {}) {
        return this.fetchWithCsrf(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

/**
     * PUT 요청 헬퍼
     */
    async put(url, data, options = {}) {
        return this.fetchWithCsrf(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

/**
     * PATCH 요청 헬퍼
     */
    async patch(url, data, options = {}) {
        return this.fetchWithCsrf(url, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

/**
     * DELETE 요청 헬퍼
     */
    async delete(url, options = {}) {
        return this.fetchWithCsrf(url, {
            method: 'DELETE',
            ...options
        });
    }

/**
     * GET 요청 헬퍼 (CSRF 토큰 불필요하지만 일관성을 위해)
     */
    async get(url, options = {}) {
        return this.fetchWithCsrf(url, {
            method: 'GET',
            ...options
        });
    }

/**
     * 토큰 캐시 초기화
     */
    clearToken() {
        this.token = null;
        this.tokenExpiry = null;
    }
}

// 싱글톤 인스턴스 생성
const csrfTokenManager = new CsrfTokenManager();

export default csrfTokenManager;