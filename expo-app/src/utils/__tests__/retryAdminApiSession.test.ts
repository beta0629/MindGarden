import { isAdminListQueryLoading } from '@/utils/isAdminListQueryLoading';

describe('isAdminListQueryLoading', () => {
  it('returns false when query disabled (!ready) even if isLoading is true', () => {
    expect(isAdminListQueryLoading(true, undefined)).toBe(true);
    expect(isAdminListQueryLoading(false, undefined)).toBe(false);
  });

  it('returns false when cached data exists', () => {
    expect(isAdminListQueryLoading(true, [])).toBe(false);
    expect(isAdminListQueryLoading(true, [{ id: 1 }])).toBe(false);
  });

  it('returns true only for in-flight initial fetch', () => {
    expect(isAdminListQueryLoading(true, undefined)).toBe(true);
    expect(isAdminListQueryLoading(false, undefined)).toBe(false);
  });
});
