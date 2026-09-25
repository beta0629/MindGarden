/**
 * clientLegacyRouteRedirects — SSOT map unit tests
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

import { CLIENT_DASHBOARD_ROUTES } from '../clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../clientShopConstants';
import {
  CLIENT_LEGACY_NESTED_REDIRECTS,
  CLIENT_LEGACY_ROOT_REDIRECTS,
  CLIENT_LEGACY_ROUTE_REDIRECTS,
  resolveClientLegacyRedirect
} from '../clientLegacyRouteRedirects';

describe('clientLegacyRouteRedirects', () => {
  it('maps legacy absolute paths to canonical targets', () => {
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/client/sessions']).toBe(
      CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT
    );
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/client/payments']).toBe(
      CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY
    );
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/client/orders']).toBe(
      CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY
    );
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/client/profile']).toBe(
      CLIENT_DASHBOARD_ROUTES.SETTINGS
    );
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/client/notifications']).toBe(
      '/notifications'
    );
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS['/shop']).toBe(CLIENT_SHOP_ROUTES.CATALOG);
  });

  it('resolveClientLegacyRedirect handles trailing slash and unknown', () => {
    expect(resolveClientLegacyRedirect('/client/sessions/')).toBe(
      CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT
    );
    expect(resolveClientLegacyRedirect('/client/unknown')).toBeNull();
    expect(resolveClientLegacyRedirect('')).toBeNull();
  });

  it('nested + root lists cover the same map without screen hardcodes', () => {
    const nestedTos = CLIENT_LEGACY_NESTED_REDIRECTS.map((r) => r.to);
    expect(nestedTos).toEqual(
      expect.arrayContaining([
        CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
        CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
        CLIENT_DASHBOARD_ROUTES.SETTINGS,
        '/notifications'
      ])
    );
    expect(CLIENT_LEGACY_ROOT_REDIRECTS).toEqual([
      { path: '/shop', to: CLIENT_SHOP_ROUTES.CATALOG }
    ]);
    expect(CLIENT_LEGACY_NESTED_REDIRECTS).toHaveLength(5);
  });
});
