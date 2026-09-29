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

  test('checkout CTA uses MGButton primary', () => {
    expect(cart).toMatch(/MGButton/);
    expect(checkout).toMatch(/MallPayPanel/);
    expect(payPanel).toMatch(/MGButton/);
    expect(payPanel).toMatch(/variant="primary"/);
  });
});
