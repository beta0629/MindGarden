/**
 * i18n SSOT 단위 테스트
 *
 * 검증 대상:
 *  - 부트스트랩 멱등성 (여러 번 호출되어도 1회만 init)
 *  - SUPPORTED_LANGUAGES / FALLBACK_LANGUAGE 정합성
 *  - ko/en 번역 키가 동일하게 정의되어 있는지 (parity)
 *  - 로그인 마이그된 핵심 키들이 모두 존재 + 비어있지 않은지
 *
 * @author MindGarden
 * @since 2026-06-14
 */
import i18n, { bootstrapI18n, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, t } from '../index';
import ko from '../translations/ko.json';
import en from '../translations/en.json';

jest.mock('expo-localization', () => ({
  /**
   * Jest 환경에는 native module 이 없어 실제 호출이 실패한다.
   * 폴백 분기를 강제로 트리거하기 위해 빈 배열을 반환한다.
   */
  getLocales: () => [],
  getCalendars: () => [],
}));

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    return [prefix];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.push(...collectKeys(value, path));
  }
  return out;
}

describe('i18n SSOT', () => {
  test('SUPPORTED_LANGUAGES 에 ko / en 이 포함된다', () => {
    expect(SUPPORTED_LANGUAGES).toContain('ko');
    expect(SUPPORTED_LANGUAGES).toContain('en');
  });

  test('FALLBACK_LANGUAGE 는 한국어이다', () => {
    expect(FALLBACK_LANGUAGE).toBe('ko');
  });

  test('bootstrapI18n 은 멱등이다 (여러 번 호출되어도 같은 인스턴스 반환)', () => {
    const a = bootstrapI18n();
    const b = bootstrapI18n();
    expect(a).toBe(b);
    expect(a).toBe(i18n);
  });

  test('ko / en 번역 키 트리가 동일하다 (parity)', () => {
    const koKeys = collectKeys(ko).sort();
    const enKeys = collectKeys(en).sort();
    expect(enKeys).toEqual(koKeys);
  });

  describe('로그인 화면 1차 마이그 키 정합', () => {
    const LOGIN_KEYS = [
      'auth.login.duplicate.modalTitle',
      'auth.login.duplicate.fallbackBody',
      'auth.login.duplicate.confirmLabel',
      'auth.login.duplicate.cancelLabel',
      'auth.login.duplicate.retryFailedFallback',
      'auth.login.expoGo.title',
      'auth.login.expoGo.body',
      'auth.login.errors.kakao',
      'auth.login.errors.kakaoGeneric',
      'auth.login.errors.naver',
      'auth.login.errors.naverGeneric',
    ] as const;

    test.each(LOGIN_KEYS)('키 "%s" 가 ko 에서 비어있지 않다', (key) => {
      const value = t(key);
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      // 누락된 키일 때 i18next 는 키 그대로 반환한다 — 누락 회귀 차단.
      expect(value).not.toBe(key);
    });
  });

  test('미정의 키는 키 문자열을 그대로 반환한다 (fallback)', () => {
    const value = t('definitely.not.defined.key');
    expect(value).toBe('definitely.not.defined.key');
  });
});
