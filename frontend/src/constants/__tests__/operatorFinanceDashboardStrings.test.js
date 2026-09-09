/**
 * operatorFinanceDashboardStrings — Clinic-OS copy SSOT locks (OFD TODO)
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  OFD_PAGE_TITLE,
  OFD_MAIN_ARIA_LABEL,
  OFD_HERO,
  OFD_CHART,
  OFD_WORKBENCH,
  OFD_MIX_CATEGORY,
  OFD_FACTS,
  OFD_SALARY_CHECKLIST,
  OFD_TODO_RULES,
  OFD_LEDGER,
  OFD_LINKS,
  OFD_LOADING,
  OFD_ERRORS
} from '../operatorFinanceDashboardStrings';
import { SM_TODO_TITLE, SM_TODO_TITLE_OFD } from '../salaryManagementClinicOsStrings';

/**
 * Flatten string values from nested Clinic-OS copy exports for banned-phrase scans.
 * @param {unknown} value
 * @returns {string[]}
 */
function collectKoreanCopyStrings(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).flatMap(collectKoreanCopyStrings);
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectKoreanCopyStrings);
  }
  return [];
}

describe('operatorFinanceDashboardStrings Clinic-OS TODO copy', () => {
  test('OFD_WORKBENCH TODO title and aria lock to 지금 할 일', () => {
    expect(OFD_WORKBENCH.TODO_TITLE).toBe('지금 할 일');
    expect(OFD_WORKBENCH.TODO_ARIA).toBe('지금 할 일');
  });

  test('OFD workbench and related titles ban 손볼 (only 할 일 / 지금 할 일)', () => {
    const blob = collectKoreanCopyStrings({
      OFD_PAGE_TITLE,
      OFD_MAIN_ARIA_LABEL,
      OFD_HERO,
      OFD_CHART,
      OFD_WORKBENCH,
      OFD_MIX_CATEGORY,
      OFD_FACTS,
      OFD_SALARY_CHECKLIST,
      OFD_TODO_RULES,
      OFD_LEDGER,
      OFD_LINKS,
      OFD_LOADING,
      OFD_ERRORS
    }).join(' ');

    expect(blob).not.toMatch(/손볼/);
    expect(OFD_WORKBENCH.TODO_TITLE).not.toMatch(/손볼/);
    expect(OFD_WORKBENCH.TODO_ARIA).not.toMatch(/손볼/);
  });

  test('salary strip twin stays 할 일 while OFD twin stays 지금 할 일', () => {
    expect(SM_TODO_TITLE).toBe('할 일');
    expect(SM_TODO_TITLE_OFD).toBe(OFD_WORKBENCH.TODO_TITLE);
    expect(SM_TODO_TITLE_OFD).toBe('지금 할 일');
  });
});
