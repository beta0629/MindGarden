/**
 * 온라인 상품 화면 — 패키지 요금 목록 노출/내용만 다룬다.
 *
 * @author CoreSolution
 * @since 2026-09-24
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  ADMIN_SHOP_PACKAGE_FEE_CONTENT_ACTION,
  ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON,
  ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE
} from '../../../constants/adminShopCatalog';
import AdminShopCatalogSkusPage from '../AdminShopCatalogSkusPage';
import {
  listAdminShopPackageFees,
  patchAdminShopPackageFeeVisible
} from '../../../services/adminShopCatalogService';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  }
}));

jest.mock('../../../services/adminShopCatalogService', () => ({
  listAdminShopPackageFees: jest.fn(),
  patchAdminShopPackageFeeVisible: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 1, role: 'ADMIN' },
    isLoggedIn: true,
    isLoading: false
  })
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading }) => (
    loading ? <div data-testid="page-loading" /> : <div>{children}</div>
  )
}));

describe('AdminShopCatalogSkusPage package fee list', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    listAdminShopPackageFees.mockReset();
    patchAdminShopPackageFeeVisible.mockReset();
    listAdminShopPackageFees.mockResolvedValue({
      packages: [
        {
          packageCode: 'PACKAGE_001',
          packageName: '10회기 상담',
          unitPriceMinor: 150000,
          sessionCount: 10,
          priceReady: true,
          catalogVisible: false,
          skuId: null
        }
      ],
      unlinkedSkus: []
    });
    patchAdminShopPackageFeeVisible.mockResolvedValue({});
  });

  test('요금 행의 이름·단가를 보여주고 상품 등록 폼은 없다', async() => {
    render(<AdminShopCatalogSkusPage />);

    expect(await screen.findByText('10회기 상담')).toBeInTheDocument();
    expect(screen.getByText(/150,000/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(ADMIN_SHOP_PACKAGE_FEE_PAGE_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '상품 등록' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-sku-title-input')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('단가(원, 정수)')).not.toBeInTheDocument();
    expect(listAdminShopPackageFees).toHaveBeenCalledTimes(1);
  });

  test('노출은 패키지 코드만 바꾸고 새 상품 생성 API는 호출하지 않는다', async() => {
    render(<AdminShopCatalogSkusPage />);
    const expose = await screen.findByRole('button', { name: ADMIN_SHOP_PACKAGE_FEE_EXPOSE_ON });
    fireEvent.click(expose);

    await waitFor(() => {
      expect(patchAdminShopPackageFeeVisible).toHaveBeenCalledWith('PACKAGE_001', true);
    });
  });

  test('내용 등록은 해당 패키지 코드 화면으로 이동한다', async() => {
    render(<AdminShopCatalogSkusPage />);
    const content = await screen.findByRole('button', { name: ADMIN_SHOP_PACKAGE_FEE_CONTENT_ACTION });
    fireEvent.click(content);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/package/PACKAGE_001')
    );
  });
});
