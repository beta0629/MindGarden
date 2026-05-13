import Constants from 'expo-constants';

/**
 * Axios·이미지 URL 등 API origin 단일 소스 (client.ts와 동일 규칙).
 */
export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiBaseUrl) {
    return extra.apiBaseUrl as string;
  }

  if (__DEV__) {
    return 'https://dev.core-solution.co.kr';
  }

  return 'https://core-solution.co.kr';
}
