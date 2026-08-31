/**
 * EXPENSE SSOT — tenant-only read groups + auto codeValue helpers
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import {
  AUTO_CODE_VALUE_GROUPS,
  HYBRID_READ_WITH_CORE_FALLBACK_GROUPS,
  supportsAutoCodeValue,
  TENANT_CODE_GROUPS,
  TENANT_WRITE_ISOLATED_GROUPS
} from '../../constants/tenantCodeConstants';
import {
  FM_TX_CATEGORY_FILTER_ALL,
  FM_TX_SUB_PICK_PREFIX
} from '../../constants/financialTransactionCategoryPicker';
import { getParentCodeGroupForSubcategory } from '../../utils/commonCodeParentGroups';
import {
  buildFixedCategoryOptions,
  buildSubcategoryPickerOptions
} from '../../utils/financialTransactionCategoryPicker';
import * as pickerConstants from '../../constants/financialTransactionCategoryPicker';

describe('expense common-code SSOT constants', () => {
  test('EXPENSE_/INCOME_ groups are tenant-write isolated and not hybrid-read', () => {
    ['EXPENSE_CATEGORY', 'EXPENSE_SUBCATEGORY', 'INCOME_CATEGORY', 'INCOME_SUBCATEGORY'].forEach((g) => {
      expect(TENANT_WRITE_ISOLATED_GROUPS).toContain(g);
      expect(HYBRID_READ_WITH_CORE_FALLBACK_GROUPS).not.toContain(g);
      expect(TENANT_CODE_GROUPS).toContain(g);
    });
  });

  test('FINANCIAL_SUBCATEGORY is not hybrid-read (tenant-only / deprecate leftover)', () => {
    expect(HYBRID_READ_WITH_CORE_FALLBACK_GROUPS).not.toContain('FINANCIAL_SUBCATEGORY');
  });

  test('supportsAutoCodeValue covers expense/income/package without name lists', () => {
    expect(supportsAutoCodeValue('EXPENSE_CATEGORY')).toBe(true);
    expect(supportsAutoCodeValue('EXPENSE_SUBCATEGORY')).toBe(true);
    expect(supportsAutoCodeValue('CONSULTATION_PACKAGE')).toBe(true);
    expect(supportsAutoCodeValue('ASSESSMENT_TYPE')).toBe(false);
    expect(AUTO_CODE_VALUE_GROUPS.every((g) => typeof g === 'string')).toBe(true);
  });

  test('parent filter: EXPENSE_SUBCATEGORY → EXPENSE_CATEGORY', () => {
    expect(getParentCodeGroupForSubcategory('EXPENSE_SUBCATEGORY')).toBe('EXPENSE_CATEGORY');
    expect(getParentCodeGroupForSubcategory('INCOME_SUBCATEGORY')).toBe('INCOME_CATEGORY');
  });

  test('forbidden display-only fixed/demoted maps are removed', () => {
    expect(pickerConstants.FM_TX_FIXED_CATEGORY_CODES).toBeUndefined();
    expect(pickerConstants.FM_TX_DEMOTED_UNDER_OTHER).toBeUndefined();
    expect(pickerConstants.FM_TX_FIXED_SUBCATEGORY_CODES).toBeUndefined();
    expect(FM_TX_CATEGORY_FILTER_ALL).toBe('ALL');
    expect(FM_TX_SUB_PICK_PREFIX).toBe('sub:');
  });

  test('picker parents come from API rows; children match parentCodeValue only', () => {
    const parents = buildFixedCategoryOptions('EXPENSE', [
      { codeValue: 'MEAL', codeLabel: '식대', sortOrder: 1 },
      { codeValue: 'OFFICE_SUPPLIES', codeLabel: '사무용품', sortOrder: 2 }
    ]);
    expect(parents.map((o) => o.value)).toEqual(['MEAL', 'OFFICE_SUPPLIES']);
    const children = buildSubcategoryPickerOptions(
      'EXPENSE',
      'MEAL',
      parents,
      [
        { codeValue: 'EAT_ANY', codeLabel: '식대일반', parentCodeValue: 'MEAL' },
        { codeValue: 'STATIONERY', codeLabel: '문구류', parentCodeValue: 'OFFICE_SUPPLIES' }
      ]
    );
    expect(children).toEqual([{ value: 'sub:EAT_ANY', label: '식대일반' }]);
  });
});
