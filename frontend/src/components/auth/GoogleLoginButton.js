/**
 * Google 로그인 버튼 — `@react-oauth/google` `useGoogleLogin` 의 implicit 흐름을 래핑.
 *
 * <p>UX 일관성을 위해 기존 SNS 버튼(카카오/네이버/Apple)과 동일한 `MGButton` + Google
 * 공식 다색 로고 자산을 사용한다(브랜드 가이드 색상은 CI/BI 검사에서 예외 처리됨).
 * 버튼을 누르면 popup 으로 Google 동의 화면이 열리고 success 시 access_token 을 받는다.</p>
 *
 * <p>`<GoogleOAuthProvider>` 가 트리에 마운트되어 있지 않으면(=`GOOGLE_WEB_CLIENT_ID`
 * 미주입) `useGoogleLogin` 호출이 throw 한다. 따라서 본 컴포넌트는 항상
 * `isGoogleWebClientIdConfigured` 가 true 일 때만 렌더되도록 호출자(UnifiedLogin)가
 * 가드한다. 본 컴포넌트 자체에서도 이중 가드를 추가한다.</p>
 *
 * <p>props:
 * <ul>
 *   <li>{@code onSuccess(googleTokens)} — Google access_token / scope 를 외부로 전달.</li>
 *   <li>{@code onError(message)} — 사용자 친화 에러 메시지(취소·OAuth 실패 등).</li>
 *   <li>{@code disabled} — 외부 로딩 상태 등으로 비활성화.</li>
 *   <li>{@code label} — 버튼 라벨(i18n 적용된 텍스트).</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import { useGoogleLogin } from '@react-oauth/google';
import { useCallback } from 'react';
import MGButton from '../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../erp/common/erpMgButtonProps';
import { isGoogleWebClientIdConfigured } from '../../constants/oauth2';

const GOOGLE_LOGIN_SCOPES = 'openid email profile';

/**
 * Google access_token 응답을 정규화한다. `useGoogleLogin` 의 implicit 흐름 응답은
 * `{ access_token, token_type, scope, expires_in, ... }` 형태.
 *
 * @param {object} response GIS implicit flow 응답
 * @returns {{ accessToken: string|null, scope: string|null, idToken: string|null }}
 */
const extractGoogleAccessTokens = (response) => {
  const accessToken =
    typeof response?.access_token === 'string' && response.access_token.trim()
      ? response.access_token.trim()
      : null;
  // implicit 흐름은 일반적으로 idToken 을 반환하지 않지만, 미래 호환을 위해 보존한다.
  const idToken =
    typeof response?.id_token === 'string' && response.id_token.trim()
      ? response.id_token.trim()
      : null;
  const scope =
    typeof response?.scope === 'string' && response.scope.trim()
      ? response.scope.trim()
      : null;
  return { accessToken, idToken, scope };
};

/** Google 공식 다색 로고 SVG (UnifiedLogin 과 동일 자산). */
const GoogleLogoSvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Google 공식 다색 로고 자산 — 브랜드 가이드 고정 색상 유지(CI 스캔 예외). */}
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const GoogleLoginButton = ({
  onSuccess,
  onError,
  disabled = false,
  label = 'Google로 계속하기'
}) => {
  const handleSuccess = useCallback(
    (response) => {
      const tokens = extractGoogleAccessTokens(response);
      if (!tokens.accessToken && !tokens.idToken) {
        if (typeof onError === 'function') {
          onError('Google 로그인 응답에서 토큰을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.');
        }
        return;
      }
      if (typeof onSuccess === 'function') {
        onSuccess(tokens);
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (errorResponse) => {
      const description =
        (errorResponse && errorResponse.error_description)
        || (errorResponse && errorResponse.error)
        || 'Google 로그인에 실패했습니다.';
      if (typeof onError === 'function') {
        onError(description);
      }
    },
    [onError]
  );

  // `useGoogleLogin` 은 `<GoogleOAuthProvider>` 가 없으면 throw 한다 — 호출자 가드로 보장.
  const triggerGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: GOOGLE_LOGIN_SCOPES,
    onSuccess: handleSuccess,
    onError: handleError
  });

  if (!isGoogleWebClientIdConfigured) {
    // 안전망: provider 미주입 환경에서 본 컴포넌트가 잘못 렌더되어도 hook throw 직후
    // 도달하지 않지만, 정적 검사·로컬 환경 대비 명시적으로 null 을 반환한다.
    return null;
  }

  return (
    <MGButton
      type="button"
      variant="outline"
      onClick={() => triggerGoogleLogin()}
      disabled={disabled}
      className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-google`}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      preventDoubleClick={false}
      aria-label={label}
    >
      <GoogleLogoSvg />
      {label}
    </MGButton>
  );
};

export { extractGoogleAccessTokens };
export default GoogleLoginButton;
