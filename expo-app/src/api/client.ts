/**
 * TenantAwareApiClient
 * Axios 인스턴스 — X-Tenant-Id / Authorization 인터셉터 자동 삽입
 * 401 → refreshToken → 재시도 로직 포함
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { AUTH_API } from './endpoints';

const API_TIMEOUT = 30000;

const getBaseUrl = (): string => {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiBaseUrl) {
    return extra.apiBaseUrl as string;
  }

  if (__DEV__) {
    return 'https://dev.core-solution.co.kr';
  }

  return 'https://core-solution.co.kr';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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
    const { tenantId } = useTenantStore.getState();
    const { accessToken } = useAuthStore.getState();

    if (tenantId) {
      config.headers.set('X-Tenant-Id', tenantId);
    }

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
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
          `${getBaseUrl()}${AUTH_API.REFRESH_TOKEN}`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        await useAuthStore.getState().updateTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

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
      (error.response?.data as { message?: string })?.message ??
      getErrorMessage(status);

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

export const apiDelete = async <T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient.delete(endpoint, config) as Promise<T>;
};

export default apiClient;
