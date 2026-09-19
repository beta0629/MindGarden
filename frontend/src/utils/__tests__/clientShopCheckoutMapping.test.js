/**
 * clientShopCheckoutMapping 유틸 단위 테스트
 */

import {
  buildConsultantPickerOptions,
  countDistinctConsultants,
  findUniquePreselectedMapping,
  resolveInitialMappingId,
  shouldShowConsultantMappingPicker
} from '../clientShopCheckoutMapping';

describe('clientShopCheckoutMapping', () => {
  test('resolveInitialMappingId — 단일 매핑', () => {
    expect(resolveInitialMappingId([{ mappingId: 7, consultantId: 1, consultantDisplayName: 'A' }])).toBe('7');
  });

  test('resolveInitialMappingId — distinct 상담사 2명이면 초기값 비움', () => {
    const mappings = [
      { mappingId: 1, consultantId: 10, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantId: 20, consultantDisplayName: 'B', preselected: false }
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
    expect(findUniquePreselectedMapping(mappings)?.mappingId).toBe(1);
  });

  test('동일 상담사 2패키지 — 피커 숨김·대표 mappingId', () => {
    const mappings = [
      { mappingId: 1, consultantId: 5, consultantDisplayName: '김상담', label: '무료1회', preselected: true },
      { mappingId: 2, consultantId: 5, consultantDisplayName: '김상담', label: 'E2E-1125', preselected: false }
    ];
    expect(countDistinctConsultants(mappings)).toBe(1);
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
    expect(resolveInitialMappingId(mappings)).toBe('1');
    expect(buildConsultantPickerOptions(mappings)).toEqual([
      { value: '1', label: '김상담' }
    ]);
  });

  test('장바구니 제목과 패키지 라벨 일치 시 해당 mappingId', () => {
    const mappings = [
      { mappingId: 1, consultantId: 5, consultantDisplayName: '김상담', label: '무료1회' },
      { mappingId: 2, consultantId: 5, consultantDisplayName: '김상담', label: 'E2E-1125' }
    ];
    expect(resolveInitialMappingId(mappings, ['E2E-1125'])).toBe('2');
    expect(buildConsultantPickerOptions(mappings, ['E2E-1125'])[0].value).toBe('2');
  });

  test('shouldShowConsultantMappingPicker — two distinct consultants', () => {
    const mappings = [
      { mappingId: 1, consultantId: 10, consultantDisplayName: 'A', preselected: false },
      { mappingId: 2, consultantId: 20, consultantDisplayName: 'B', preselected: false }
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
    expect(buildConsultantPickerOptions(mappings).map((o) => o.label)).toEqual(['A', 'B']);
  });

  test('shouldShowConsultantMappingPicker — two preselected true → show picker', () => {
    const mappings = [
      { mappingId: 1, consultantId: 10, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantId: 20, consultantDisplayName: 'B', preselected: true }
    ];
    expect(findUniquePreselectedMapping(mappings)).toBeNull();
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
    expect(resolveInitialMappingId(mappings)).toBe('');
  });

  test('shouldShowConsultantMappingPicker — length 0/1 hide', () => {
    expect(shouldShowConsultantMappingPicker([])).toBe(false);
    expect(shouldShowConsultantMappingPicker([{ mappingId: 1, consultantDisplayName: 'A' }])).toBe(false);
  });
});
