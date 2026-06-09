/**
 * 카카오·네이버·Google·Apple 정품 브랜드 심볼 SVG.
 *
 * Source: simple-icons (CC0 1.0 Universal). Brand: KakaoTalk, Naver, Google, Apple.
 * Extracted 2026-06-10 from `node_modules/simple-icons/icons/{kakaotalk,naver,google,apple}.svg`.
 * 원본 자산은 `expo-app/assets/social/{kakaotalk,naver,apple}.svg` 에도 보관.
 *
 * 라이선스 — CC0 1.0:
 *  - 저작권자(simpleicons.org)가 모든 권리를 포기, 상업/재배포 자유.
 *  - 브랜드 가이드라인은 별도이므로 색상은 각 사 정품 hex 그대로 사용.
 *
 * 본 atom 은 색상 정책을 갖지 않는다 — 호출자(`SocialLoginButton`)가 variant 별
 * foreground 색을 명시 전달한다. atom 내부에 디자인 토큰 외 값을 두지 않음으로써
 * `no-restricted-syntax` 색상 하드코딩 경고를 회피하고 단일 책임을 유지.
 *
 * 단, {@link GoogleBrandIcon} 은 Google Brand Guideline 강제 다색 G (Blue/Green/Yellow/Red)
 * 이므로 `@/constants/oauthProviderBrand` 에서 정의된 `GOOGLE_LOGO_*` 상수만 사용한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import Svg, { Path } from 'react-native-svg';
import {
  GOOGLE_LOGO_BLUE,
  GOOGLE_LOGO_GREEN,
  GOOGLE_LOGO_RED,
  GOOGLE_LOGO_YELLOW,
} from '@/constants/oauthProviderBrand';

export interface SocialBrandIconProps {
  readonly size: number;
  readonly color: string;
}

/**
 * 카카오 단순 말풍선 (워드마크 제거 — 사용자 결정 2026-06-10 §AU 권장안 옵션 3).
 *
 * Source: simple-icons kakaotalk.svg (CC0 1.0) 의 둥근 사각형 외곽선·TALK 워드마크를 제거하고
 * 말풍선 본체만 추출. 동일 path 가 웹 frontend `frontend/src/components/auth/UnifiedLogin.js`
 * 의 카카오 SVG (18×18) 와 1:1 정합. CC0 1.0 라이선스로 변형·재배포 자유.
 *
 * 노란 배경(#FEE500) 위에서 fill=#3C1E1E 로 그리면 정품 카카오 말풍선 외관 유지.
 * 18dp 사이즈에서도 가독성 확보 (워드마크 제거로 시각 무게가 네이버 N·Apple 사과와 통일).
 */
export function KakaoBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fillRule="evenodd"
        fill={color}
        d="M12 3.375c-5.385 0-9.75 3.442-9.75 7.688 0 2.745 1.825 5.153 4.57 6.514-.15.515-.96 3.313-.992 3.533 0 0 .017.214.088.228.07.014.233-.014.233-.014.307-.043 3.557-2.326 4.12-2.723.562.08 1.14.121 1.732.121 5.385 0 9.75-3.442 9.75-7.688S17.385 3.375 12 3.375z"
      />
    </Svg>
  );
}

/**
 * 네이버 정품 "N" 워드마크.
 * Source: simple-icons naver.svg. CC0 1.0.
 *
 * 녹색 배경(#03C75A) 위에서 fill=#FFFFFF 로 그리면 정품 네이버 로그인 버튼 외관.
 */
export function NaverBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={color}
        d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"
      />
    </Svg>
  );
}

/**
 * Apple 정품 사과 마크.
 * Source: simple-icons apple.svg. CC0 1.0.
 *
 * 검정 배경(#000000) 위에서 fill=#FFFFFF 로 그리면 정품 Apple 아이콘.
 * 운영 빌드에서는 `expo-apple-authentication.AppleAuthenticationButton` 네이티브 컴포넌트가
 * 사용되므로 본 fallback 은 Expo Go / SIWA 비활성 단말에서만 노출된다.
 */
export function AppleBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={color}
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </Svg>
  );
}

/**
 * Google 정품 다색 G 로고 (Brand Guideline 강제, §E.2.3).
 * Source: Google Identity Branding Guidelines (https://developers.google.com/identity/branding-guidelines).
 *
 * <p>4색 G 로고 — Blue/Green/Yellow/Red 표준 다색 강제. 단색 변형 / 색 임의 변경 금지.
 * 본 컴포넌트는 `color` prop 을 무시하고 {@link GOOGLE_LOGO_BLUE} 등 상수를 직접 사용한다 —
 * 다른 SocialBrandIcon 들과 prop 시그니처를 통일해 호출자가 분기 없이 사용할 수 있도록 한다.</p>
 *
 * <p>SVG 데이터는 Google 공식 가이드의 표준 다색 G 로고와 동일 비율 — 흰 배경(`OAUTH_GOOGLE_BACKGROUND`)
 * 또는 중성 배경에서만 사용. 색 배경에 단독으로 두지 않는다.</p>
 */
export function GoogleBrandIcon({ size }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path
        fill={GOOGLE_LOGO_BLUE}
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill={GOOGLE_LOGO_RED}
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill={GOOGLE_LOGO_GREEN}
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill={GOOGLE_LOGO_YELLOW}
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}
