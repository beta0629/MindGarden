import { resolveEffectiveTenantIdForApi } from '@/utils/resolveEffectiveTenantIdForApi';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

const recentTenants = [
  { code: 'gangnam', id: 'tenant-uuid-gangnam', name: '강남' },
] as const;

describe('resolveEffectiveTenantIdForApi', () => {
  it('prefers JWT tenant over empty store when storesResolved', () => {
    const token = fakeJwt({ tenantId: 'tenant-from-jwt' });
    expect(
      resolveEffectiveTenantIdForApi({
        storesResolved: true,
        accessToken: token,
        headerTenantId: '',
        userTenantId: 'stale-user-tenant',
        tenantCode: null,
        recentTenants,
      }),
    ).toBe('tenant-from-jwt');
  });

  it('returns JWT tenant before storesResolved (MMKV rehydrate race)', () => {
    const token = fakeJwt({ tenantId: 'tenant-from-jwt' });
    expect(
      resolveEffectiveTenantIdForApi({
        storesResolved: false,
        accessToken: token,
        headerTenantId: '',
        userTenantId: null,
        tenantCode: null,
        recentTenants: [],
      }),
    ).toBe('tenant-from-jwt');
  });

  it('falls back to header tenant when JWT has no tenantId and stores resolved', () => {
    const token = fakeJwt({ sub: '1' });
    expect(
      resolveEffectiveTenantIdForApi({
        storesResolved: true,
        accessToken: token,
        headerTenantId: 'from-header',
        userTenantId: '',
        tenantCode: null,
        recentTenants,
      }),
    ).toBe('from-header');
  });

  it('resolves from recentTenants when JWT and header are empty', () => {
    expect(
      resolveEffectiveTenantIdForApi({
        storesResolved: true,
        accessToken: null,
        headerTenantId: '',
        userTenantId: '',
        tenantCode: 'gangnam',
        recentTenants,
      }),
    ).toBe('tenant-uuid-gangnam');
  });
});
