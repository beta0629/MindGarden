/**
 * dashboardVizTargetStorage — 목표 건수 localStorage 유틸 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import {
  DASHBOARD_VIZ_TARGET_COMPLETED,
  DASHBOARD_VIZ_TARGET_MAX_COMPLETED,
  DASHBOARD_VIZ_TARGET_MODES
} from '../../../../constants/charts';
import {
  buildVizTargetStorageKey,
  calcQuickAddTarget,
  calcRatioTargetCompleted,
  canPersistVizTarget,
  parseVizTargetCustomInput,
  readVizTargetPreference,
  resolveVizTargetCompleted,
  writeVizTargetPreference
} from '../dashboardVizTargetStorage';

describe('dashboardVizTargetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('buildVizTargetStorageKey는 tenant·user가 있을 때만 키를 만든다', () => {
    expect(buildVizTargetStorageKey({ tenantId: 't1', userId: 'u1' })).toBe(
      'mg.dashboard.vizTarget.v1:t1:u1'
    );
    expect(buildVizTargetStorageKey({ tenantId: 't1', userId: null })).toBeNull();
    expect(buildVizTargetStorageKey({})).toBeNull();
    expect(canPersistVizTarget({ tenantId: 't1', userId: 'u1' })).toBe(true);
    expect(canPersistVizTarget({ tenantId: null, userId: 'u1' })).toBe(false);
  });

  test('write/read는 JSON preference를 왕복하고 tenant 없으면 no-op', () => {
    const scope = { tenantId: 'tenant-a', userId: '42' };
    expect(
      writeVizTargetPreference(scope, {
        mode: DASHBOARD_VIZ_TARGET_MODES.PRESET,
        targetCompleted: 150,
        updatedAt: '2026-07-28T00:00:00.000Z'
      })
    ).toBe(true);

    expect(readVizTargetPreference(scope)).toEqual({
      mode: DASHBOARD_VIZ_TARGET_MODES.PRESET,
      targetCompleted: 150,
      updatedAt: '2026-07-28T00:00:00.000Z'
    });
    expect(resolveVizTargetCompleted(scope)).toBe(150);

    expect(
      writeVizTargetPreference({ tenantId: null, userId: '42' }, {
        mode: DASHBOARD_VIZ_TARGET_MODES.CUSTOM,
        targetCompleted: 80
      })
    ).toBe(false);
    expect(resolveVizTargetCompleted({ tenantId: null, userId: '42' })).toBe(
      DASHBOARD_VIZ_TARGET_COMPLETED
    );
  });

  test('잘못된 저장값은 null/폴백 처리한다', () => {
    const scope = { tenantId: 't1', userId: 'u1' };
    const key = buildVizTargetStorageKey(scope);
    localStorage.setItem(key, '{not-json');
    expect(readVizTargetPreference(scope)).toBeNull();
    expect(resolveVizTargetCompleted(scope)).toBe(DASHBOARD_VIZ_TARGET_COMPLETED);

    localStorage.setItem(key, JSON.stringify({
      mode: 'unknown',
      targetCompleted: 50,
      updatedAt: '2026-07-28T00:00:00.000Z'
    }));
    expect(readVizTargetPreference(scope)).toBeNull();
  });

  test('calcQuickAddTarget은 현재 입력값 기준 반올림한다', () => {
    expect(calcQuickAddTarget(100, 1.1)).toBe(110);
    expect(calcQuickAddTarget(100, 1.2)).toBe(120);
    expect(calcQuickAddTarget(10, 1.1)).toBe(11);
    expect(calcQuickAddTarget(0, 1.1)).toBeNull();
    expect(calcQuickAddTarget(null, 1.1)).toBeNull();
    expect(calcRatioTargetCompleted(10, 1.2)).toBe(12);
  });

  test('parseVizTargetCustomInput은 1~99999 양의 정수만 허용한다', () => {
    expect(parseVizTargetCustomInput('1')).toBe(1);
    expect(parseVizTargetCustomInput('200')).toBe(200);
    expect(parseVizTargetCustomInput(String(DASHBOARD_VIZ_TARGET_MAX_COMPLETED))).toBe(
      DASHBOARD_VIZ_TARGET_MAX_COMPLETED
    );
    expect(parseVizTargetCustomInput('0')).toBeNull();
    expect(parseVizTargetCustomInput('-3')).toBeNull();
    expect(parseVizTargetCustomInput('1.5')).toBeNull();
    expect(parseVizTargetCustomInput('abc')).toBeNull();
    expect(parseVizTargetCustomInput('')).toBeNull();
    expect(parseVizTargetCustomInput(String(DASHBOARD_VIZ_TARGET_MAX_COMPLETED + 1))).toBeNull();
  });
});
