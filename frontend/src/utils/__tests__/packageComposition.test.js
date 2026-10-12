import {
  addCompositionItem,
  calculateComposition,
  clampDiscountRate,
  mapPackageCodesToCompositionOptions,
  mapShopProductsToCompositionOptions,
  removeCompositionItem,
  resolveCompositionPricingForSave
} from '../packageComposition';
import {
  applyAdminShopProductComposition,
  clearAdminShopProductComposition,
  emptyAdminShopProductForm
} from '../adminShopSuite';
import { buildExtraDataString, parseExtraData } from '../packagePricing';

const A = { value: 'A', label: '검사 A', sessions: 2, price: 100000 };
const B = { value: 'B', label: '상담 B', sessions: 8, price: 400000 };

describe('calculateComposition', () => {
  test('합산·할인(버림)', () => {
    expect(calculateComposition([A, B], 10)).toEqual({ sessions: 10, originalPrice: 500000, price: 450000 });
    expect(calculateComposition([{ sessions: 1, price: 99999 }], 15).price).toBe(84999);
  });
  test('빈 구성·잘못된 값은 0', () => {
    expect(calculateComposition([], 10)).toEqual({ sessions: 0, originalPrice: 0, price: 0 });
    expect(calculateComposition(undefined, 'x').price).toBe(0);
  });
  test('할인율 보정', () => {
    expect(clampDiscountRate(150)).toBe(100);
    expect(clampDiscountRate(-5)).toBe(0);
    expect(clampDiscountRate('abc')).toBe(0);
  });
});

describe('구성 추가·제거', () => {
  test('원본을 바꾸지 않는다', () => {
    const items = [A];
    expect(addCompositionItem(items, B)).toEqual([A, B]);
    expect(items).toEqual([A]);
    expect(removeCompositionItem([A, B], 0)).toEqual([B]);
  });
});

describe('옵션 매핑', () => {
  test('공통코드 행: 자기 자신 제외', () => {
    const rows = [
      { codeValue: 'A', koreanName: '검사 A', extraData: JSON.stringify({ sessions: 2, price: 100000 }) },
      { codeValue: 'SELF', koreanName: '나', extraData: '{}' }
    ];
    expect(mapPackageCodesToCompositionOptions(rows, 'SELF')).toEqual([A]);
  });
  test('몰 상품: 판매 중·구성 없는 상품만, 자기 자신 제외', () => {
    const mk = (code, extra, active = true) => ({
      code, name: code, sessions: 1, price: 10, active, codeRow: { extraData: JSON.stringify(extra) }
    });
    const list = [mk('X', {}), mk('Y', { items: [A] }), mk('Z', {}, false), mk('SELF', {})];
    expect(mapShopProductsToCompositionOptions(list, 'SELF').map((o) => o.value)).toEqual(['X']);
  });
});

describe('상품 폼 구성 적용·저장 바디', () => {
  test('구성 추가 → 회기·판매가 자동, 저장 extraData 에 items 포함', () => {
    let form = emptyAdminShopProductForm();
    form = applyAdminShopProductComposition(form, [A, B]);
    form = applyAdminShopProductComposition({ ...form, discountRate: 20 }, form.items);
    expect(form.sessions).toBe('10');
    expect(form.originalPrice).toBe(500000);
    expect(form.price).toBe('400000');
    const extra = parseExtraData(buildExtraDataString(10, 400000, '', form.items, form.discountRate, form.originalPrice, true));
    expect(extra.items).toEqual([A, B]);
    expect(extra.discountRate).toBe(20);
    expect(extra.originalPrice).toBe(500000);
  });
  test('구성을 모두 제거하면 회기·가격·할인율 초기화', () => {
    const form = clearAdminShopProductComposition(applyAdminShopProductComposition(emptyAdminShopProductForm(), [A]));
    expect(form).toMatchObject({ items: [], sessions: '', price: '', discountRate: 0, originalPrice: null });
  });
});

describe('resolveCompositionPricingForSave', () => {
  test('구성이 있으면 합산 원가·보정된 할인율', () => {
    expect(resolveCompositionPricingForSave({ items: [A], originalPrice: 100000, discountRate: 10 }, {}, 90000))
      .toEqual({ originalPrice: 100000, discountRate: 10 });
  });
  test('구성을 모두 비우면 원가=판매가, 할인율 0 (편집 전 75000 이 남지 않는다)', () => {
    const form = clearAdminShopProductComposition(applyAdminShopProductComposition(emptyAdminShopProductForm(), [A]));
    expect(resolveCompositionPricingForSave(form, { items: [A], originalPrice: 75000 }, 123000))
      .toEqual({ originalPrice: 123000, discountRate: 0 });
  });
  test('처음부터 구성이 없던 상품은 기존 값 보존', () => {
    expect(resolveCompositionPricingForSave({ items: [], discountRate: 0 }, { originalPrice: 150000 }, 120000))
      .toEqual({ originalPrice: 150000, discountRate: 0 });
    expect(resolveCompositionPricingForSave({ items: [], discountRate: 0 }, {}, 120000).originalPrice).toBe(120000);
  });
});
