/**
 * 배정 매핑 상태 헬퍼 — PENDING_PAYMENT 게이트
 *
 * @author MindGarden
 * @since 2026-09-16
 */

import {
  MAPPING_STATUS,
  isAssignedMappingStatus,
  resolveMappingConsultantDisplayName,
  selectPrimaryAssignedMapping
} from '../mapping';

describe('mapping assigned status helpers', () => {
  test('isAssignedMappingStatus — ACTIVE / PENDING_PAYMENT / PAYMENT_CONFIRMED', () => {
    expect(isAssignedMappingStatus(MAPPING_STATUS.ACTIVE)).toBe(true);
    expect(isAssignedMappingStatus(MAPPING_STATUS.PENDING_PAYMENT)).toBe(true);
    expect(isAssignedMappingStatus(MAPPING_STATUS.PAYMENT_CONFIRMED)).toBe(true);
    expect(isAssignedMappingStatus(MAPPING_STATUS.TERMINATED)).toBe(false);
    expect(isAssignedMappingStatus(MAPPING_STATUS.CANCELLED)).toBe(false);
    expect(isAssignedMappingStatus(MAPPING_STATUS.INACTIVE)).toBe(false);
    expect(isAssignedMappingStatus(null)).toBe(false);
    expect(isAssignedMappingStatus(undefined)).toBe(false);
  });

  test('selectPrimaryAssignedMapping — PENDING_PAYMENT 선택, ACTIVE 우선', () => {
    const pending = {
      id: 272,
      status: MAPPING_STATUS.PENDING_PAYMENT,
      consultantName: '김상담'
    };
    const terminated = {
      id: 1,
      status: MAPPING_STATUS.TERMINATED,
      consultantName: '종료상담'
    };
    const active = {
      id: 3,
      status: MAPPING_STATUS.ACTIVE,
      consultantName: '활성상담'
    };

    expect(selectPrimaryAssignedMapping([terminated, pending])).toEqual(pending);
    expect(selectPrimaryAssignedMapping([pending, active])).toEqual(active);
    expect(selectPrimaryAssignedMapping([terminated])).toBeNull();
    expect(selectPrimaryAssignedMapping([])).toBeNull();
    expect(selectPrimaryAssignedMapping(null)).toBeNull();
  });

  test('resolveMappingConsultantDisplayName — consultantName || consultant.consultantName', () => {
    expect(resolveMappingConsultantDisplayName({
      consultantName: '직접이름'
    })).toBe('직접이름');
    expect(resolveMappingConsultantDisplayName({
      consultant: { consultantName: '중첩이름' }
    })).toBe('중첩이름');
    expect(resolveMappingConsultantDisplayName({
      consultant: { name: '폴백이름' }
    })).toBe('폴백이름');
    expect(resolveMappingConsultantDisplayName({})).toBe('');
    expect(resolveMappingConsultantDisplayName(null)).toBe('');
  });
});
