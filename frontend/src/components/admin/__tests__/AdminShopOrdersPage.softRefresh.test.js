/**
 * AdminShopOrdersPage — soft refresh wiring (mutation 후 AdminCommonLayout loading 미사용)
 */
import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'AdminShopOrdersPage.js'),
  'utf8'
);

describe('AdminShopOrdersPage soft refresh wiring', () => {
  test('imports and uses runResourceLoad / softRefresh', () => {
    expect(SOURCE).toMatch(/from ['"]\.\.\/\.\.\/utils\/softRefresh['"]/);
    expect(SOURCE).toMatch(/runResourceLoad/);
    expect(SOURCE).toMatch(/softRefresh\(loadOrders\)/);
  });

  test('useEffect deps use user?.id (not whole user)', () => {
    expect(SOURCE).toMatch(/user\?\.id/);
    expect(SOURCE).not.toMatch(
      /\[sessionLoading,\s*isLoggedIn,\s*user,\s*allowed,\s*navigate,\s*loadOrders\]/
    );
  });
});
