import Constants from 'expo-constants';

/**
 * Axios·이미지 URL 등 API origin 단일 소스 (client.ts와 동일 규칙).
 * 실서버: `app.config` / `app.config.js` 의 `extra.apiBaseUrl` 우선, 없으면 dev/prod 기본 호스트.
 * 로컬 목(mock) 전용 호스트는 프로젝트에 고정 경로가 없으면 `extra.apiBaseUrl` 로 주입한다.
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
