import {
  logAdminApiReadyGate,
  resetAdminSessionDiagThrottle,
  type AdminApiReadyGateSnapshot,
} from '../adminSessionDiag';

const notReadySnapshot = (): AdminApiReadyGateSnapshot => ({
  ready: false,
  authHasHydrated: true,
  authIsLoading: false,
  tenantHasHydrated: true,
  accessTokenPresent: false,
  effectiveTenantId: 'tenant-abcd-xyz',
  requireAccessToken: true,
  requireUserId: false,
});

describe('adminSessionDiag', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    warnSpy.mockClear();
    resetAdminSessionDiagThrottle();
    delete process.env.EXPO_PUBLIC_ADMIN_SESSION_DIAG;
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('logs once when ready is false without verbose env', () => {
    logAdminApiReadyGate(notReadySnapshot());
    logAdminApiReadyGate(notReadySnapshot());
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(warnSpy.mock.calls[0]?.[1]));
    expect(payload.accessToken).toBe('missing');
    expect(payload.effectiveTenantId).toEqual({ len: 15, prefix: 'tena…' });
  });

  it('skips log when ready is true', () => {
    logAdminApiReadyGate({ ...notReadySnapshot(), ready: true });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs repeatedly when EXPO_PUBLIC_ADMIN_SESSION_DIAG=1', () => {
    process.env.EXPO_PUBLIC_ADMIN_SESSION_DIAG = '1';
    logAdminApiReadyGate(notReadySnapshot());
    logAdminApiReadyGate(notReadySnapshot());
    expect(warnSpy).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(String(warnSpy.mock.calls[0]?.[1]));
    expect(payload).toHaveProperty('isAuthenticated');
  });
});
