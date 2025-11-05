/**
 * API 클라이언트
 * React Native용 API 호출 유틸리티
 * 
 * 웹의 frontend/src/utils/ajax.js를 참고하여 모바일용으로 변환
 * 
 * 주요 변경사항:
 * - localStorage → AsyncStorage
 * - window.location.href → React Navigation
 * - 쿠키 기반 세션 → 토큰 기반 인증
 */

import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl, getDeviceInfo, isDevelopment } from '../config/environments';

// API 설정
const API_TIMEOUT = 30000;
const API_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};
const API_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
};

// Axios 인스턴스 생성
const apiBaseUrl = getApiBaseUrl();
if (__DEV__) {
  console.log('🔧 API Base URL:', apiBaseUrl);
}
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 메시지 생성
const getErrorMessage = (status) => {
  switch (status) {
    case API_STATUS.UNAUTHORIZED:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case API_STATUS.FORBIDDEN:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case API_STATUS.NOT_FOUND:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case API_STATUS.SERVER_ERROR:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return API_ERROR_MESSAGES.NETWORK_ERROR;
  }
};

// 요청 인터셉터 (토큰 및 세션 쿠키 추가)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // JWT 토큰 추가 (있는 경우)
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 세션 쿠키 추가 (세션 기반 인증을 위해 필수)
      // iOS와 Android 분리 처리 (Android는 잘 작동하므로 iOS만 추가 처리)
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (sessionId) {
        if (Platform.OS === 'ios') {
          // iOS: 쿠키를 Cookie 헤더로 전달
          config.headers.Cookie = `JSESSIONID=${sessionId}`;
          if (__DEV__) {
            console.log('🍎 iOS - 세션 ID를 Cookie 헤더로 전달:', sessionId);
          }
        } else {
          // Android: 기존 방식 유지 (잘 작동 중)
          config.headers.Cookie = `JSESSIONID=${sessionId}`;
        }
      }
    } catch (error) {
      console.error('토큰/세션 가져오기 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리, 토큰 갱신, 세션 쿠키 처리)
apiClient.interceptors.response.use(
  async (response) => {
    // iOS와 Android 분리 처리
    if (Platform.OS === 'ios') {
      // iOS: 로그인 API 응답에서만 세션 ID 저장 (일반 API 응답은 덮어쓰지 않음)
      const isLoginResponse = response.config?.url?.includes('/api/auth/social-login');
      
      // 로그인 응답인 경우에만 세션 ID 저장
      if (isLoginResponse) {
        // Set-Cookie 헤더에서 세션 ID 추출
        const setCookieHeader = response.headers['set-cookie'] || response.headers['Set-Cookie'];
        if (setCookieHeader) {
          const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
          for (const cookie of cookies) {
            const match = cookie.match(/JSESSIONID=([^;]+)/);
            if (match && match[1]) {
              await AsyncStorage.setItem('sessionId', match[1]);
              if (__DEV__) {
                console.log('🍎 iOS - 로그인 응답에서 세션 ID 추출 및 저장:', match[1]);
              }
            }
          }
        }
        
        // 응답 데이터에 sessionId가 있으면 저장 (로그인 응답에서만)
        if (response.data && response.data.sessionId) {
          await AsyncStorage.setItem('sessionId', response.data.sessionId);
          if (__DEV__) {
            console.log('🍎 iOS - 로그인 응답 데이터에서 세션 ID 저장:', response.data.sessionId);
          }
        }
      }
      // 일반 API 응답에서는 세션 ID를 덮어쓰지 않음 (로그인 시 저장한 세션 ID 유지)
    } else {
      // Android: 로그인 API 응답에서만 세션 ID 저장 (일반 API 응답은 덮어쓰지 않음)
      const isLoginResponse = response.config?.url?.includes('/api/auth/social-login');
      
      if (isLoginResponse) {
        const setCookieHeader = response.headers['set-cookie'] || response.headers['Set-Cookie'];
        if (setCookieHeader) {
          const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
          for (const cookie of cookies) {
            const match = cookie.match(/JSESSIONID=([^;]+)/);
            if (match && match[1]) {
              await AsyncStorage.setItem('sessionId', match[1]);
              console.log('✅ 로그인 응답에서 세션 ID 추출 및 저장:', match[1]);
            }
          }
        }
        
        if (response.data && response.data.sessionId) {
          await AsyncStorage.setItem('sessionId', response.data.sessionId);
          console.log('✅ 로그인 응답 데이터에서 세션 ID 저장:', response.data.sessionId);
        }
      }
    }
    
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // iOS 디버깅: 에러 상세 정보 로깅
    if (Platform.OS === 'ios' && __DEV__) {
      console.log('🍎 iOS - API 에러 발생:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
      });
    }

    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === API_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          // 토큰 갱신 API 호출
          const apiBaseUrl = getApiBaseUrl();
          const response = await axios.post(
            `${apiBaseUrl}/api/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // NavigationService.navigate('Login'); // TODO: NavigationService 구현 후 연결
        return Promise.reject(refreshError);
      }
    }

    // 에러 처리
    const status = error.response?.status || 0;
    const message = error.response?.data?.message || getErrorMessage(status);
    
    // 개발 환경에서만 상세 로그 출력 (500 에러는 서버 문제이므로 조용히 처리)
    if (__DEV__ && status !== 500) {
      console.error('API 오류:', {
        status,
        message,
        path: originalRequest?.url,
        method: originalRequest?.method,
      });
    }
    
    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

// GET 요청
export const apiGet = async (endpoint, params = {}, options = {}) => {
  try {
    const response = await apiClient.get(endpoint, {
      params,
      ...options,
    });
    return response;
  } catch (error) {
    // 에러 상세 정보 로깅
    const errorMessage = error?.response?.status 
      ? `GET 요청 오류 [${error.response.status}]: ${endpoint}`
      : `GET 요청 오류: ${endpoint}`;
    console.error(errorMessage, {
      endpoint,
      params,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    });
    throw error;
  }
};

// POST 요청
export const apiPost = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, options);
    return response;
  } catch (error) {
    console.error('POST 요청 오류:', error);
    throw error;
  }
};

// PUT 요청
export const apiPut = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await apiClient.put(endpoint, data, options);
    return response;
  } catch (error) {
    console.error('PUT 요청 오류:', error);
    throw error;
  }
};

// DELETE 요청
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.delete(endpoint, options);
    return response;
  } catch (error) {
    console.error('DELETE 요청 오류:', error);
    throw error;
  }
};

// 파일 업로드 (FormData)
export const apiUpload = async (endpoint, formData, options = {}) => {
  try {
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options,
    });
    return response;
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    throw error;
  }
};

export default apiClient;

