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
  CLIENT_SHOP_FETCH_FAILED_COPY,
  CLIENT_SHOP_SESSION_LOADING_COPY,
  CLIENT_SHOP_TEST_IDS,
  CLIENT_SHOP_UNAVAILABLE_COPY
} from '../../../../constants/clientShopConstants';
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
});
