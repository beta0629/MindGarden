/**
 * ShopClientLayout — shared ClientWebTopChrome (brand + logout) smoke
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
  CLIENT_WEB_TOP_CHROME_TEST_ID
} from '../../../../constants/clientWebChromeConstants';
import ShopClientLayout from '../ShopClientLayout';

const MOCK_TENANT_CENTER = '햇살상담센터';
const MOCK_BRAND_WORD = 'Sunshine Counseling';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockLogout = jest.fn();
const mockUseTenantComponentFlags = jest.fn();

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

jest.mock('../../../../hooks/useTenantComponentFlags', () => ({
  useTenantComponentFlags: () => mockUseTenantComponentFlags()
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
    mockUseTenantComponentFlags.mockReturnValue({
      clientRewardEnabled: true
    });
  });

  test('renders ClientWebTopChrome with tenant brand + logout (no LNB)', () => {
    const { container } = render(
      <MemoryRouter>
        <ShopClientLayout title="장바구니">
          <p>cart-body</p>
        </ShopClientLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText(MOCK_BRAND_WORD)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CLIENT_WEB_LOGOUT })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '장바구니' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '상품' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '장바구니' })).toBeInTheDocument();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeNull();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();
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
  });
});
