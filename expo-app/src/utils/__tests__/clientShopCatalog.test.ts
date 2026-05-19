import { normalizeCatalogSku, normalizeShopCatalogList } from '@/utils/clientShopCatalog';

jest.mock('@/config/apiBaseUrl', () => ({
  getApiBaseUrl: () => 'https://dev.core-solution.co.kr',
}));

describe('normalizeCatalogSku', () => {
  it('maps thumbnailUrl and resolves relative file paths', () => {
    const row = normalizeCatalogSku({
      skuCode: 'SKU-001',
      title: '테스트 상품',
      unitPriceMinor: 10000,
      currency: 'KRW',
      catalogCategory: 'consultation',
      thumbnailUrl: '/api/v1/files/shop-catalog/tenant-a/thumb.png',
    });

    expect(row).toMatchObject({
      skuCode: 'SKU-001',
      title: '테스트 상품',
      catalogCategory: 'CONSULTATION',
      thumbnailUrl:
        'https://dev.core-solution.co.kr/api/v1/files/shop-catalog/tenant-a/thumb.png',
    });
  });

  it('falls back to heroImageUrl when thumbnailUrl is absent', () => {
    const row = normalizeCatalogSku({
      skuCode: 'SKU-002',
      title: '레거시',
      unitPriceMinor: 0,
      currency: 'KRW',
      catalogCategory: 'ASSESSMENT',
      heroImageUrl: 'https://cdn.example.com/hero.jpg',
    });

    expect(row?.thumbnailUrl).toBe('https://cdn.example.com/hero.jpg');
    expect(row?.catalogCategory).toBe('ASSESSMENT');
  });

  it('sets thumbnailUrl to null when no image fields', () => {
    const row = normalizeCatalogSku({
      skuCode: 'SKU-003',
      title: '이미지 없음',
      unitPriceMinor: 500,
      currency: 'KRW',
      catalogCategory: 'CONSULTATION',
    });

    expect(row?.thumbnailUrl).toBeNull();
  });

  it('returns null for invalid rows', () => {
    expect(normalizeCatalogSku(null)).toBeNull();
    expect(normalizeCatalogSku({ title: 'no code' })).toBeNull();
  });
});

describe('normalizeShopCatalogList', () => {
  it('normalizes only valid catalog rows', () => {
    const list = normalizeShopCatalogList([
      {
        skuCode: 'A',
        title: 'A',
        unitPriceMinor: 1,
        currency: 'KRW',
        catalogCategory: 'CONSULTATION',
        thumbnailUrl: '/api/v1/files/shop-catalog/a.png',
      },
      { title: 'broken' },
    ]);

    expect(list).toHaveLength(1);
    expect(list[0]?.skuCode).toBe('A');
    expect(list[0]?.thumbnailUrl).toContain('/api/v1/files/shop-catalog/a.png');
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeShopCatalogList(undefined)).toEqual([]);
    expect(normalizeShopCatalogList({})).toEqual([]);
  });
});
