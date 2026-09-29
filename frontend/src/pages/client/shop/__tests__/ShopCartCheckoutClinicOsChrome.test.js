/**
 * Clinic-OS cart/checkout chrome lock — shot-client-cart-tobe
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('Clinic-OS client cart/checkout chrome', () => {
  const css = read('src/styles/shop/ClientShop.css');
  const layout = read('src/components/shop/templates/ShopClientLayout.js');
  const cart = read('src/pages/client/shop/ShopCartPage.js');
  const checkout = read('src/pages/client/shop/ShopCheckoutPage.js');
  const ticket = read('src/components/shop/atoms/SessionCountTicket.js');
  const checkoutLine = read('src/components/shop/organisms/MallCheckoutLine.js');
  const payPanel = read('src/components/shop/organisms/MallPayPanel.js');

  test('layout uses clinic-os shell + design shot id', () => {
    expect(layout).toMatch(/client-shop--clinic-os/);
    expect(layout).toMatch(/clinic-os-client-cart/);
    expect(layout).toMatch(/client-shop__stage|ClientWebPageShell/);
    expect(layout).toMatch(/ClientWebPageShell/);
  });

  test('page shell has no centered max-width column on shop root', () => {
    expect(css).toMatch(/\.client-shop(?:\.client-web-page-shell)?\s*\{[\s\S]*?max-width:\s*none/);
    expect(css).not.toMatch(/max-width:\s*75rem/);
  });

  test('ink/slate tokens used', () => {
    expect(css).toMatch(/--cs-ink/);
    expect(css).toMatch(/--cs-slate-200|--cs-slate-300/);
    expect(css).toMatch(/--mg-v2-color-primary-solid/);
  });

  test('cart and checkout render the mall session chip (N회기)', () => {
    expect(cart).toMatch(/MallSessionChip/);
    expect(checkout).toMatch(/MallCheckoutLine/);
    expect(checkoutLine).toMatch(/MallSessionChip/);
    expect(read('src/components/shop/atoms/MallSessionChip.js')).toMatch(/formatMallSessionLabel/);
    expect(ticket).toMatch(/formatShopSessionCountDisplay/);
    expect(ticket).toMatch(/client-shop__session-ticket/);
  });

  test('cart: 「N개」는 목록 머리 오른쪽 캡션 · 이용기간 안내는 상품 목록 아래', () => {
    expect(cart).toMatch(/client-mall-box__caption[^>]*CART_PAGE_LIST_COUNT/);
    expect(cart.indexOf('<MallUsageBanner')).toBeGreaterThan(cart.indexOf('cart.lines.map((line) => {'));
  });

  test('cart: 「결제 금액」 카드 머리에도 「N개」 · 「빼기」는 수량 옆 · 좁은 화면 요약 카드는 하단 바 위', () => {
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(cart).toMatch(/client-mall-cart__head[\s\S]*CART_PAGE_SUMMARY_TITLE[\s\S]*CART_PAGE_ASIDE_COUNT/);
    expect(mallCss).toMatch(/\.client-mall-line--cart \.client-mall-line__controls\s*\{[^}]*justify-content:\s*flex-start/);
    expect(cart.indexOf('CART_PAGE_MOBILE_SUMMARY')).toBeGreaterThan(cart.indexOf('<MallUsageBanner'));
    expect(cart.indexOf('CART_PAGE_MOBILE_SUMMARY')).toBeLessThan(cart.indexOf('<MallCartBar'));
    expect(mallCss).toMatch(/\.client-mall-cart-sum\s*\{\s*display:\s*none/);
  });

  test('complete: 원형 체크 · 바로 구매 안내는 오른쪽 카드 아래 · 좁은 화면 전폭 primary + 텍스트 링크', () => {
    const complete = read('src/pages/client/shop/ShopPaymentCompletePage.js');
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(complete).toMatch(/client-mall-complete__icon-ring/);
    expect(complete).toMatch(/client-mall-complete-side[\s\S]*\{asideCard\}[\s\S]*\{cartKeptNote\}/);
    expect(complete).toMatch(/isNarrow \?[\s\S]*client-mall-link-btn/);
    expect(mallCss).toMatch(/\.client-mall-complete__actions > \.mg-button\s*\{\s*width:\s*100%/);
  });

  test('complete: 왼쪽 정렬 · 버튼 가로 배치 (fullWidth 없음) · 기존 primary 클래스 유지', () => {
    const complete = read('src/pages/client/shop/ShopPaymentCompletePage.js');
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(complete).not.toMatch(/fullWidth/);
    expect(complete).toMatch(/client-mall-btn--primary/);
    expect(mallCss).toMatch(/\.client-mall-complete__actions\s*\{[^}]*flex-direction:\s*row/);
    expect(mallCss).toMatch(/\.client-mall-complete__title\s*\{[^}]*text-align:\s*left/);
  });

  test('mobile verify sheet: 아래 붙는 시트 · 입력칸 폭을 버튼이 밀어내지 않음', () => {
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(mallCss).toMatch(/\.mg-modal-overlay\.client-mall-sheet\s*\{[^}]*align-items:\s*flex-end\s*!important/);
    expect(mallCss).toMatch(/\.client-mall-phone__row > \.mg-button\s*\{[^}]*width:\s*auto/);
  });

  test('cart(좁은 화면): 요약 카드는 목록과 이용기간 안내 사이 — 안내·여백만 뒤로 보냄', () => {
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(mallCss).toMatch(/\.client-mall--cart \.client-web-page-shell__main > \.client-mall-notice\s*\{\s*order:\s*1/);
    expect(mallCss).toMatch(/\.client-mall--cart \.client-web-page-shell__main > \.client-mall-bar-spacer\s*\{\s*order:\s*2/);
  });

  test('complete: 체크 원 56px · hair 토큰 테두리 · 좁은 화면은 카드 밖 하단 바에 primary → 도움말 → 링크', () => {
    const complete = read('src/pages/client/shop/ShopPaymentCompletePage.js');
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(mallCss).toMatch(/\.client-mall-complete__icon-ring\s*\{[^}]*width:\s*3\.5rem;[^}]*height:\s*3\.5rem;[^}]*border:\s*1px solid var\(--client-mall-hair\)/);
    expect(complete).toMatch(/<\/section>\s*\) : null\}\s*\{order && isNarrow \? \(\s*<div className="client-mall-complete-bar"/);
    expect(complete).toMatch(/client-mall-complete-bar[\s\S]*\{primaryAction\}\s*\{helpText\}\s*\{secondaryAction\}/);
    expect(mallCss).toMatch(/\.client-mall-complete-bar\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0/);
  });

  test('mobile verify sheet: 위 모서리 20px · 제목 18px/800 · 부제 13px mute · 테두리 없는 닫기 · 오류색은 cs-error-500 토큰', () => {
    const mallCss = read('src/styles/shop/ClientMall.css');
    expect(mallCss).toMatch(/\.mg-modal\.client-mall-sheet\s*\{[^}]*border-radius:\s*1\.25rem 1\.25rem 0 0/);
    expect(mallCss).toMatch(/\.client-mall-sheet \.mg-modal__title\s*\{\s*font-size:\s*var\(--cs-text-lg\);\s*font-weight:\s*var\(--font-weight-extrabold\)/);
    expect(mallCss).toMatch(/\.client-mall-sheet \.mg-modal__subtitle\s*\{\s*color:\s*var\(--client-web-mute\);\s*font-size:\s*0\.8125rem/);
    expect(mallCss).toMatch(/\.client-mall-sheet \.mg-modal__close\.mg-button\s*\{[^}]*border-color:\s*transparent;[^}]*background:\s*transparent/);
    expect(mallCss).toMatch(/\.client-mall-phone--sheet \.client-mall-phone__error\s*\{\s*color:\s*var\(--cs-error-500/);
  });

  test('checkout CTA uses MGButton primary', () => {
    expect(cart).toMatch(/MGButton/);
    expect(checkout).toMatch(/MallPayPanel/);
    expect(payPanel).toMatch(/MGButton/);
    expect(payPanel).toMatch(/variant="primary"/);
  });
});
