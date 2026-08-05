/**
 * 웹 FE access/refresh 토큰 갱신 (Expo api client 와 동일 패턴)
 * 401 → refresh → 새 access 로 재요청. 실패 시에만 호출부가 로그인 리다이렉트.
 *
 * JWT/쿠키 원문 로깅 금지.
 *
 * @author MindGarden
 * @since 2026-08-05
 */

import { AUTH_API, getApiBaseUrl } from '../constants/api';
import { getDefaultApiHeaders } from './apiHeaders';

/** 401 시 refresh 재시도하지 않는 URL */
const AUTH_REFRESH_SKIP_URL_SUBSTRINGS = [
  '/api/v1/auth/login',
  '/api/v1/auth/social-login',
  '/api/v1/auth/social/signup',
  '/api/v1/auth/oauth2/',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/logout',
  '/api/v1/auth/clear-session'
];

let isRefreshing = false;
let refreshPromise = null;

/**
 * @param {string} url
 * @returns {boolean}
 */
export function shouldSkipTokenRefreshOn401(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return AUTH_REFRESH_SKIP_URL_SUBSTRINGS.some((sub) => url.includes(sub));
}

/**
 * ApiResponse 래퍼 또는 flat 본문에서 access/refresh 추출
 * @param {unknown} body
 * @returns {{ accessToken?: string, refreshToken?: string }}
 */
export function extractTokensFromRefreshBody(body) {
  if (body == null || typeof body !== 'object') {
    return {};
  }
  const root = /** @type {Record<string, unknown>} */ (body);
  const payload =
    root.data != null && typeof root.data === 'object'
      ? /** @type {Record<string, unknown>} */ (root.data)
      : root;
  let accessToken;
  if (typeof payload.accessToken === 'string') {
    accessToken = payload.accessToken;
  } else if (typeof payload.token === 'string') {
    accessToken = payload.token;
  }
  const refreshToken =
    typeof payload.refreshToken === 'string' ? payload.refreshToken : undefined;
  return { accessToken, refreshToken };
}

/**
 * localStorage 의 refreshToken 으로 새 토큰 쌍을 받아 저장한다.
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>}
 */
export async function refreshAccessTokenPair() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = doRefreshAccessTokenPair();
  try {
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>}
 */
async function doRefreshAccessTokenPair() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${AUTH_API.REFRESH_TOKEN}`, {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        ...getDefaultApiHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      console.warn('🔐 토큰 갱신 실패:', response.status);
      return null;
    }

    const jsonData = await response.json();
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      extractTokensFromRefreshBody(jsonData);

    if (!newAccessToken || !newRefreshToken) {
      console.warn('🔐 토큰 갱신 응답 형식이 올바르지 않습니다.');
      return null;
    }

    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    console.log('🔐 토큰 갱신 성공');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.warn('🔐 토큰 갱신 중 오류:', error?.message || 'unknown');
    return null;
  }
}
