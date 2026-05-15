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

  /**
   * apex `core-solution.co.kr` 는 nginx에서 `app.core-solution.co.kr` 로 301 리다이렉트한다.
   * POST + 301 조합 시 클라이언트가 GET으로 바꿔 재요청하면 `/api/v1/auth/social-login` 등에서 405가 난다.
   * API 호출은 항상 **app** 서브도메인으로 직접 보낸다.
   */
  return 'https://app.core-solution.co.kr';
}
