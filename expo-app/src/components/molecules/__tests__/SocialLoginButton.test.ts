/**
 * SocialLoginButton — variant → 카피·a11y·브랜드 색 매핑 단위 테스트.
 *
 * 컴포넌트 전체 렌더는 react-native 환경이 필요하므로 본 테스트는
 * pure helper(`getSocialLoginVariantConfig`) 만 검증한다.
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
import {
  getSocialLoginVariantConfig,
  SOCIAL_LOGIN_VARIANT_ORDER,
  type SocialLoginVariant,
} from '@/components/molecules/socialLoginVariant';

describe('getSocialLoginVariantConfig — 카피·a11y·브랜드 색 (웹 톤 정합)', () => {
  test('kakao: 카피 "카카오 로그인" (웹 i18n key auth:unifiedLogin.socialLogin.kakao), 노란 배경, 어두운 텍스트', () => {
    const cfg = getSocialLoginVariantConfig('kakao');
    expect(cfg.label).toBe('카카오 로그인');
    expect(cfg.accessibilityLabel).toBe('카카오 로그인');
    expect(cfg.backgroundColor).toBe(OAUTH_KAKAO_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_KAKAO_FOREGROUND);
  });

  test('naver: 카피 "네이버 로그인" (웹 i18n key auth:unifiedLogin.socialLogin.naver), 녹색 배경, 흰 텍스트', () => {
    const cfg = getSocialLoginVariantConfig('naver');
    expect(cfg.label).toBe('네이버 로그인');
    expect(cfg.accessibilityLabel).toBe('네이버 로그인');
    expect(cfg.backgroundColor).toBe(OAUTH_NAVER_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_NAVER_FOREGROUND);
  });

  test('apple: 카피 "Apple로 계속하기" (웹 i18n key auth:unifiedLogin.socialLogin.apple), 검정 배경, 흰 텍스트', () => {
    const cfg = getSocialLoginVariantConfig('apple');
    expect(cfg.label).toBe('Apple로 계속하기');
    expect(cfg.accessibilityLabel).toBe('Apple로 계속하기');
    expect(cfg.backgroundColor).toBe(OAUTH_APPLE_BACKGROUND);
    expect(cfg.foregroundColor).toBe(OAUTH_APPLE_FOREGROUND);
  });

  test('등장 순서는 카카오 → 네이버 → Apple (스펙 §3.1 단계 9~11)', () => {
    expect(SOCIAL_LOGIN_VARIANT_ORDER).toEqual<SocialLoginVariant[]>(['kakao', 'naver', 'apple']);
  });

  test('각 variant 의 배경·전경 색이 모두 유효한 HEX 형식', () => {
    const hexPattern = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    SOCIAL_LOGIN_VARIANT_ORDER.forEach((v) => {
      const cfg = getSocialLoginVariantConfig(v);
      expect(cfg.backgroundColor).toMatch(hexPattern);
      expect(cfg.foregroundColor).toMatch(hexPattern);
    });
  });

  test('네이버 텍스트는 fontWeight 600 + 16pt 이상 가정 (AA Large 통과 — 스펙 §1.2)', () => {
    const cfg = getSocialLoginVariantConfig('naver');
    // 본 헬퍼는 색만 책임 — SocialLoginButton.tsx 가 fontFamily.semibold + fontSize.base 사용.
    // 색 contrast 검증은 시각 회귀에서 수행. 본 테스트는 흰 텍스트 반환만 보장.
    expect(cfg.foregroundColor).toBe('#FFFFFF');
  });
});
