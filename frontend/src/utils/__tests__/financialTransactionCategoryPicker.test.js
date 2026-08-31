/**
 * financialTransactionCategoryPicker — Operator 돈 기록 카테고리 피커 (SSOT)
 */

import {
  buildFixedCategoryOptions,
  buildLedgerFilterCategoryOptions,
  buildSubcategoryPickerOptions,
  isOtherGroupCategory,
  parseSubcategoryPickerValue,
  resolvePrimaryCategoryHighlight,
  resolveSubcategoryPickerValue
} from '../financialTransactionCategoryPicker';
import {
  FM_TX_CAT_PICK_PREFIX,
  FM_TX_CATEGORY_FILTER_ALL,
  FM_TX_SUB_PICK_PREFIX
} from '../../constants/financialTransactionCategoryPicker';

const mockExpenseCategories = [
  { codeValue: 'RENT', codeLabel: '임대료', sortOrder: 2 },
  { codeValue: 'SALARY', codeLabel: '급여', sortOrder: 1 },
  { codeValue: 'UTILITY', codeLabel: '관리비', sortOrder: 3 },
  { codeValue: 'TAX', codeLabel: '세금', sortOrder: 5 },
  { codeValue: 'MEAL', codeLabel: '식대', sortOrder: 6 },
  { codeValue: 'OTHER', codeLabel: '기타잡비', sortOrder: 11 },
  { codeValue: 'MARKETING', codeLabel: '마케팅', sortOrder: 7 },
  { codeValue: 'OFFICE_SUPPLIES', codeLabel: '사무용품', sortOrder: 4 }
];

const mockExpenseSubcategories = [
  { codeValue: 'OFFICE_RENT', codeLabel: '사무실임대료', parentCodeValue: 'RENT', sortOrder: 1 },
  { codeValue: 'EAT_ANY', codeLabel: '식대일반', parentCodeValue: 'MEAL', sortOrder: 1 },
  { codeValue: 'OTHER_EXPENSE', codeLabel: '기타', parentCodeValue: 'OTHER', sortOrder: 1 },
  { codeValue: 'STATIONERY', codeLabel: '문구류', parentCodeValue: 'OFFICE_SUPPLIES', sortOrder: 1 }
];

const mockIncomeCategories = [
  { codeValue: '상담료', codeLabel: '상담료', sortOrder: 1 },
  { codeValue: 'OTHER', codeLabel: '기타수입', sortOrder: 3 },
  { codeValue: 'PACKAGE', codeLabel: '패키지', sortOrder: 2 }
];

describe('financialTransactionCategoryPicker', () => {
  it('buildFixedCategoryOptions — API SSOT 전체 부모 (고정 6칩/demote 없음)', () => {
    const options = buildFixedCategoryOptions('EXPENSE', mockExpenseCategories);
    expect(options.map((o) => o.value)).toEqual([
      'SALARY',
      'RENT',
      'UTILITY',
      'OFFICE_SUPPLIES',
      'TAX',
      'MEAL',
      'MARKETING',
      'OTHER'
    ]);
    expect(options.find((o) => o.value === 'OTHER')?.label).toBe('기타잡비');
    expect(options.some((o) => o.value === 'MARKETING')).toBe(true);
    expect(options.some((o) => o.value === 'OFFICE_SUPPLIES')).toBe(true);
  });

  it('buildFixedCategoryOptions — 수입 API SSOT 전체', () => {
    const options = buildFixedCategoryOptions('INCOME', mockIncomeCategories);
    expect(options.map((o) => o.value)).toEqual(['상담료', 'PACKAGE', 'OTHER']);
    expect(options.find((o) => o.value === 'OTHER')?.label).toBe('기타수입');
  });

  it('임대료 선택 시 parentCodeValue 일치 세부만 노출', () => {
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'RENT',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options).toEqual([
      { value: `${FM_TX_SUB_PICK_PREFIX}OFFICE_RENT`, label: '사무실임대료' }
    ]);
  });

  it('식대 선택 시 EAT_ANY 등 parent=MEAL 자식 노출', () => {
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'MEAL',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options).toEqual([
      { value: `${FM_TX_SUB_PICK_PREFIX}EAT_ANY`, label: '식대일반' }
    ]);
  });

  it('기타 선택 시 OTHER 자식만 — demoted 카테고리를 가짜 자식으로 넣지 않음', () => {
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'OTHER',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options.some((o) => o.value === `${FM_TX_CAT_PICK_PREFIX}MARKETING`)).toBe(false);
    expect(options.some((o) => o.value === `${FM_TX_CAT_PICK_PREFIX}OFFICE_SUPPLIES`)).toBe(false);
    expect(options).toEqual([
      { value: `${FM_TX_SUB_PICK_PREFIX}OTHER_EXPENSE`, label: '기타' }
    ]);
  });

  it('사무용품은 1행 부모 칩이며 자식을 parentCodeValue로만 필터', () => {
    expect(isOtherGroupCategory('EXPENSE', 'MARKETING')).toBe(false);
    expect(isOtherGroupCategory('EXPENSE', 'OFFICE_SUPPLIES')).toBe(false);
    expect(resolvePrimaryCategoryHighlight('EXPENSE', 'OFFICE_SUPPLIES')).toBe('OFFICE_SUPPLIES');
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'OFFICE_SUPPLIES',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options).toEqual([
      { value: `${FM_TX_SUB_PICK_PREFIX}STATIONERY`, label: '문구류' }
    ]);
    expect(resolveSubcategoryPickerValue('EXPENSE', 'OFFICE_SUPPLIES', 'STATIONERY')).toBe(
      `${FM_TX_SUB_PICK_PREFIX}STATIONERY`
    );
  });

  it('parseSubcategoryPickerValue — native sub (+ 레거시 cat: 하위호환)', () => {
    expect(parseSubcategoryPickerValue(`${FM_TX_CAT_PICK_PREFIX}MARKETING`, 'OTHER')).toEqual({
      category: 'MARKETING',
      subcategory: ''
    });
    expect(parseSubcategoryPickerValue(`${FM_TX_SUB_PICK_PREFIX}OFFICE_RENT`, 'RENT')).toEqual({
      category: 'RENT',
      subcategory: 'OFFICE_RENT'
    });
  });

  it('buildLedgerFilterCategoryOptions — 전체 + 수입/지출 SSOT 부모', () => {
    const options = buildLedgerFilterCategoryOptions(mockIncomeCategories, mockExpenseCategories);
    expect(options[0]).toEqual({ value: FM_TX_CATEGORY_FILTER_ALL, label: '전체' });
    expect(options.map((o) => o.value)).toContain('상담료');
    expect(options.map((o) => o.value)).toContain('SALARY');
    expect(options.map((o) => o.value)).toContain('OFFICE_SUPPLIES');
    expect(options.map((o) => o.value)).toContain('MARKETING');
    // OTHER 는 수입/지출에 모두 있어도 한 번만
    expect(options.filter((o) => o.value === 'OTHER')).toHaveLength(1);
  });
});
