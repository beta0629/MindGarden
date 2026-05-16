import { resolveTenantIdFromSources } from '@/utils/resolveTenantIdFromSources';

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
