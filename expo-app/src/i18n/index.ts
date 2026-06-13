/**
 * MindGarden Expo App — i18n SSOT.
 *
 * <p>역할:
 *  - 앱 부트스트랩 시점에 `i18next` + `react-i18next` 를 단 1회 초기화한다.
 *  - 디바이스 로케일을 `expo-localization` 의 `getLocales()` 로 감지하여 기본 언어를 결정한다.
 *  - 번역 SSOT 는 `src/i18n/translations/<lang>.json` 한 곳이다. 화면 코드에서는
 *    `useTranslation()` 또는 본 모듈의 `t()` 만 사용하고, 인라인 한국어 문자열을 추가하지 않는다.</p>
 *
 * <p>정책 (PR-B / A8):
 *  - 1차 적용 범위: 로그인 화면(`app/(auth)/login.tsx`) 의 모달·배너·에러 메시지.
 *  - 인라인 한국어 약 20,718 라인 일괄 마이그는 디자인 v2 와 병행. 본 PR 은 인프라·정책만 도입한다.
 *  - 신규 한국어 인라인 추가는 `eslint.config.js` 의 `no-restricted-syntax` warn 으로 점진 강화한다.</p>
 *
 * <p>SSOT 참조 문서:
 *  - `docs/standards/EXPO_APP_I18N_POLICY.md`</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
import i18n, { type ResourceLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import ko from './translations/ko.json';
import en from './translations/en.json';

/** 앱이 공식 지원하는 언어 코드. 미지원 로케일은 FALLBACK_LANGUAGE 로 폴백한다. */
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** 디바이스 로케일을 감지할 수 없거나 미지원 언어일 때 사용하는 기본 언어. */
export const FALLBACK_LANGUAGE: SupportedLanguage = 'ko';

const RESOURCES: Record<SupportedLanguage, { translation: ResourceLanguage }> = {
  ko: { translation: ko as ResourceLanguage },
  en: { translation: en as ResourceLanguage },
};

/**
 * 디바이스 로케일에서 지원 언어를 해석한다.
 *
 * @returns SUPPORTED_LANGUAGES 안에 포함되는 언어 코드. 매칭 실패 시 FALLBACK_LANGUAGE.
 */
export function resolveDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    for (const locale of locales) {
      const candidate = (locale.languageCode ?? '').toLowerCase();
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(candidate)) {
        return candidate as SupportedLanguage;
      }
    }
  } catch {
    /* 네이티브 모듈 미가용(예: Jest 환경) — 폴백 */
  }
  return FALLBACK_LANGUAGE;
}

let initialized = false;

/**
 * i18next 초기화. 멱등(idempotent) — 여러 번 호출되어도 1회만 init 한다.
 *
 * <p>`_layout.tsx` 의 최상단 import 부수효과로 한 번 실행되도록 `bootstrap()` 을 즉시 호출한다.
 * 테스트·세컨더리 진입점이 명시적으로 다시 호출해도 안전하다.</p>
 */
export function bootstrapI18n(): typeof i18n {
  if (initialized) {
    return i18n;
  }
  const language = resolveDeviceLanguage();
  // i18next default export 의 use / t / init 는 named export 와 동일 인스턴스 메서드다 (라이브러리 표준).
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources: RESOURCES,
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
  initialized = true;
  return i18n;
}

/** 외부에서 직접 키를 조회할 때 사용. 컴포넌트에서는 `useTranslation()` 우선. */
export function t(key: string, options?: Record<string, unknown>): string {
  if (!initialized) {
    bootstrapI18n();
  }
  // eslint-disable-next-line import/no-named-as-default-member
  return i18n.t(key, options) as string;
}

// Side-effect: 모듈 import 시점에 1회 초기화한다.
bootstrapI18n();

export default i18n;
