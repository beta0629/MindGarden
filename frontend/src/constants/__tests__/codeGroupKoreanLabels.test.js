/**
 * CODE_GROUP_KO_FALLBACK SSOT — 운영자 그룹 라벨·센터 카피 정적 검증
 *
 * @author Core Solution
 * @since 2026-08-31
 */

import {
  CODE_GROUP_KO_FALLBACK,
  resolveCodeGroupKoreanLabel
} from '../codeGroupKoreanLabels';
import { TENANT_COMMON_CODE_GROUP_KO_FALLBACK } from '../tenantCommonCodeManagerStrings';
import { COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK } from '../commonCodeManagementStrings';
import { TENANT_CODE_GROUPS, TENANT_WRITE_ISOLATED_GROUPS } from '../tenantCodeConstants';
import {
  TENANT_COMMON_CODE_UI
} from '../tenantCommonCodeManagerStrings';
import {
  TENANT_COMMON_CODE_OVERRIDE_LABELS,
  TENANT_COMMON_CODE_TABLE_ARIA
} from '../tenantCommonCodeTableConstants';
import { CONSULTANT_COMP_SPECIALTY } from '../consultantComprehensiveStrings';
import { clearCodeGroupCache, getCodeGroupKoreanNameSync } from '../../utils/codeHelper';

const GAP_GROUPS = [
  'CLIENT_GRADE',
  'ADMIN_GRADE',
  'COMPLETION_STATUS',
  'FINANCIAL_SUBCATEGORY',
  'TAX_TYPE',
  'SALARY_GRADE',
  'ITEM_STATUS',
  'APPROVAL_TYPE',
  'APPROVAL_PRIORITY',
  'PROFESSIONAL_PROVIDER_TYPE',
  'ASSESSMENT_TYPE',
  'ADMIN_PERMISSIONS',
  'AGE_GROUP',
  'ALIMTALK_BIZ_TEMPLATE_CODE',
  'BUSINESS_TYPE',
  'DAY_OF_WEEK',
  'EMAIL_CONFIG',
  'ERP_ACCOUNT_TYPE',
  'ONBOARDING_STATUS',
  'PACKAGE',
  'PASSWORD_POLICY',
  'PASSWORD_RESET',
  'PG_PROVIDER',
  'REFUND_PERIOD',
  'REFUND_REASON',
  'REFUND_STATUS',
  'REGION',
  'RISK_LEVEL',
  'SALARY_BASE_DATE',
  'SALARY_CONFIG',
  'SALARY_TAX_RATE',
  'SCHEDULE_CLIENT_NOTE_TYPE',
  'SMS_TEMPLATE',
  'SPECIAL_SUPPORT_SALARY',
  'SUBSCRIPTION_STATUS',
  'SYSTEM_CONFIG',
  'TIME_SLOT',
  'WIDGET_TYPE'
];

const LIVE_GAP_GROUP_EXPECTED_LABELS = Object.freeze({
  ERP_ACCOUNT_TYPE: '회계계정유형',
  ONBOARDING_STATUS: '온보딩상태',
  PACKAGE: '패키지',
  PASSWORD_POLICY: '비밀번호정책',
  PASSWORD_RESET: '비밀번호재설정',
  PG_PROVIDER: '결제대행제공자',
  REFUND_PERIOD: '환불기간',
  REFUND_REASON: '환불사유',
  REFUND_STATUS: '환불상태',
  REGION: '지역',
  RISK_LEVEL: '위험수준',
  SALARY_BASE_DATE: '급여기준일',
  SALARY_CONFIG: '급여설정',
  SALARY_TAX_RATE: '급여세율',
  SCHEDULE_CLIENT_NOTE_TYPE: '스케줄내담자메모유형',
  SMS_TEMPLATE: '문자템플릿',
  SPECIAL_SUPPORT_SALARY: '특수지원급여',
  SUBSCRIPTION_STATUS: '구독상태',
  SYSTEM_CONFIG: '시스템설정',
  TIME_SLOT: '시간슬롯',
  WIDGET_TYPE: '위젯유형'
});

