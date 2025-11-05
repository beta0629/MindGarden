/**
 * 환경별 설정 관리
 */

import { Platform } from 'react-native';

// 환경 타입 정의
export const ENV_TYPES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

// 현재 환경 결정 (__DEV__ 사용)
export const CURRENT_ENV = __DEV__ ? ENV_TYPES.DEVELOPMENT : ENV_TYPES.PRODUCTION;

// 환경별 설정
const environments = {
  [ENV_TYPES.DEVELOPMENT]: {
    // Android 에뮬레이터: 10.0.2.2 (호스트 컴퓨터 접근)
    // iOS 시뮬레이터: localhost/127.0.0.1이 작동하지 않으므로 호스트 IP 사용
    // 호스트 IP 확인: ifconfig | grep "inet " | grep -v 127.0.0.1
    // 현재 호스트 IP: 192.168.0.71 (환경에 따라 변경 가능)
    API_BASE_URL: Platform.OS === 'android' 
      ? 'http://10.0.2.2:8080' 
      : 'http://192.168.0.71:8080', // iOS 시뮬레이터: 호스트 IP 사용
    FIREBASE_CONFIG: {
      apiKey: "your_dev_firebase_api_key",
      authDomain: "mindgarden-dev.firebaseapp.com",
      projectId: "mindgarden-dev",
      storageBucket: "mindgarden-dev.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
      measurementId: "G-ABCDEFGHIJ"
    },
    NAVER_LOGIN_CONFIG: { // 네이버 로그인 설정 추가
      CLIENT_ID: 'vTKNlxYKIfo1uCCXaDfk',
      CLIENT_SECRET: 'V_b3omW5pu',
      APP_NAME: 'MindGardenMobileApp',
    },
    ENABLE_ANALYTICS: false,
    ENABLE_CRASH_REPORTING: false,
    ENABLE_CONSOLE_LOGS: true,
    SENTRY_DSN: null,
  },
  [ENV_TYPES.STAGING]: {
    API_BASE_URL: 'https://staging-api.mindgarden.com',
    FIREBASE_CONFIG: {
      apiKey: "your_staging_firebase_api_key",
      authDomain: "mindgarden-staging.firebaseapp.com",
      projectId: "mindgarden-staging",
      storageBucket: "mindgarden-staging.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
      measurementId: "G-ABCDEFGHIJ"
    },
    NAVER_LOGIN_CONFIG: { // 네이버 로그인 설정 추가
      CLIENT_ID: 'vTKNlxYKIfo1uCCXaDfk',
      CLIENT_SECRET: 'V_b3omW5pu',
      APP_NAME: 'MindGardenMobileApp',
    },
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: true,
    ENABLE_CONSOLE_LOGS: false,
    SENTRY_DSN: 'https://your_staging_sentry_dsn@sentry.io/project_id',
  },
  [ENV_TYPES.PRODUCTION]: {
    API_BASE_URL: 'https://m-garden.co.kr',
    FIREBASE_CONFIG: {
      apiKey: "your_prod_firebase_api_key",
      authDomain: "mindgarden-prod.firebaseapp.com",
      projectId: "mindgarden-prod",
      storageBucket: "mindgarden-prod.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
      measurementId: "G-ABCDEFGHIJ"
    },
    NAVER_LOGIN_CONFIG: { // 네이버 로그인 설정 추가
      CLIENT_ID: 'vTKNlxYKIfo1uCCXaDfk',
      CLIENT_SECRET: 'V_b3omW5pu',
      APP_NAME: 'MindGardenMobileApp',
    },
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: true,
    ENABLE_CONSOLE_LOGS: false,
    SENTRY_DSN: 'https://your_prod_sentry_dsn@sentry.io/project_id',
  },
};

// 현재 환경 설정 가져오기
export const getCurrentEnvironment = () => {
  return environments[CURRENT_ENV];
};

// 환경별 API URL 가져오기
export const getApiBaseUrl = () => {
  return getCurrentEnvironment().API_BASE_URL;
};

// Firebase 설정 가져오기
export const getFirebaseConfig = () => {
  return getCurrentEnvironment().FIREBASE_CONFIG;
};

// 네이버 로그인 설정 가져오기
export const getNaverLoginConfig = () => {
  return getCurrentEnvironment().NAVER_LOGIN_CONFIG;
};

// 환경 확인 함수들
export const isDevelopment = () => CURRENT_ENV === ENV_TYPES.DEVELOPMENT;
export const isStaging = () => CURRENT_ENV === ENV_TYPES.STAGING;
export const isProduction = () => CURRENT_ENV === ENV_TYPES.PRODUCTION;

// 앱 버전 정보
export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '1';

// 플랫폼 정보
export const PLATFORM = Platform.OS;
export const PLATFORM_VERSION = Platform.Version;

// 디바이스 정보
export const getDeviceInfo = () => ({
  platform: PLATFORM,
  platformVersion: PLATFORM_VERSION,
  appVersion: APP_VERSION,
  buildNumber: BUILD_NUMBER,
  environment: CURRENT_ENV,
});

export default {
  CURRENT_ENV,
  ENV_TYPES,
  getCurrentEnvironment,
  getApiBaseUrl,
  getFirebaseConfig,
  isDevelopment,
  isStaging,
  isProduction,
  getDeviceInfo,
  APP_VERSION,
  BUILD_NUMBER,
  getNaverLoginConfig, // export 추가
};
