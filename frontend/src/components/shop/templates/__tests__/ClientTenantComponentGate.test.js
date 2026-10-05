/**
 * ClientTenantComponentGate — fetchFailed → unavailable (no infinite skeleton)
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientTenantComponentGate from '../ClientTenantComponentGate';
import {
  CLIENT_REWARD_UNAVAILABLE_COPY,
  CLIENT_SHOP_FETCH_FAILED_COPY,
  CLIENT_SHOP_GATE_HOME_LABEL,
  CLIENT_SHOP_SESSION_LOADING_COPY,
  CLIENT_SHOP_TEST_IDS,
  CLIENT_SHOP_UNAVAILABLE_COPY
} from '../../../../constants/clientShopConstants';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import { PLATFORM_COMPONENT_CODES } from '../../../../constants/tenantComponentApi';

const mockUseTenantComponentFlags = jest.fn();
const mockUseSession = jest.fn();

jest.mock('../../../../hooks/useTenantComponentFlags', () => ({
  useTenantComponentFlags: () => mockUseTenantComponentFlags()
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

describe('ClientTenantComponentGate', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      isLoading: false,
      hasCheckedSession: true,
      isLoggedIn: true
    });
  });

  test('fetchFailed shows fetch-failed copy (not shop-OFF copy)', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      fetchFailed: true,
      clientShopEnabled: undefined,
      clientRewardEnabled: undefined
    });

    render(
      <MemoryRouter initialEntries={['/client/shop/cart']}>
        <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
          <p>shop-body</p>
        </ClientTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.queryByTestId(CLIENT_SHOP_TEST_IDS.SESSION_LOADING)).not.toBeInTheDocument();
    expect(screen.queryByText(CLIENT_SHOP_SESSION_LOADING_COPY)).not.toBeInTheDocument();
    expect(screen.getByText(CLIENT_SHOP_FETCH_FAILED_COPY.TITLE)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_SHOP_FETCH_FAILED_COPY.DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(CLIENT_SHOP_UNAVAILABLE_COPY.TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText('shop-body')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: CLIENT_SHOP_GATE_HOME_LABEL })).toHaveClass(
      'feature-unavailable__action'
    );
  });

  test('guest on public catalog bypasses flags and renders children', () => {
    mockUseSession.mockReturnValue({
      isLoading: false,
      hasCheckedSession: true,
      isLoggedIn: false
    });
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      fetchFailed: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });

    render(
      <MemoryRouter initialEntries={['/client/shop']}>
        <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
          <p>public-catalog</p>
        </ClientTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.getByText('public-catalog')).toBeInTheDocument();
    expect(screen.queryByText(CLIENT_SHOP_UNAVAILABLE_COPY.TITLE)).not.toBeInTheDocument();
  });

  test('enabled true renders children', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      fetchFailed: false,
      clientShopEnabled: true,
      clientRewardEnabled: true
    });

    render(
      <MemoryRouter initialEntries={['/client/shop/cart']}>
        <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
          <p>enabled-body</p>
        </ClientTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.getByText('enabled-body')).toBeInTheDocument();
  });

  test('disabled shop uses FeatureUnavailable with live copy as the only h1', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      fetchFailed: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });

    render(
      <MemoryRouter initialEntries={['/client/shop/cart']}>
        <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
          <p>shop-body</p>
        </ClientTenantComponentGate>
      </MemoryRouter>
    );

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(CLIENT_SHOP_UNAVAILABLE_COPY.TITLE);
    expect(screen.getByText(CLIENT_SHOP_UNAVAILABLE_COPY.DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText('shop-body')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: CLIENT_SHOP_GATE_HOME_LABEL });
    expect(link).toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.DASHBOARD);
    expect(link).toHaveClass('feature-unavailable__action');
    expect(link.className).not.toMatch(/primary/);

    const host = screen.getByTestId(
      `client-tenant-component-gate--${PLATFORM_COMPONENT_CODES.CLIENT_SHOP}`
    );
    expect(host).toHaveClass('feature-unavailable-host');
    expect(host.querySelector('.feature-unavailable')).toBeInTheDocument();
  });

  test('disabled reward passes reward copy into the same empty state', () => {
    mockUseTenantComponentFlags.mockReturnValue({
      loading: false,
      fetchFailed: false,
      clientShopEnabled: true,
      clientRewardEnabled: false
    });

    render(
      <MemoryRouter initialEntries={['/client/shop/points']}>
        <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_REWARD}>
          <p>reward-body</p>
        </ClientTenantComponentGate>
      </MemoryRouter>
    );

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      CLIENT_REWARD_UNAVAILABLE_COPY.TITLE
    );
    expect(screen.getByText(CLIENT_REWARD_UNAVAILABLE_COPY.DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText('reward-body')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: CLIENT_SHOP_GATE_HOME_LABEL })).toHaveAttribute(
      'href',
      CLIENT_DASHBOARD_ROUTES.DASHBOARD
    );
  });
});