describe('CODE_GROUP_KO_FALLBACK SSOT', () => {
  test('legacy exports are the same object as SSOT (no second map)', () => {
    expect(TENANT_COMMON_CODE_GROUP_KO_FALLBACK).toBe(CODE_GROUP_KO_FALLBACK);
    expect(COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK).toBe(CODE_GROUP_KO_FALLBACK);
  });

  test('ADMIN_MENU is 관리자메뉴 (not 어드민메뉴)', () => {
    expect(CODE_GROUP_KO_FALLBACK.ADMIN_MENU).toBe('관리자메뉴');
    expect(CODE_GROUP_KO_FALLBACK.ADMIN_PERMISSIONS).toBe('관리자권한');
  });

  test('live .dev gap groups have conservative Korean labels', () => {
    expect(CODE_GROUP_KO_FALLBACK.ALIMTALK_BIZ_TEMPLATE_CODE).toBe('알림톡비즈템플릿');
    expect(CODE_GROUP_KO_FALLBACK.ALIMTALK_CONFIG).toBe('알림톡설정');
    expect(CODE_GROUP_KO_FALLBACK.ALIMTALK_TEMPLATE).toBe('알림톡템플릿');
    expect(CODE_GROUP_KO_FALLBACK.BUSINESS_TYPE).toBe('업종');
    expect(CODE_GROUP_KO_FALLBACK.DAY_OF_WEEK).toBe('요일');
    expect(CODE_GROUP_KO_FALLBACK.EMAIL_CONFIG).toBe('이메일설정');
  });

  test('follow-up live-gap 21 groups resolve to Korean (no Latin acronyms)', () => {
    Object.entries(LIVE_GAP_GROUP_EXPECTED_LABELS).forEach(([key, expected]) => {
      expect(CODE_GROUP_KO_FALLBACK[key]).toBe(expected);
      expect(resolveCodeGroupKoreanLabel(key)).toBe(expected);
      expect(getCodeGroupKoreanNameSync(key)).toBe(expected);
      expect(expected).not.toMatch(/[A-Z]{2,}/);
    });
  });

  test('gap groups have Korean labels different from keys', () => {
    GAP_GROUPS.forEach((key) => {
      expect(CODE_GROUP_KO_FALLBACK[key]).toBeTruthy();
      expect(CODE_GROUP_KO_FALLBACK[key]).not.toBe(key);
      expect(CODE_GROUP_KO_FALLBACK[key]).not.toMatch(/[A-Z]{2,}/);
    });
  });

  test('TENANT_CODE_GROUPS and write-isolated groups are covered', () => {
    [...new Set([...TENANT_CODE_GROUPS, ...TENANT_WRITE_ISOLATED_GROUPS])].forEach((key) => {
      expect(CODE_GROUP_KO_FALLBACK[key]).toBeTruthy();
      expect(resolveCodeGroupKoreanLabel(key)).not.toBe(key);
    });
  });

  test('every SSOT value is Korean-only (not equal to English key)', () => {
    Object.entries(CODE_GROUP_KO_FALLBACK).forEach(([key, label]) => {
      expect(label).not.toBe(key);
      expect(String(label)).toMatch(/[가-힣]/);
    });
  });
});

describe('getCodeGroupKoreanNameSync + cache', () => {
  afterEach(() => {
    clearCodeGroupCache();
  });

  test('empty cache returns SSOT Korean, not English key', () => {
    clearCodeGroupCache();
    expect(getCodeGroupKoreanNameSync('EXPENSE_SUBCATEGORY')).toBe('지출하위카테고리');
    expect(getCodeGroupKoreanNameSync('ADDRESS_TYPE')).toBe('주소유형');
    expect(getCodeGroupKoreanNameSync('CLIENT_GRADE')).toBe('내담자등급');
  });
});

describe('operator copy: 테넌트 → 센터 (common-codes scope)', () => {
  const uiBlobs = [
    TENANT_COMMON_CODE_UI.LAYOUT_TITLE,
    TENANT_COMMON_CODE_UI.CONTENT_ARIA_LABEL,
    TENANT_COMMON_CODE_UI.HEADER_TITLE,
    TENANT_COMMON_CODE_UI.HEADER_SUBTITLE,
    TENANT_COMMON_CODE_OVERRIDE_LABELS.TENANT_ONLY,
    TENANT_COMMON_CODE_TABLE_ARIA.ROW_ACTIONS,
    TENANT_COMMON_CODE_TABLE_ARIA.TABLE,
    CONSULTANT_COMP_SPECIALTY.HELP_MANAGE_VIA_TENANT_CODES
  ];

  test('operator-facing strings do not contain 테넌트', () => {
    uiBlobs.forEach((s) => {
      expect(s).not.toMatch(/테넌트/);
    });
  });

  test('page/LNB copy uses 센터 코드', () => {
    expect(TENANT_COMMON_CODE_UI.LAYOUT_TITLE).toBe('센터 코드');
    expect(TENANT_COMMON_CODE_OVERRIDE_LABELS.TENANT_ONLY).toBe('센터 전용');
    expect(CONSULTANT_COMP_SPECIALTY.HELP_MANAGE_VIA_TENANT_CODES).toMatch(/센터 코드/);
  });
});
