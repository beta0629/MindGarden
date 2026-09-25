/**
 * ShopClientLayout — shared ClientWebTopChrome (CLIENT_WEB_NAV + logout) smoke
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  CLIENT_WEB_LOGOUT,
  CLIENT_WEB_LOGOUT_CANCEL,
  CLIENT_WEB_LOGOUT_CONFIRM,
  CLIENT_WEB_NAV,
  CLIENT_WEB_TOP_CHROME_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID
} from '../../../../constants/clientWebChromeConstants';
import { CLIENT_SHOP_ROUTES } from '../../../../constants/clientShopConstants';
import ShopClientLayout from '../ShopClientLayout';

const MOCK_TENANT_CENTER = '햇살상담센터';
const MOCK_BRAND_WORD = 'Sunshine Counseling';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/ConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose, title, message, confirmText, cancelText }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
        <button type="button" onClick={onClose}>{cancelText}</button>
      </div>
    ) : null
  )
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../../hooks/useBranding', () => ({
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock('../../../../services/clientShopService', () => ({
  fetchShopCart: jest.fn().mockResolvedValue({ lines: [], subtotalMinor: 0 }),
  mergeGuestShopCartIntoServer: jest.fn().mockResolvedValue({ merged: false, lines: [] })
}));

jest.mock(
  '../../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

describe('ShopClientLayout shared top chrome', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(true);
    mockUseSession.mockReturnValue({
      user: {
        id: 101,
        name: '이재학',
        role: 'CLIENT',
        tenant: { tenantId: 'tenant-sunshine', name: MOCK_TENANT_CENTER }
      },
      isLoggedIn: true,
      isLoading: false,
      hasCheckedSession: true,
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: MOCK_TENANT_CENTER,
        companyNameEn: MOCK_BRAND_WORD
      },
      isLoading: false
    });
  });

  test('renders ClientWebTopChrome with SSOT nav · logout · no shop 5-tab · no LNB', async() => {
    const { container } = render(
      <MemoryRouter>
        <ShopClientLayout title="장바구니">
          <p>cart-body</p>
        </ShopClientLayout>
      </MemoryRouter>
    );

    const chrome = screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID);
    expect(chrome).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_TOP_NAV_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText(MOCK_BRAND_WORD)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CLIENT_WEB_LOGOUT })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '장바구니' })).toBeInTheDocument();

    CLIENT_WEB_NAV.forEach((item) => {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute('href', item.path);
    });
    expect(screen.getByRole('link', { name: '회기 고르기' })).toHaveAttribute(
      'href',
      CLIENT_SHOP_ROUTES.CATALOG
    );
    expect(screen.getByRole('link', { name: '회기 고르기' })).toHaveAttribute('aria-current', 'page');

    expect(screen.queryByRole('link', { name: '상품' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '내 구매' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '내 포인트' })).not.toBeInTheDocument();
    expect(container.querySelector('.client-shop__nav')).toBeNull();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeNull();
    expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();

    const cartBadge = await screen.findByTestId('client-shop-cart-badge');
    expect(cartBadge).toHaveAttribute('href', CLIENT_SHOP_ROUTES.CART);

    const end = chrome.querySelector('.client-web-topchrome__end');
    expect(end).toBeTruthy();
    const profile = end.querySelector('.client-web-topchrome__profile');
    expect(profile).toBeTruthy();
    expect(profile.querySelector('.client-web-topchrome__user-name')).toBeTruthy();
    expect(profile.querySelector('.client-web-topchrome__avatar')).toBeTruthy();
    expect(profile).toHaveAttribute('href', '/client/settings');
    const endChildren = Array.from(end.children).map((el) => el.className);
    expect(endChildren.indexOf('client-web-topchrome__cart'))
      .toBeLessThan(endChildren.indexOf('client-web-topchrome__profile'));
    expect(endChildren.indexOf('client-web-topchrome__profile'))
      .toBeLessThan(endChildren.indexOf('client-web-topchrome__logout'));
  });

  test('logout → ConfirmModal → useSession.logout', async() => {
    render(
      <MemoryRouter>
        <ShopClientLayout title="상품 둘러보기">
          <p>catalog-body</p>
        </ShopClientLayout>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: CLIENT_WEB_LOGOUT }));

    const dialog = await screen.findByRole('dialog', { name: CLIENT_WEB_LOGOUT });
    expect(within(dialog).getByText(CLIENT_WEB_LOGOUT_CONFIRM)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: CLIENT_WEB_LOGOUT_CANCEL }))
      .toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: CLIENT_WEB_LOGOUT }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('fail-closed: platform default brand labels omitted', () => {
    mockUseSession.mockReturnValue({
      user: {
        id: 101,
        name: '이재학',
        role: 'CLIENT',
        tenant: { tenantId: 'tenant-empty', name: '' },
        tenantName: '',
        branchName: ''
      },
      isLoggedIn: true,
      isLoading: false,
      hasCheckedSession: true,
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: 'CoreSolution',
        companyNameEn: 'Core Solution'
      },
      isLoading: false
    });

    const { container } = render(
      <MemoryRouter>
        <ShopClientLayout title="내 구매">
          <p>orders-body</p>
        </ShopClientLayout>
      </MemoryRouter>
    );

    expect(container.querySelector('.client-web-topchrome__brand-word')).toBeNull();
    expect(container.querySelector('.client-web-topchrome__brand-center')).toBeNull();
    expect(screen.queryByText('CoreSolution')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Solution')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: CLIENT_WEB_LOGOUT })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '회기 고르기' })).toBeInTheDocument();
  });
});
