/**
 * Shop 구매면 — §9 이용기간 문구 · 환불 안내 단일 상수 (소스 스모크)
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../../..');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('Shop purchase surfaces usage/refund SSOT', () => {
  const catalog = read('pages/client/shop/ShopCatalogPage.js');
  const detail = read('pages/client/shop/ShopSkuDetailPage.js');
  const checkout = read('pages/client/shop/ShopCheckoutPage.js');
  const checkoutLine = read('components/shop/organisms/MallCheckoutLine.js');
  const beforeBuy = read('components/shop/organisms/MallBeforeBuyCard.js');
  const mallConstants = read('constants/clientMallConstants.js');
  const legal = read('constants/legalPublic.js');
  const shopConstants = read('constants/clientShopConstants.js');

  test('§9 이용기간 문구는 글자 그대로 상수에 있다', () => {
    expect(mallConstants).toContain(
      "'이용기간 — 상품마다 정한 기간(예: 단회기는 결제일부터 2개월, 10회기는 3개월, 20회기는 6개월) 안에 사용해야 합니다. '"
    );
    expect(mallConstants).not.toContain('단회기·10회기 패키지는 결제일부터 3개월');
    expect(mallConstants).not.toContain('1년 내 소진');
    expect(mallConstants).toContain("'기한이 지나면 남은 회기는 만료되며, 센터 사정에 따라 연장될 수 있어요.'");
    expect(mallConstants).toContain('`이용기간 — 이 상품은 결제일부터 ${validityMonths}개월 안에 사용해야 합니다. `');
  });

  test('환불 안내는 CLIENT_REFUND_NOTICE 하나를 목록·상세·결제 전 확인이 공유한다', () => {
    expect(mallConstants).toContain(
      "export const CLIENT_REFUND_NOTICE = '환불 기준과 신청 방법은 센터 환불 규칙에 따라 안내해 드려요.';"
    );
    expect(beforeBuy).toMatch(/CLIENT_REFUND_NOTICE/);
    expect(catalog).toMatch(/MallBeforeBuyCard/);
    expect(detail).toMatch(/CLIENT_REFUND_NOTICE/);
    expect(checkout).toMatch(/CLIENT_REFUND_NOTICE/);
  });

  test('결제 전 확인 줄마다 그 상품 개월 수로 §9 안내를 렌더한다', () => {
    expect(checkout).toMatch(/MallCheckoutLine/);
    expect(checkoutLine).toMatch(/buildClientMallProductUsageNotice\(validityMonths\)/);
    expect(checkoutLine).toMatch(/buildValidityExampleText/);
  });

  test('자리표시·예시 라벨·목 태그를 노출하지 않는다', () => {
    [catalog, detail, checkout, checkoutLine, beforeBuy, mallConstants].forEach((src) => {
      expect(src).not.toContain('{환불 규칙}');
      expect(src).not.toContain('예시 상품');
      expect(src).not.toContain('가격 확인 필요');
      expect(src).not.toContain('₩');
    });
  });

  test('legalPublic 결제유형 상수는 할부 고지이고 clientShopConstants 가 재수출한다', () => {
    const paymentNote = '카드 결제이며, 5만 원 이상은 할부가 가능합니다. 정기결제·구독은 없습니다.';
    expect(legal).toContain(paymentNote);
    expect(legal).not.toMatch(/일시불만/);
    expect(legal).toContain('정기결제·구독은 없습니다');
    expect(mallConstants).toContain(paymentNote);
    expect(mallConstants).not.toMatch(/일시불/);
    expect(shopConstants).toMatch(
      /export\s*\{[\s\S]*CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE[\s\S]*\}\s*from\s*['"]\.\/legalPublic['"]/
    );
  });
});
