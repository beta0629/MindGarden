import {
  SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH,
  generateShopCatalogPlaceholderDataUri,
  isShopCatalogPlaceholderUrl,
  resolveShopCatalogDisplayImageUrl,
  splitShopCatalogPlaceholderTitleLines
} from '../shopCatalogThumbnail';
import { SHOP_CATALOG_CATEGORY } from '../../constants/clientShopConstants';

describe('shopCatalogThumbnail', () => {
  test('SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH matches seed path', () => {
    expect(SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH).toBe(
      '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png'
    );
  });

  test('isShopCatalogPlaceholderUrl detects seed and suffix', () => {
    expect(isShopCatalogPlaceholderUrl(SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH)).toBe(true);
    expect(
      isShopCatalogPlaceholderUrl(
        'https://api.example.com/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png'
      )
    ).toBe(true);
    expect(isShopCatalogPlaceholderUrl('/api/v1/files/shop-catalog-thumbnails/real.png')).toBe(
      false
    );
    expect(isShopCatalogPlaceholderUrl('')).toBe(false);
  });

  test('generateShopCatalogPlaceholderDataUri returns svg data uri with title and category', () => {
    const uri = generateShopCatalogPlaceholderDataUri({
      title: '테스트 상품',
      catalogCategory: SHOP_CATALOG_CATEGORY.ASSESSMENT
    });
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    const decoded = decodeURIComponent(uri.replace('data:image/svg+xml;charset=utf-8,', ''));
    expect(decoded).toContain('테스트 상품');
    expect(decoded).toContain('심리 검사');
    expect(decoded).toContain('viewBox="0 0 400 400"');
  });

  test('splitShopCatalogPlaceholderTitleLines wraps to at most two lines', () => {
    const lines = splitShopCatalogPlaceholderTitleLines(
      '아주 긴 상품명을 두 줄로 나누어 표시하는 테스트 케이스입니다'
    );
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines[0].length).toBeLessThanOrEqual(16);
  });

  test('resolveShopCatalogDisplayImageUrl prefers real thumbnail over placeholder', () => {
    const real = '/api/v1/files/shop-catalog-thumbnails/tenant-a.png';
    expect(
      resolveShopCatalogDisplayImageUrl({
        thumbnailUrl: real,
        title: 'A',
        catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION
      })
    ).toBe(real);
  });

  test('resolveShopCatalogDisplayImageUrl generates svg when only seed placeholder', () => {
    const url = resolveShopCatalogDisplayImageUrl({
      thumbnailUrl: SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH,
      title: '상담 패키지 A',
      catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION
    });
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(url).toContain(encodeURIComponent('상담 패키지 A'));
  });

  test('resolveShopCatalogDisplayImageUrl falls back to heroImageUrl', () => {
    const hero = 'https://cdn.example.com/hero.jpg';
    expect(
      resolveShopCatalogDisplayImageUrl({
        heroImageUrl: hero,
        title: 'B'
      })
    ).toBe(hero);
  });
});
