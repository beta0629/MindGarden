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

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 운영 안전 fallback: 시드 누락 키가 raw 로 화면 노출되는 회귀(2026-05-26 D5 P4 인벤토리에서
 * 28건 발견)를 차단. 'admin:labels.notification' / 'admin.labels.notification' 등 어떤 형태든
 * 마지막 leaf 토큰을 사람이 읽을 수 있는 텍스트로 변환한다. 운영 사용자는 키 문자열 대신
 * 토큰화된 한국어 라벨을 보게 된다.
 *
 * 변환 예시:
 *   'admin:labels.userManagement' → '사용자 관리' (camelCase 분리 + 한국어 사전 매핑 후 fallback)
 *   'common:actions.refresh'      → 'refresh' (사전 미스 시 camelCase 분리)
 *   'unknown.deep.path'           → 'path'
 */
const KO_LEAF_FALLBACK = {
  notification: '알림',
  userManagement: '사용자 관리',
  clientManagement: '내담자 관리',
  systemSettings: '시스템 설정',
  consultant: '상담사',
  client: '내담자',
  inactive: '비활성',
  active: '활성',
  cancel: '취소',
  confirm: '확인',
  close: '닫기',
  save: '저장',
  delete: '삭제',
  refresh: '새로고침',
  loading: '로딩 중...',
  all: '전체'
};

function humanizeLeaf(leaf) {
  if (!leaf) {
    return '';
  }
  if (KO_LEAF_FALLBACK[leaf]) {
    return KO_LEAF_FALLBACK[leaf];
  }
  // camelCase → "Camel Case" (영문 키만 그대로 표시 — 한글 키는 그대로 노출 안전)
  return leaf
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function parseMissingKeyHandler(key, defaultValue) {
  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    return defaultValue;
  }
  if (typeof key !== 'string') {
    return '';
  }
  // 'ns:path.leaf' 또는 'path.leaf'
  const afterColon = key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
  const tokens = afterColon.split('.');
  return humanizeLeaf(tokens[tokens.length - 1] || '');
}

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
    },
    parseMissingKeyHandler,
    saveMissing: IS_DEV,
    missingKeyHandler: IS_DEV
      ? (lngs, ns, key, fallbackValue) => {
          // eslint-disable-next-line no-console
          console.warn(
            `[i18n] Missing key — lng=${Array.isArray(lngs) ? lngs.join(',') : lngs} ns=${ns} key="${key}" fallback="${fallbackValue ?? ''}"`
          );
        }
      : undefined,
    appendNamespaceToMissingKey: false
  });

export default i18n;
