/**
 * SocialLoginButton variant → 표시 카피·a11y 라벨·브랜드 색 매핑.
 *
 * 본 모듈은 react-native 의존성이 없어 node 환경 단위 테스트가 가능하다.
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §1.2 / §10.5.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import {
  OAUTH_APPLE_BACKGROUND,
  OAUTH_APPLE_FOREGROUND,
  OAUTH_KAKAO_BACKGROUND,
  OAUTH_KAKAO_FOREGROUND,
  OAUTH_NAVER_BACKGROUND,
  OAUTH_NAVER_FOREGROUND,
} from '@/constants/oauthProviderBrand';

export type SocialLoginVariant = 'kakao' | 'naver' | 'apple';

export interface SocialLoginVariantConfig {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly backgroundColor: string;
  readonly foregroundColor: string;
}

/**
 * 카카오/네이버/Apple 별 라벨·a11y·브랜드 색 — 웹 frontend (`UnifiedLogin.js` + `auth.json`) 카피와
 * 동일하게 통일 (사용자 결정 2026-06-10).
 *
 *  - 카카오: 웹 i18n key `auth:unifiedLogin.socialLogin.kakao` → "카카오 로그인"
 *  - 네이버: 웹 i18n key `auth:unifiedLogin.socialLogin.naver` → "네이버 로그인"
 *  - Apple: 웹 i18n key `auth:unifiedLogin.socialLogin.apple` → "Apple로 계속하기"
 *    (Apple 네이티브 버튼은 `AppleAuthenticationButtonType.CONTINUE` 사용 시
 *     디바이스 locale 한국어에서 동일 카피 자동 렌더 — 본 fallback 변형은 SIWA 미지원 시만 노출)
 */
const SOCIAL_LOGIN_VARIANT_MAP: Record<SocialLoginVariant, SocialLoginVariantConfig> = {
  kakao: {
    label: '카카오 로그인',
    accessibilityLabel: '카카오 로그인',
    backgroundColor: OAUTH_KAKAO_BACKGROUND,
    foregroundColor: OAUTH_KAKAO_FOREGROUND,
  },
  naver: {
    label: '네이버 로그인',
    accessibilityLabel: '네이버 로그인',
    backgroundColor: OAUTH_NAVER_BACKGROUND,
    foregroundColor: OAUTH_NAVER_FOREGROUND,
  },
  apple: {
    label: 'Apple로 계속하기',
    accessibilityLabel: 'Apple로 계속하기',
    backgroundColor: OAUTH_APPLE_BACKGROUND,
    foregroundColor: OAUTH_APPLE_FOREGROUND,
  },
};

/** variant 에 해당하는 단일 config 반환. */
export function getSocialLoginVariantConfig(variant: SocialLoginVariant): SocialLoginVariantConfig {
  return SOCIAL_LOGIN_VARIANT_MAP[variant];
}

/** 정의된 모든 variant 목록 (등장 순서: 카카오 → 네이버 → Apple). */
export const SOCIAL_LOGIN_VARIANT_ORDER: readonly SocialLoginVariant[] = [
  'kakao',
  'naver',
  'apple',
];
