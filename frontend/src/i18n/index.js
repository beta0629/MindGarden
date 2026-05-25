/**
 * i18n Phase 1 부트스트랩
 *
 * 전략 합의(2026-Q2):
 * - 라이브러리: react-i18next + i18next
 * - 디렉터리: src/locales/{lang}/{namespace}.json
 * - 키 명명: domain.feature.element.purpose (예: action.save, admin.dashboard.summary.title)
 * - 주 언어: ko (한국어). 영어는 Phase 2 이후 합의 후 추가.
 *
 * Phase 1 범위:
 * - 부트스트랩 + common namespace 시범. 대규모 한글 추출은 Phase 2 별도 위임.
 *
 * 사용:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation('common');
 *   <button>{t('action.save', '저장')}</button>
 *
 * @author Core Solution
 * @since 2026-05-21
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import koCommon from '../locales/ko/common.json';
import koAdmin from '../locales/ko/admin.json';
import koError from '../locales/ko/error.json';
import koSettings from '../locales/ko/settings.json';
import koStatistics from '../locales/ko/statistics.json';
import koReport from '../locales/ko/report.json';
import koErp from '../locales/ko/erp.json';
import koSchedule from '../locales/ko/schedule.json';
import koAuth from '../locales/ko/auth.json';
import koManualNotification from '../locales/ko/manualNotification.json';
import koTerms from '../locales/ko/terms.json';
import koTestNotification from '../locales/ko/testNotification.json';
import koSystemConfig from '../locales/ko/systemConfig.json';
import koSmsTemplate from '../locales/ko/smsTemplate.json';

const SUPPORTED_LANGUAGES = ['ko'];
const FALLBACK_LANGUAGE = 'ko';
const DEFAULT_NAMESPACE = 'common';
const LOCAL_STORAGE_KEY = 'i18nextLng';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        common: koCommon,
        admin: koAdmin,
        error: koError,
        settings: koSettings,
        statistics: koStatistics,
        report: koReport,
        erp: koErp,
        schedule: koSchedule,
        auth: koAuth,
        manualNotification: koManualNotification,
        terms: koTerms,
        testNotification: koTestNotification,
        systemConfig: koSystemConfig,
        smsTemplate: koSmsTemplate
      }
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: DEFAULT_NAMESPACE,
    ns: [
      'common',
      'admin',
      'error',
      'settings',
      'statistics',
      'report',
      'erp',
      'schedule',
      'auth',
      'manualNotification',
      'terms',
      'testNotification',
      'systemConfig',
      'smsTemplate'
    ],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LOCAL_STORAGE_KEY
    },
    returnEmptyString: false,
    react: {
      useSuspense: false
    }
  });

export default i18n;
