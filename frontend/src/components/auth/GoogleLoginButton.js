/**
 * Google 로그인 버튼 — server-side auth-code (A-2) redirect 흐름.
 *
 * <p>UX 일관성을 위해 기존 SNS 버튼(카카오/네이버/Apple)과 동일한 `MGButton` + Google
 * 공식 다색 로고 자산을 사용한다(브랜드 가이드 색상은 CI/BI 검사에서 예외 처리됨).
 * 버튼을 누르면 BE `/api/v1/auth/oauth2/google/authorize` 가 반환한 authorize URL 로
 * 전체 페이지 redirect 한다. Google 동의 후 BE `/api/v1/auth/google/callback` 이
 * 토큰 교환·매칭·JWT 발급을 수행하고 테넌트 서브도메인의 `/auth/oauth2/callback`
 * 으로 redirect 한다(카카오/네이버 100% 동일 패턴).</p>
 *
 * <p>이전 implicit popup 흐름(`useGoogleLogin({ flow: 'implicit' })`) 은 멀티테넌트
 * 와일드카드 환경에서 Google 의 JavaScript origin 와일드카드 미지원으로
 * `origin_mismatch` 가 발생하여 폐기됐다(2026-06-10 P0 마이그레이션).</p>
 *
 * <p>props:
 * <ul>
 *   <li>{@code onError(message)} — redirect 실패 시 사용자 친화 에러(서브도메인 누락 등).</li>
 *   <li>{@code disabled} — 외부 로딩 상태 등으로 비활성화.</li>
 *   <li>{@code label} — 버튼 라벨(i18n 적용된 텍스트).</li>
 * </ul></p>
 *
 * <p>참고: 기존 호출자(UnifiedLogin) 의 {@code onSuccess} prop 은 server-side 흐름에서
 * 사용되지 않으므로(BE 가 SPA `/auth/oauth2/callback` 으로 redirect 한 뒤 JWT 처리) 본
 * 컴포넌트가 수신해도 호출하지 않는다. 호환성을 위해 prop 자체는 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import { useCallback, useState } from 'react';
import MGButton from '../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../erp/common/erpMgButtonProps';
import { isGoogleWebClientIdConfigured } from '../../constants/oauth2';
import { googleLogin } from '../../utils/socialLogin';
import GoogleBrandLogo from './GoogleBrandLogo';

const GoogleLoginButton = ({
  onError,
  disabled = false,
  label = 'Google로 계속하기'
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = useCallback(async() => {
    if (isRedirecting || disabled) {
      return;
    }
    setIsRedirecting(true);
    try {
      // server-side auth-code 흐름: googleLogin() 이 BE 인증 URL 을 받아 window.location 으로 전체 redirect.
      // 성공 시 본 컴포넌트는 페이지 전환으로 사라지므로 setIsRedirecting(false) 는 실패 분기에서만 수행.
      await googleLogin();
    } catch (error) {
      const description = (error && error.message)
        ? error.message
        : 'Google 로그인에 실패했습니다.';
      if (typeof onError === 'function') {
        onError(description);
      }
      setIsRedirecting(false);
    }
  }, [isRedirecting, disabled, onError]);

  if (!isGoogleWebClientIdConfigured) {
    // 안전망: client id 미주입 환경에서도 본 컴포넌트가 렌더되면 BE 에서 GOOGLE_CLIENT_ID_MISSING
    // 응답을 받아 사용자 친화 에러로 분기되지만, 그 이전에 명시적으로 null 반환하여 버튼을 숨긴다.
    return null;
  }

  return (
    <MGButton
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isRedirecting}
      className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} mg-v2-button-social mg-v2-button-google`}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      preventDoubleClick={false}
      aria-label={label}
    >
      <GoogleBrandLogo />
      {label}
    </MGButton>
  );
};

export default GoogleLoginButton;
