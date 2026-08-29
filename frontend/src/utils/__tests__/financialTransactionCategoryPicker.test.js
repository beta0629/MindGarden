/**
 * financialTransactionCategoryPicker — Operator 돈 기록 카테고리 피커
 */

import {
  buildFixedCategoryOptions,
  buildSubcategoryPickerOptions,
  isOtherGroupCategory,
  parseSubcategoryPickerValue,
  resolvePrimaryCategoryHighlight,
  resolveSubcategoryPickerValue
} from '../financialTransactionCategoryPicker';
import { FM_TX_CAT_PICK_PREFIX, FM_TX_SUB_PICK_PREFIX } from '../../constants/financialTransactionCategoryPicker';

const mockExpenseCategories = [
  { codeValue: 'RENT', codeLabel: '임대료' },
  { codeValue: 'SALARY', codeLabel: '급여' },
  { codeValue: 'UTILITY', codeLabel: '관리비' },
  { codeValue: 'TAX', codeLabel: '세금' },
  { codeValue: 'MEAL', codeLabel: '식대' },
  { codeValue: 'OTHER', codeLabel: '기타잡비' },
  { codeValue: 'MARKETING', codeLabel: '마케팅' },
  { codeValue: 'OFFICE_SUPPLIES', codeLabel: '사무용품' }
];

const mockExpenseSubcategories = [
  { codeValue: 'OFFICE_RENT', codeLabel: '사무실임대료', parentCodeValue: 'RENT' },
  { codeValue: 'OTHER_EXPENSE', codeLabel: '기타', parentCodeValue: 'OTHER' }
];

const mockIncomeCategories = [
  { codeValue: '상담료', codeLabel: '상담료' },
  { codeValue: 'OTHER', codeLabel: '기타수입' },
  { codeValue: 'PACKAGE', codeLabel: '패키지' }
];

describe('financialTransactionCategoryPicker', () => {
  it('buildFixedCategoryOptions — 지출 고정 6칩, 기타잡비 라벨은 기타', () => {
    const options = buildFixedCategoryOptions('EXPENSE', mockExpenseCategories);
    expect(options.map((o) => o.value)).toEqual([
      'RENT', 'SALARY', 'UTILITY', 'TAX', 'MEAL', 'OTHER'
    ]);
    expect(options.find((o) => o.value === 'OTHER')?.label).toBe('기타');
    expect(options.some((o) => o.value === 'MARKETING')).toBe(false);
  });

  it('buildFixedCategoryOptions — 수입 고정 2칩 (SSOT 상담료)', () => {
    const options = buildFixedCategoryOptions('INCOME', mockIncomeCategories);
    expect(options.map((o) => o.value)).toEqual(['상담료', 'OTHER']);
    expect(options.find((o) => o.value === 'OTHER')?.label).toBe('기타');
  });

  it('임대료 선택 시 세부 사무실임대료만 노출', () => {
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

  it('식대는 세부 행 숨김 (옵션 없음)', () => {
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'MEAL',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options).toEqual([]);
  });

  it('기타 선택 시 demoted 카테고리 + OTHER 세부 노출', () => {
    const options = buildSubcategoryPickerOptions(
      'EXPENSE',
      'OTHER',
      mockExpenseCategories,
      mockExpenseSubcategories
    );
    expect(options.some((o) => o.value === `${FM_TX_CAT_PICK_PREFIX}MARKETING`)).toBe(true);
    expect(options.some((o) => o.value === `${FM_TX_CAT_PICK_PREFIX}OFFICE_SUPPLIES`)).toBe(true);
    expect(options.some((o) => o.value === `${FM_TX_SUB_PICK_PREFIX}OTHER_EXPENSE`)).toBe(true);
  });

  it('demoted 카테고리는 기타 그룹 highlight', () => {
    expect(isOtherGroupCategory('EXPENSE', 'MARKETING')).toBe(true);
    expect(resolvePrimaryCategoryHighlight('EXPENSE', 'MARKETING')).toBe('OTHER');
    expect(resolveSubcategoryPickerValue('EXPENSE', 'MARKETING', '')).toBe(
      `${FM_TX_CAT_PICK_PREFIX}MARKETING`
    );
  });

  it('parseSubcategoryPickerValue — demoted vs native sub', () => {
    expect(parseSubcategoryPickerValue(`${FM_TX_CAT_PICK_PREFIX}MARKETING`, 'OTHER')).toEqual({
      category: 'MARKETING',
      subcategory: ''
    });
    expect(parseSubcategoryPickerValue(`${FM_TX_SUB_PICK_PREFIX}OFFICE_RENT`, 'RENT')).toEqual({
      category: 'RENT',
      subcategory: 'OFFICE_RENT'
    });
  });
});
