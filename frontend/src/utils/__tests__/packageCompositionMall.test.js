import {
  addMallCompositionItem,
  buildCompositionSaveBody,
  computeMallComposition,
  isMallCompositionChanged,
  mapSavedCompositionItem,
  recalcMallCompositionPrices,
  setMallCompositionQuantity
} from '../packageComposition';
import { applyAdminShopProductComposition } from '../adminShopSuite';
import compositionKo from '../../locales/ko/adminShopComposition.json';
import editorKo from '../../locales/ko/adminShopProductEditor.json';
import { ADMIN_SHOP_PRODUCT_EDITOR_COPY } from '../../constants/adminShopSuite';

const A = { skuId: 1, label: 'A', unitPrice: 320000, sessions: 4, quantity: 1 };
const B = { skuId: 2, label: 'B', unitPrice: 12000, sessions: 0, quantity: 2 };

describe('몰 SKU 구성 계산', () => {
  test('합계 = Σ 몰 판매가 × 수량, 회기 = Σ 회기 × 수량, 할인은 원 단위 버림', () => {
    expect(computeMallComposition([A, B], 10)).toEqual({
      subtotal: 344000, sessions: 4, discountAmount: 34400, finalPrice: 309600
    });
    expect(computeMallComposition([{ ...A, quantity: 3 }], 0)).toMatchObject({ subtotal: 960000, sessions: 12 });
    expect(computeMallComposition([{ skuId: 3, unitPrice: 999, sessions: 0, quantity: 1 }], 33).finalPrice).toBe(669);
  });

  test('extraData.price 단순 합산이 아니다(수량 반영)', () => {
    const form = applyAdminShopProductComposition({ discountRate: 0 }, [A, B]);
    expect(form.price).toBe('344000');
    expect(form.originalPrice).toBe(344000);
    expect(form.sessions).toBe('4');
  });

  test('담기는 같은 SKU 를 두 번 넣지 않고, 수량은 1 이상', () => {
    const once = addMallCompositionItem([], { skuId: 1, label: 'A', unitPrice: 10, sessions: 1 });
    expect(addMallCompositionItem(once, { skuId: 1 })).toHaveLength(1);
    expect(once[0].quantity).toBe(1);
    expect(setMallCompositionQuantity(once, 1, 0)[0].quantity).toBe(1);
    expect(setMallCompositionQuantity(once, 1, 5)[0].quantity).toBe(5);
  });

  test('저장 응답 → 스냅샷 단가, 다시 계산 → 현재 몰 판매가', () => {
    const item = mapSavedCompositionItem({
      skuId: 1, title: 'A', quantity: 2, unitPriceSnapshot: 100, sessionCountSnapshot: 1,
      currentUnitPrice: 120, priceChanged: true, available: true
    });
    expect(item).toMatchObject({ unitPrice: 100, quantity: 2, priceChanged: true });
    const [re] = recalcMallCompositionPrices([item]);
    expect(re).toMatchObject({ unitPrice: 120, priceChanged: false });
  });

  test('PUT 본문과 변경 감지', () => {
    expect(buildCompositionSaveBody([A, B])).toEqual({ items: [{ skuId: 1, quantity: 1 }, { skuId: 2, quantity: 2 }] });
    expect(isMallCompositionChanged([A], [A])).toBe(false);
    expect(isMallCompositionChanged([{ ...A, quantity: 2 }], [A])).toBe(true);
  });
});

describe('문구 (SPEC copy.json 대조)', () => {
  test('상품 구성 문구', () => {
    expect(compositionKo.subtotal).toBe('몰 판매가 합계');
    expect(compositionKo.final).toBe('최종 판매가');
    expect(compositionKo.emptyTitle).toBe('담은 상품이 없습니다');
    expect(compositionKo.countCaption).toBe('{{count}}개 담김');
    expect(compositionKo.priceChanged).toBe('가격 변경됨');
    expect(compositionKo.recalc).toBe('다시 계산');
    const all = JSON.stringify(compositionKo);
    ['상품 추가', '할인 후 판매가', '총 원가', '개 담음'].forEach((old) => expect(all).not.toContain(old));
  });

  test('편집 화면 문구 — 합니다체', () => {
    expect(editorKo.unsaved).toBe('저장하지 않은 변경 사항이 있습니다');
    expect(editorKo.sectionManage).toBe('상품 관리');
    expect(editorKo.noDeleteNote).toContain('상품은 삭제할 수 없습니다');
    expect(ADMIN_SHOP_PRODUCT_EDITOR_COPY.SESSIONS_HINT).toBe('결제되면 이 수만큼 회기가 부여됩니다');
    expect(ADMIN_SHOP_PRODUCT_EDITOR_COPY.SECTION_MALL_HINT).toBe('내담자 몰 상품 카드에 보입니다');
    Object.values(ADMIN_SHOP_PRODUCT_EDITOR_COPY).forEach((v) => expect(String(v)).not.toMatch(/(보여요|돼요|어요)$/));
  });
});
