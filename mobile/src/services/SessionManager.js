import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../config/environments';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SESSION_ID: 'sessionId',
  USER: 'user',
  STATE: 'sessionState',
};

let sessionState = {
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  user: null,
  updatedAt: 0,
};

let initialized = false;
let initializingPromise = null;
const subscribers = new Set();

const SESSION_CAPTURE_PATHS = [
  '/api/auth/login',
  '/api/auth/branch-login',
  '/api/auth/social-login',
  '/api/auth/sms-login',
  '/api/auth/oauth2',
  '/oauth/callback',
];

const durableSetItem = async (key, value) => {
  if (value === null || value === undefined || value === '') {
    await AsyncStorage.removeItem(key);
    return;
  }
  const serialised = typeof value === 'string' ? value : JSON.stringify(value);
  await AsyncStorage.setItem(key, serialised);
};

const durableRemove = (key) => AsyncStorage.removeItem(key);

const notify = () => {
  subscribers.forEach((listener) => {
    try {
      listener(sessionState);
    } catch (listenerError) {
      console.warn('SessionManager listener error:', listenerError);
    }
  });
};

const shouldCaptureSession = (url = '') =>
  SESSION_CAPTURE_PATHS.some((path) => url.includes(path));

const buildCookieHeader = (existingHeader, sessionId) => {
  if (!sessionId) {
    return existingHeader || undefined;
  }

  const cookieMap = new Map();

  if (existingHeader) {
    existingHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((chunk) => {
        const [name, ...rest] = chunk.split('=');
        if (name) {
          cookieMap.set(name.trim(), rest.join('='));
        }
      });
  }

  cookieMap.set('JSESSIONID', sessionId);

  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
};

const extractSessionId = (setCookieHeader) => {
  if (!setCookieHeader) {
    return null;
  }

  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const cookie of cookies) {
    const match = cookie?.match(/JSESSIONID=([^;]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const SessionManager = {
  async init(force = false) {
    if (initialized && !force) {
      return sessionState;
    }

    if (initializingPromise && !force) {
      return initializingPromise;
    }

    initializingPromise = (async () => {
      try {
        const [accessToken, refreshToken, sessionId, userString] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        sessionState = {
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          sessionId: sessionId || null,
          user: userString ? JSON.parse(userString) : null,
          updatedAt: Date.now(),
        };

        initialized = true;
        return sessionState;
      } catch (error) {
        console.error('SessionManager init failed:', error);
        throw error;
      } finally {
        initializingPromise = null;
        notify();
      }
    })();

    return initializingPromise;
  },

  getState() {
    return sessionState;
  },

  subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },

  async setSession(partialState = {}, options = {}) {
    const { persist = true, broadcast = true } = options;

    sessionState = {
      ...sessionState,
      ...partialState,
      updatedAt: Date.now(),
    };

    if (persist) {
      const tasks = [];
      if (Object.prototype.hasOwnProperty.call(partialState, 'accessToken')) {
        tasks.push(durableSetItem(STORAGE_KEYS.ACCESS_TOKEN, partialState.accessToken));
      }
      if (Object.prototype.hasOwnProperty.call(partialState, 'refreshToken')) {
        tasks.push(durableSetItem(STORAGE_KEYS.REFRESH_TOKEN, partialState.refreshToken));
      }
      if (Object.prototype.hasOwnProperty.call(partialState, 'sessionId')) {
        tasks.push(durableSetItem(STORAGE_KEYS.SESSION_ID, partialState.sessionId));
      }
      if (Object.prototype.hasOwnProperty.call(partialState, 'user')) {
        tasks.push(durableSetItem(STORAGE_KEYS.USER, partialState.user));
      }

      await Promise.all(tasks);
    }

    if (broadcast) {
      notify();
    }
  },

  async clearSession(options = {}) {
    const { reason, broadcast = true } = options;

    if (reason && __DEV__) {
      console.log(`SessionManager.clearSession invoked: ${reason}`);
    }

    sessionState = {
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      user: null,
      updatedAt: Date.now(),
    };

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.SESSION_ID,
      STORAGE_KEYS.USER,
    ]);

    if (broadcast) {
      notify();
    }
  },

  attachRequest(config = {}) {
    const requestConfig = { ...config };
    requestConfig.withCredentials = true;
    requestConfig.headers = requestConfig.headers ? { ...requestConfig.headers } : {};

    const { accessToken, sessionId } = sessionState;

    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (sessionId) {
      requestConfig.headers.Cookie = buildCookieHeader(requestConfig.headers.Cookie, sessionId);
      if (__DEV__ && Platform.OS === 'ios') {
        console.log('🍎 SessionManager attachRequest - Cookie 헤더 설정');
      }
    }

    return requestConfig;
  },

  async handleResponse(response) {
    const url = response?.config?.url || '';

    if (!shouldCaptureSession(url)) {
      return response;
    }

    const sessionId = extractSessionId(
      response?.headers?.['set-cookie'] || response?.headers?.['Set-Cookie'],
    );

    const sessionFromBody = response?.data?.sessionId || null;
    const tokensFromBody = {
      accessToken: response?.data?.accessToken || null,
      refreshToken: response?.data?.refreshToken || null,
    };

    const updates = {};

    if (sessionId) {
      updates.sessionId = sessionId;
    } else if (sessionFromBody) {
      updates.sessionId = sessionFromBody;
    }

    if (tokensFromBody.accessToken) {
      updates.accessToken = tokensFromBody.accessToken;
    }
    if (tokensFromBody.refreshToken) {
      updates.refreshToken = tokensFromBody.refreshToken;
    }

    if (Object.keys(updates).length > 0) {
      await this.setSession(updates);
      if (__DEV__) {
        const platformIcon = Platform.OS === 'ios' ? '🍎' : '🤖';
        console.log(`${platformIcon} SessionManager.handleResponse - 세션 업데이트`, updates);
      }
    }

    return response;
  },

  async refreshTokens() {
    const { refreshToken } = sessionState;
    if (!refreshToken) {
      return null;
    }

    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/auth/refresh-token`;

    const response = await axios.post(
      endpoint,
      { refreshToken },
      {
        withCredentials: true,
      },
    );

    const { accessToken, refreshToken: newRefreshToken, sessionId } = response.data || {};

    await this.setSession({
      accessToken: accessToken || null,
      refreshToken: newRefreshToken || refreshToken,
      sessionId: sessionId || sessionState.sessionId,
    });

    return accessToken;
  },

  async handleUnauthorized(error, apiClient) {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return null;
    }

    try {
      const refreshedAccessToken = await this.refreshTokens();

      if (!refreshedAccessToken) {
        await this.clearSession({ reason: 'refresh-token-missing' });
        throw this.normalizeError(error);
      }

      originalRequest._retry = true;
      const retriedRequest = this.attachRequest(originalRequest);
      return apiClient(retriedRequest);
    } catch (refreshError) {
      await this.clearSession({ reason: 'refresh-token-failed' });
      throw this.normalizeError(refreshError);
    }
  },

  normalizeError(error) {
    const status = error?.response?.status || 0;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      '네트워크 연결을 확인해주세요.';

    return {
      status,
      message,
      data: error?.response?.data,
      code: error?.code,
    };
  },
};

export default SessionManager;


