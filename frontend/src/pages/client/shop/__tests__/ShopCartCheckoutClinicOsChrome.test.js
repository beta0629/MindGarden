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

  test('cart and checkout render SessionCountTicket', () => {
    expect(cart).toMatch(/SessionCountTicket/);
    expect(checkout).toMatch(/SessionCountTicket/);
    expect(ticket).toMatch(/formatShopSessionCountDisplay/);
    expect(ticket).toMatch(/client-shop__session-ticket/);
  });

  test('checkout CTA uses MGButton primary', () => {
    expect(cart).toMatch(/MGButton/);
    expect(checkout).toMatch(/MGButton/);
    expect(checkout).toMatch(/variant="primary"/);
  });
});
