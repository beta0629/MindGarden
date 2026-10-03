/**
 * App.js — shop outside ClientAppShell · legacy redirects · catch-all (static)
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('App.js client shop + legacy redirect wiring', () => {
  const appJs = read('src/App.js');

  test('shop routes are outside ClientAppShell (no nested path="shop")', () => {
    const shellStart = appJs.indexOf('path="/client"');
    const shellEnd = appJs.indexOf('path={CLIENT_SHOP_ROUTES.CATALOG}', shellStart);
    expect(shellStart).toBeGreaterThan(-1);
    expect(shellEnd).toBeGreaterThan(shellStart);
    const shellBlock = appJs.slice(shellStart, shellEnd);
    expect(shellBlock).toMatch(/ClientAppShell/);
    expect(shellBlock).not.toMatch(/path="shop"/);
    expect(shellBlock).not.toMatch(/path="shop\/cart"/);
    expect(appJs).toMatch(/path=\{CLIENT_SHOP_ROUTES\.CATALOG\}/);
    expect(appJs).toMatch(/CLIENT_LEGACY_ROUTE_REDIRECTS\.map/);
    expect(appJs).toMatch(/path="\/client\/\*"/);
  });

  test('public catalog is not wrapped in ProtectedRoute at route element', () => {
    const catalogIdx = appJs.indexOf('path={CLIENT_SHOP_ROUTES.CATALOG}');
    expect(catalogIdx).toBeGreaterThan(-1);
    const snippet = appJs.slice(catalogIdx, catalogIdx + 420);
    expect(snippet).toMatch(/ShopCatalogPage/);
    expect(snippet).not.toMatch(/ProtectedRoute/);
  });

  test('cart route is inside the shared CLIENT route guard group', () => {
    const guardOpen = '<Route element={<ClientRouteGuard />}>';
    const guardIdx = appJs.indexOf(guardOpen);
    expect(guardIdx).toBeGreaterThan(-1);
    const lineStart = appJs.lastIndexOf('\n', guardIdx) + 1;
    const indent = appJs.slice(lineStart, guardIdx);
    const guardClose = appJs.indexOf(`\n${indent}</Route>`, guardIdx);
    const cartIdx = appJs.indexOf('path={CLIENT_SHOP_ROUTES.CART}');
    expect(cartIdx).toBeGreaterThan(guardIdx);
    expect(cartIdx).toBeLessThan(guardClose);
    expect(appJs.slice(cartIdx, cartIdx + 520)).toMatch(/ShopCartPage/);
    expect(read('src/components/client/ClientRouteGuard.js')).toMatch(/USER_ROLES\.CLIENT/);
  });
});
