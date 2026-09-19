/**
 * clientShopCheckoutMapping 유틸 단위 테스트
 */

import {
  findUniquePreselectedMapping,
  resolveInitialMappingId,
  shouldShowConsultantMappingPicker
} from '../clientShopCheckoutMapping';

describe('clientShopCheckoutMapping', () => {
  test('resolveInitialMappingId — 단일 매핑', () => {
    expect(resolveInitialMappingId([{ mappingId: 7, consultantDisplayName: 'A' }])).toBe('7');
  });

  test('resolveInitialMappingId — unique preselected among many', () => {
    const mappings = [
      { mappingId: 1, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantDisplayName: 'B', preselected: false }
    ];
    expect(resolveInitialMappingId(mappings)).toBe('1');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
    expect(findUniquePreselectedMapping(mappings)?.mappingId).toBe(1);
  });

  test('shouldShowConsultantMappingPicker — two without unique preselected', () => {
    const mappings = [
      { mappingId: 1, consultantDisplayName: 'A', preselected: false },
      { mappingId: 2, consultantDisplayName: 'B', preselected: false }
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
  });

  test('shouldShowConsultantMappingPicker — two preselected true → show picker', () => {
    const mappings = [
      { mappingId: 1, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantDisplayName: 'B', preselected: true }
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
