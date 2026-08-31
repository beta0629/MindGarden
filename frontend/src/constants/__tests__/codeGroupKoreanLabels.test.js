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
  'AGE_GROUP'
];

describe('CODE_GROUP_KO_FALLBACK SSOT', () => {
  test('legacy exports are the same object as SSOT (no second map)', () => {
    expect(TENANT_COMMON_CODE_GROUP_KO_FALLBACK).toBe(CODE_GROUP_KO_FALLBACK);
    expect(COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK).toBe(CODE_GROUP_KO_FALLBACK);
  });

  test('ADMIN_MENU is 관리자메뉴 (not 어드민메뉴)', () => {
    expect(CODE_GROUP_KO_FALLBACK.ADMIN_MENU).toBe('관리자메뉴');
    expect(CODE_GROUP_KO_FALLBACK.ADMIN_PERMISSIONS).toBe('관리자권한');
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
