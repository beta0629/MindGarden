/**
 * SocialLoginButton variant → 표시 카피·a11y 라벨·브랜드 색·보더 매핑.
 *
 * <p>본 모듈은 react-native 의존성이 없어 node 환경 단위 테스트가 가능하다.</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §A.4 4 provider (카카오/네이버/Google/Apple)
 *  - §C.4 SNS Provider 색
 *  - §I.5 카피 (한국어 통일)
 *  - §E.2.3 Google Light Theme 정품 (Fill #FFFFFF + Stroke #747775 1px + Font #1F1F1F)</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import {
  OAUTH_APPLE_BACKGROUND,
  OAUTH_APPLE_FOREGROUND,
  OAUTH_GOOGLE_BACKGROUND,
  OAUTH_GOOGLE_BORDER,
  OAUTH_GOOGLE_FOREGROUND,
  OAUTH_KAKAO_BACKGROUND,
  OAUTH_KAKAO_FOREGROUND,
  OAUTH_NAVER_BACKGROUND,
  OAUTH_NAVER_FOREGROUND,
} from '@/constants/oauthProviderBrand';

export type SocialLoginVariant = 'kakao' | 'naver' | 'google' | 'apple';

export interface SocialLoginVariantConfig {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly backgroundColor: string;
  readonly foregroundColor: string;
  /**
   * V2 §E.2.3 Google Light Theme 1px stroke (`#747775`).
   * 카카오/네이버/Apple 은 보더 없이(`undefined`) 컨테이너 색만 사용한다.
   */
  readonly borderColor?: string;
}

/**
 * 카카오/네이버/Google/Apple 별 라벨·a11y·브랜드 색.
 *
 * <p>카피는 V2 §I.5 표 그대로:
 *  - 카카오: "카카오로 로그인"
 *  - 네이버: "네이버로 로그인"
 *  - Google: "Google로 로그인" (가이드 한국어 로컬라이즈 명시 허용 — §E.2.3)
 *  - Apple: "Apple로 계속하기" (네이티브 SDK 자동, fallback 한정)</p>
 */
const SOCIAL_LOGIN_VARIANT_MAP: Record<SocialLoginVariant, SocialLoginVariantConfig> = {
  kakao: {
    label: '카카오로 로그인',
    accessibilityLabel: '카카오로 로그인',
    backgroundColor: OAUTH_KAKAO_BACKGROUND,
    foregroundColor: OAUTH_KAKAO_FOREGROUND,
  },
  naver: {
    label: '네이버로 로그인',
    accessibilityLabel: '네이버로 로그인',
    backgroundColor: OAUTH_NAVER_BACKGROUND,
    foregroundColor: OAUTH_NAVER_FOREGROUND,
  },
  google: {
    label: 'Google로 로그인',
    accessibilityLabel: 'Google로 로그인',
    backgroundColor: OAUTH_GOOGLE_BACKGROUND,
    foregroundColor: OAUTH_GOOGLE_FOREGROUND,
    borderColor: OAUTH_GOOGLE_BORDER,
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

/** 정의된 모든 variant 목록 (등장 순서 V2 §A.4: 카카오 → 네이버 → Google → Apple). */
export const SOCIAL_LOGIN_VARIANT_ORDER: readonly SocialLoginVariant[] = [
  'kakao',
  'naver',
  'google',
  'apple',
];
