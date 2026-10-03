/**
 * hasFreshSessionTenant / getTenantId — 강제 세션 확인 재사용 창.
 * 요청마다 current-user·session-info 를 직렬로 다시 부르던 지연(메뉴 이동 「불러오는 중」 고착) 회귀 방지.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { getTenantId, hasFreshSessionTenant } from '../apiHeaders';
import { API_HEADER_SESSION_FRESH_MS } from '../../constants/session';

const NOW = 1_800_000_000_000;

const buildManager = ({ user = { id: 1, tenantId: 'tenant-a' }, verifiedAt = NOW } = {}) => ({
  getUser: jest.fn(() => user),
  getLastVerifiedAt: jest.fn(() => verifiedAt),
  checkSession: jest.fn().mockResolvedValue(true)
});

describe('hasFreshSessionTenant', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('재사용 창 안 + tenantId 있음 → true', () => {
    expect(hasFreshSessionTenant(buildManager({ verifiedAt: NOW - 1000 }))).toBe(true);
  });

  test('재사용 창 경계(=창 길이) → false', () => {
    expect(hasFreshSessionTenant(buildManager({ verifiedAt: NOW - API_HEADER_SESSION_FRESH_MS }))).toBe(false);
  });

  test('성공 확인 이력 없음(0) → false', () => {
    expect(hasFreshSessionTenant(buildManager({ verifiedAt: 0 }))).toBe(false);
  });

  test('tenantId 없음 · 사용자 없음 → false', () => {
    expect(hasFreshSessionTenant(buildManager({ user: { id: 1 } }))).toBe(false);
    expect(hasFreshSessionTenant(buildManager({ user: null }))).toBe(false);
  });

  test('getLastVerifiedAt 없는 매니저(구버전) → false', () => {
    expect(hasFreshSessionTenant({ getUser: () => ({ tenantId: 't' }) })).toBe(false);
    expect(hasFreshSessionTenant(null)).toBe(false);
  });
});

describe('getTenantId(forceRefresh)', () => {
  const originalManager = window.sessionManager;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    window.sessionManager = originalManager;
    jest.restoreAllMocks();
  });

  test('직전 성공 확인이 창 안이면 checkSession 을 다시 부르지 않는다', async() => {
    const manager = buildManager({ verifiedAt: NOW - 500 });
    window.sessionManager = manager;
    await expect(getTenantId(true)).resolves.toBe('tenant-a');
    expect(manager.checkSession).not.toHaveBeenCalled();
  });

  test('창이 지났으면 강제 확인 1회', async() => {
    const manager = buildManager({ verifiedAt: NOW - API_HEADER_SESSION_FRESH_MS - 1 });
    window.sessionManager = manager;
    await getTenantId(true);
    expect(manager.checkSession).toHaveBeenCalledTimes(1);
    expect(manager.checkSession).toHaveBeenCalledWith(true);
  });

  test('forceRefresh=false 는 확인하지 않는다', async() => {
    const manager = buildManager({ verifiedAt: 0 });
    window.sessionManager = manager;
    await getTenantId(false);
    expect(manager.checkSession).not.toHaveBeenCalled();
  });
});
