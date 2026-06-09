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

/** 카카오/네이버/Apple 별 라벨·a11y·브랜드 색 — 스펙 §10.5 카피 고정. */
const SOCIAL_LOGIN_VARIANT_MAP: Record<SocialLoginVariant, SocialLoginVariantConfig> = {
  kakao: {
    label: '카카오로 시작하기',
    accessibilityLabel: '카카오로 시작하기',
    backgroundColor: OAUTH_KAKAO_BACKGROUND,
    foregroundColor: OAUTH_KAKAO_FOREGROUND,
  },
  naver: {
    label: '네이버로 시작하기',
    accessibilityLabel: '네이버로 시작하기',
    backgroundColor: OAUTH_NAVER_BACKGROUND,
    foregroundColor: OAUTH_NAVER_FOREGROUND,
  },
  apple: {
    label: 'Sign in with Apple',
    accessibilityLabel: 'Sign in with Apple',
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
