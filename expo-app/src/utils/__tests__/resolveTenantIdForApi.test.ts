import { resolveEffectiveUserTenantId } from '@/utils/resolveEffectiveUserTenantId';
import { resolveTenantIdFromSources } from '@/utils/resolveTenantIdFromSources';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('resolveEffectiveUserTenantId', () => {
  it('prefers JWT tenant over stale user.tenantId when accessToken is present', () => {
    const token = fakeJwt({ tenantId: 'tenant-from-jwt' });
    expect(resolveEffectiveUserTenantId('stale-tenant-mmkv', token)).toBe('tenant-from-jwt');
  });

  it('falls back to user tenant when JWT has no tenantId', () => {
    const token = fakeJwt({ sub: '1' });
    expect(resolveEffectiveUserTenantId('tenant-from-user', token)).toBe('tenant-from-user');
  });

  it('uses user tenant when accessToken is absent', () => {
    expect(resolveEffectiveUserTenantId('tenant-from-user', null)).toBe('tenant-from-user');
    expect(resolveEffectiveUserTenantId('tenant-from-user', '')).toBe('tenant-from-user');
  });
});

describe('resolveTenantIdFromSources', () => {
  const recentTenants = [
    { code: 'gangnam', id: 'tenant-uuid-gangnam', name: '강남' },
    { code: 'seocho', id: 'tenant-uuid-seocho', name: '서초' },
  ];

  it('prefers userTenantId over headerTenantId', () => {
    expect(
      resolveTenantIdFromSources({
        userTenantId: 'from-user',
        headerTenantId: 'from-header',
        tenantCode: null,
        recentTenants,
      }),
    ).toBe('from-user');
  });

  it('falls back to header when user is empty', () => {
    expect(
      resolveTenantIdFromSources({
        userTenantId: '',
        headerTenantId: 'from-header',
        tenantCode: null,
        recentTenants,
      }),
    ).toBe('from-header');
  });

  it('resolves from recentTenants + tenantCode', () => {
    expect(
      resolveTenantIdFromSources({
        userTenantId: '',
        headerTenantId: '',
        tenantCode: 'gangnam',
        recentTenants,
      }),
    ).toBe('tenant-uuid-gangnam');
  });

  it('returns empty when nothing matches', () => {
    expect(
      resolveTenantIdFromSources({
        userTenantId: '',
        headerTenantId: '',
        tenantCode: 'unknown',
        recentTenants,
      }),
    ).toBe('');
  });
});
