import { isTenantHydrationGateOk } from '@/utils/tenantHydrationGate';

describe('isTenantHydrationGateOk', () => {
  it('allows API ready when JWT effective tenant exists before MMKV hydrate', () => {
    expect(isTenantHydrationGateOk(false, 'tenant-uuid-from-jwt')).toBe(true);
  });

  it('blocks when hydrate incomplete and no effective tenant', () => {
    expect(isTenantHydrationGateOk(false, '')).toBe(false);
    expect(isTenantHydrationGateOk(false, '   ')).toBe(false);
  });

  it('passes when tenant store has hydrated', () => {
    expect(isTenantHydrationGateOk(true, '')).toBe(true);
  });
});
