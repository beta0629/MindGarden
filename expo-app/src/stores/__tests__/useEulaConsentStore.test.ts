/**
 * Apple G1.2 UGC (P2-C) — EULA 동의 캐시 스토어 회귀 테스트.
 *
 * <p>{@code shouldShowEulaGateFromCache} 의 5가지 케이스:
 * 미인증/캐시 없음/구버전 캐시/일치 캐시/userId null.</p>
 */

jest.mock('@/lib/getMmkv', () => ({
  createZustandMmkvPersistStorage: () => ({
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  }),
}));

import {
  shouldShowEulaGateFromCache,
  useEulaConsentStore,
} from '../useEulaConsentStore';

describe('useEulaConsentStore — P2-C 캐시 게이트', () => {
  beforeEach(() => {
    useEulaConsentStore.getState().reset();
  });

  test('userId 가 null 이면 게이트 비표시', () => {
    expect(shouldShowEulaGateFromCache(null, '1.0.0')).toBe(false);
    expect(shouldShowEulaGateFromCache(undefined, '1.0.0')).toBe(false);
  });

  test('캐시에 기록이 없으면 게이트 표시', () => {
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(true);
  });

  test('캐시 acceptedVersion 이 현재와 일치하면 게이트 비표시', () => {
    useEulaConsentStore.getState().setRecord(100, {
      acceptedVersion: '1.0.0',
      acceptedAt: '2026-06-11T00:00:00',
    });
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(false);
  });

  test('캐시 acceptedVersion 이 구버전이면 게이트 표시', () => {
    useEulaConsentStore.getState().setRecord(100, {
      acceptedVersion: '0.9.0',
      acceptedAt: '2025-12-01T00:00:00',
    });
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(true);
  });

  test('clearRecord 후에는 다시 게이트 표시', () => {
    useEulaConsentStore.getState().setRecord(100, {
      acceptedVersion: '1.0.0',
      acceptedAt: '2026-06-11T00:00:00',
    });
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(false);
    useEulaConsentStore.getState().clearRecord(100);
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(true);
  });

  test('userId 별로 캐시가 격리됨', () => {
    useEulaConsentStore.getState().setRecord(100, {
      acceptedVersion: '1.0.0',
      acceptedAt: '2026-06-11T00:00:00',
    });
    expect(shouldShowEulaGateFromCache(100, '1.0.0')).toBe(false);
    expect(shouldShowEulaGateFromCache(200, '1.0.0')).toBe(true);
  });
});
