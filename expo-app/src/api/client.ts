/**
 * TenantAwareApiClient
 * Axios 인스턴스 — X-Tenant-Id / Authorization 인터셉터 자동 삽입
 * 401 → refreshToken → 재시도 로직 포함
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import axios, { create } from 'axios';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import {
  formatJsessionCookieHeader,
  hydrateJsessionCacheFromSecureStore,
  peekCachedJsessionId,
} from '@/utils/sessionCookie';
import { useAuthStore } from '../stores/useAuthStore';
import { resolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import { AUTH_API } from './endpoints';

const API_TIMEOUT = 30000;

/** 401 시 refresh 재시도하지 않는 URL(로그인·소셜·OAuth2·refresh 자체 등) */
const AUTH_REFRESH_SKIP_URL_SUBSTRINGS = [
  '/api/v1/auth/login',
  '/api/v1/auth/social-login',
  '/api/v1/auth/social/signup',
  '/api/v1/auth/oauth2/',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/logout', // 로그아웃 요청 401 시 갱신 루프 방지
] as const;

function resolveRequestUrlForMatch(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? '';
  if (url.includes('://')) {
    return url;
  }
  const base = typeof config.baseURL === 'string' ? config.baseURL : '';
  return `${base}${url}`;
}

function shouldSkipTokenRefreshOn401(config: InternalAxiosRequestConfig): boolean {
  const haystack = resolveRequestUrlForMatch(config);
  return AUTH_REFRESH_SKIP_URL_SUBSTRINGS.some((sub) => haystack.includes(sub));
}

function extractTokensFromRefreshBody(body: unknown): {
  accessToken?: string;
  refreshToken?: string;
} {
  if (body == null || typeof body !== 'object') {
    return {};
  }
  const root = body as Record<string, unknown>;
  const payload =
    root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  let accessToken: string | undefined;
  if (typeof payload.accessToken === 'string') {
    accessToken = payload.accessToken;
  } else if (typeof payload.token === 'string') {
    accessToken = payload.token;
  }
  const refreshToken = typeof payload.refreshToken === 'string' ? payload.refreshToken : undefined;
  return { accessToken, refreshToken };
}

const apiClient: AxiosInstance = create({
  baseURL: getApiBaseUrl(),
  timeout: API_TIMEOUT,
  maxRedirects: 0,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': `MindGardenMobile/1.0 (${Platform.OS})`,
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      syncTenantFromAccessToken(accessToken);
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const tenantId = resolveTenantIdForApi();
    if (tenantId) {
      config.headers.set('X-Tenant-Id', tenantId);
    }

    const sessionCookie = formatJsessionCookieHeader(peekCachedJsessionId());
    if (sessionCookie) {
      config.headers.set('Cookie', sessionCookie);
    } else if (__DEV__ && accessToken) {
      // eslint-disable-next-line no-console -- Android SecureStore 지연·Bearer-only 경로 추적
      console.debug('[api] Bearer-only (no JSESSIONID cache)');
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && shouldSkipTokenRefreshOn401(originalRequest)) {
      const status = 401;
      const message =
        (error.response?.data as { message?: string })?.message ?? getErrorMessage(status);
      return Promise.reject({ status, message, originalError: error });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${getApiBaseUrl()}${AUTH_API.REFRESH_TOKEN}`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            maxRedirects: 0,
          },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          extractTokensFromRefreshBody(response.data);

        if (!newAccessToken || !newRefreshToken) {
          const parseErr = new Error('토큰 갱신 응답 형식이 올바르지 않습니다.');
          processQueue(parseErr, null);
          await useAuthStore.getState().logout();
          return Promise.reject(parseErr);
        }

        await useAuthStore.getState().updateTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
        await hydrateJsessionCacheFromSecureStore();

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const status = error.response?.status ?? 0;
    const message =
      (error.response?.data as { message?: string })?.message ?? getErrorMessage(status);

    return Promise.reject({ status, message, originalError: error });
  },
);

function getErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    default:
      return '네트워크 연결을 확인해주세요.';
  }
}

export const apiGet = async <T = unknown>(
  endpoint: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.get(endpoint, { params, ...config }) as Promise<T>;
};

export const apiPost = async <T = unknown>(
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.post(endpoint, data, config) as Promise<T>;
};

export const apiPut = async <T = unknown>(
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.put(endpoint, data, config) as Promise<T>;
};

export const apiPatch = async <T = unknown>(
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.patch(endpoint, data, config) as Promise<T>;
};

export const apiDelete = async <T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.delete(endpoint, config) as Promise<T>;
};

export default apiClient;
