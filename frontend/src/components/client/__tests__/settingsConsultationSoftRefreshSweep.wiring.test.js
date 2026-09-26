/**
 * Settings / consultation / messages / mypage soft-refresh sweep — source wiring
 * (no location.reload / dashboard assign; userId-scoped load + softRefresh SSOT)
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.join(__dirname, '..', '..', '..');

function readSrc(...parts) {
  return fs.readFileSync(path.join(FRONTEND_SRC, ...parts), 'utf8');
}

describe('common soft-load hooks exist (SSOT)', () => {
  test('useStableUserId / useUserIdScopedLoad / useSoftResourceLoad modules export', () => {
    expect(readSrc('hooks', 'useStableUserId.js')).toMatch(/export function useStableUserId/);
    expect(readSrc('hooks', 'useUserIdScopedLoad.js')).toMatch(/export function useUserIdScopedLoad/);
    expect(readSrc('hooks', 'useSoftResourceLoad.js')).toMatch(/export function useSoftResourceLoad/);
    expect(readSrc('hooks', 'useSoftResourceLoad.js')).toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
  });
});

describe('settings/consultation/messages soft-refresh sweep wiring', () => {
  const softLoadCases = [
    {
      name: 'ClientSettings',
      source: () => readSrc('components', 'client', 'ClientSettings.js'),
      expectSoftRefresh: true
    },
    {
      name: 'ConsultationHistory',
      source: () => readSrc('components', 'consultation', 'ConsultationHistory.js'),
      expectSoftRefresh: true
    },
    {
      name: 'ConsultationReport',
      source: () => readSrc('components', 'consultation', 'ConsultationReport.js'),
      expectSoftRefresh: true
    },
    {
      name: 'ClientMessageScreen',
      source: () => readSrc('components', 'client', 'ClientMessageScreen.js'),
      expectSoftRefresh: true
    },
    {
      name: 'UserSettings',
      source: () => readSrc('components', 'settings', 'UserSettings.js'),
      expectSoftRefresh: false
    }
  ];

  test.each(softLoadCases)(
    '$name uses userId-scoped load (not full [user] initial load) and no hard reload',
    ({ source, expectSoftRefresh }) => {
      const src = source();
      expect(src).toMatch(/useStableUserId|userId/);
      expect(src).not.toMatch(/location\.reload\s*\(/);
      expect(src).not.toMatch(/window\.location\.reload\s*\(/);
      expect(src).not.toMatch(/window\.location\.assign\s*\(\s*['"]\/client\/dashboard/);
      expect(src).not.toMatch(/window\.location\.href\s*=\s*['"]\/client\/dashboard/);
      expect(src).not.toMatch(/window\.location\.href\s*=\s*['"]\/consultant\/dashboard/);
      if (expectSoftRefresh) {
        expect(src).toMatch(/useUserIdScopedLoad|useSoftResourceLoad|softRefresh|runResourceLoad/);
      }
    }
  );

  test('ConsultationHistory / ClientMessageScreen import softRefresh SSOT hooks', () => {
    const history = readSrc('components', 'consultation', 'ConsultationHistory.js');
    const messages = readSrc('components', 'client', 'ClientMessageScreen.js');
    expect(history).toMatch(/useSoftResourceLoad/);
    expect(history).toMatch(/useUserIdScopedLoad/);
    expect(messages).toMatch(/useSoftResourceLoad/);
    expect(messages).toMatch(/softRefreshMessages|softRefresh\(/);
  });

  test('ShopCheckout / ShopOrderDetail PortOne gate deps are not bare [user]', () => {
    const checkout = readSrc('pages', 'client', 'shop', 'ShopCheckoutPage.js');
    const order = readSrc('pages', 'client', 'shop', 'ShopOrderDetailPage.js');
    expect(checkout).toMatch(/resolveSessionPhoneNumber\(user\)/);
    expect(checkout).not.toMatch(/assertPortOneCustomerReadyBeforeCheckout\(user\),\s*\[user\]/);
    expect(order).toMatch(/resolveSessionPhoneVerified\(user\)/);
    expect(order).not.toMatch(/assertPortOneCustomerReadyBeforeCheckout\(user\),\s*\[user\]/);
  });
});

describe('SPA navigate (no dashboard/settings hard assign)', () => {
  test('ProfileSection email-change uses redirectToLoginPageOnce (no assign /login)', () => {
    const src = readSrc('components', 'mypage', 'components', 'ProfileSection.js');
    expect(src).toMatch(/from ['"][^'"]*utils\/sessionRedirect['"]/);
    expect(src).toContain('redirectToLoginPageOnce');
    expect(src).not.toMatch(/window\.location\.assign\s*\(\s*['"]\/login['"]\)/);
  });

  test('RiskAlertBadge uses navigate not location.href', () => {
    const src = readSrc('components', 'clinical', 'RiskAlertBadge.js');
    expect(src).toContain('useNavigate');
    expect(src).toMatch(/navigate\(`\/consultant\/records/);
    expect(src).toMatch(/navigate\(['"]\/consultant\/alerts['"]\)/);
    expect(src).not.toMatch(/window\.location\.href\s*=/);
  });

  test('TabletLogin SMS success uses redirectToDynamicDashboard + navigate', () => {
    const src = readSrc('components', 'auth', 'TabletLogin.js');
    expect(src).toContain('redirectToDynamicDashboard');
    expect(src).toMatch(/await redirectToDynamicDashboard\(/);
    expect(src).not.toMatch(/window\.location\.href\s*=\s*resolvePostLoginLandingPath/);
    expect(src).not.toMatch(/window\.location\.href\s*=\s*['"]\/dashboard['"]/);
  });

  test('BranchLogin is deprecated and SPA-navigates to /login', () => {
    const src = readSrc('components', 'auth', 'BranchLogin.js');
    expect(src).toMatch(/@deprecated|deprecated/i);
    expect(src).toMatch(/navigate\(['"]\/login['"]/);
    expect(src).not.toMatch(/window\.location\.href\s*=/);
    expect(src).not.toMatch(/location\.reload\s*\(/);
  });
});
