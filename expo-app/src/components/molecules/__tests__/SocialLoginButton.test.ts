/**
 * SocialLoginButton — variant → 카피·a11y·브랜드 색·Google 보더 매핑 단위 테스트 (V2).
 *
 * 컴포넌트 전체 렌더는 react-native 환경이 필요하므로 본 테스트는
 * pure helper(`getSocialLoginVariantConfig`) 만 검증한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §C.4 / §I.5 / §E.2.3.
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
import {
  getSocialLoginVariantConfig,
  SOCIAL_LOGIN_VARIANT_ORDER,
  type SocialLoginVariant,
} from '@/components/molecules/socialLoginVariant';

describe('getSocialLoginVariantConfig — V2 카피·a11y·브랜드 색', () => {
  test('kakao: 카피 "카카오로 로그인", 노란 배경, 어두운 텍스트, 보더 없음', () => {
    const cfg = getSocialLoginVariantConfig('kakao');
    expect(cfg.label).toBe('카카오로 로그인');
    expect(cfg.accessibilityLabel).toBe('카카오로 로그인');
    expect(cfg.backgroundColor).toBe(OAUTH_KAKAO_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_KAKAO_FOREGROUND);
    expect(cfg.borderColor).toBeUndefined();
  });

  test('naver: 카피 "네이버로 로그인", 녹색 배경, 흰 텍스트, 보더 없음', () => {
    const cfg = getSocialLoginVariantConfig('naver');
    expect(cfg.label).toBe('네이버로 로그인');
    expect(cfg.accessibilityLabel).toBe('네이버로 로그인');
    expect(cfg.backgroundColor).toBe(OAUTH_NAVER_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_NAVER_FOREGROUND);
    expect(cfg.borderColor).toBeUndefined();
  });

  test('google (V2 신규): 카피 "Google로 로그인", 흰 배경 + #1F1F1F 텍스트 + #747775 1px 보더 (§E.2.3 Light Theme)', () => {
    const cfg = getSocialLoginVariantConfig('google');
    expect(cfg.label).toBe('Google로 로그인');
    expect(cfg.accessibilityLabel).toBe('Google로 로그인');
    expect(cfg.backgroundColor).toBe(OAUTH_GOOGLE_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_GOOGLE_FOREGROUND);
    expect(cfg.borderColor).toBe(OAUTH_GOOGLE_BORDER);
  });

  test('apple: 카피 "Apple로 계속하기", 검정 배경, 흰 텍스트, 보더 없음', () => {
    const cfg = getSocialLoginVariantConfig('apple');
    expect(cfg.label).toBe('Apple로 계속하기');
    expect(cfg.accessibilityLabel).toBe('Apple로 계속하기');
    expect(cfg.backgroundColor).toBe(OAUTH_APPLE_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_APPLE_FOREGROUND);
    expect(cfg.borderColor).toBeUndefined();
  });

  test('등장 순서는 V2 §A.4 — 카카오 → 네이버 → Google → Apple', () => {
    expect(SOCIAL_LOGIN_VARIANT_ORDER).toEqual<SocialLoginVariant[]>([
      'kakao',
      'naver',
      'google',
      'apple',
    ]);
  });

  test('각 variant 의 배경·전경 색이 모두 유효한 HEX 형식', () => {
    const hexPattern = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    SOCIAL_LOGIN_VARIANT_ORDER.forEach((v) => {
      const cfg = getSocialLoginVariantConfig(v);
      expect(cfg.backgroundColor).toMatch(hexPattern);
      expect(cfg.foregroundColor).toMatch(hexPattern);
      if (cfg.borderColor) {
        expect(cfg.borderColor).toMatch(hexPattern);
      }
    });
  });

  test('네이버·Google·Apple 텍스트 색 검증 — 각자 정품 가이드 색 유지', () => {
    expect(getSocialLoginVariantConfig('naver').foregroundColor).toBe('#FFFFFF');
    expect(getSocialLoginVariantConfig('apple').foregroundColor).toBe('#FFFFFF');
    expect(getSocialLoginVariantConfig('google').foregroundColor).toBe('#1F1F1F');
  });

  test('Google 만 1px stroke `#747775` 보더를 가진다 (Brand Guideline §E.2.3)', () => {
    const variantsWithBorder = SOCIAL_LOGIN_VARIANT_ORDER.filter(
      (v) => getSocialLoginVariantConfig(v).borderColor !== undefined,
    );
    expect(variantsWithBorder).toEqual<SocialLoginVariant[]>(['google']);
    expect(getSocialLoginVariantConfig('google').borderColor).toBe('#747775');
  });
});
