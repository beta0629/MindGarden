/**
 * 상담 패키지 상품 내용 — 상담 분야·상담 선생님 셀렉트.
 * with-stats 중첩 응답이 option 으로 보이고, 선택 글자가 overflow 로 잘리지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-28
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, waitFor } from '@testing-library/react';
import {
  ADMIN_SHOP_CONSULTANT_LABEL,
  ADMIN_SHOP_FIELD_CODE_PLACEHOLDER,
  ADMIN_SHOP_SKU_TEST_IDS
} from '../../../constants/adminShopCatalog';
import { SHOP_CATALOG_CATEGORY } from '../../../constants/clientShopConstants';
import AdminShopCatalogSkuEditorPage from '../AdminShopCatalogSkuEditorPage';
import { getAdminShopPackageFee } from '../../../services/adminShopCatalogService';
import { getAllConsultantsWithStats } from '../../../utils/consultantHelper';
import { getTenantCodes } from '../../../utils/commonCodeApi';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
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
  useNavigate: () => mockNavigate,
  useParams: () => ({ packageCode: 'PACKAGE_001' })
}));

jest.mock('../../../contexts/SessionContext', () => {
  const session = {
    user: { id: 1, role: 'ADMIN' },
    isLoggedIn: true,
    isLoading: false
  };
  return {
    useSession: () => session
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading }) => (
    loading ? <div data-testid="page-loading" /> : <div>{children}</div>
  )
}));

jest.mock('../../shop/organisms/ShopProductImageUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-sku-image-upload" />
}));

jest.mock('../../../services/adminShopCatalogService', () => ({
  getAdminShopPackageFee: jest.fn(),
  patchAdminShopPackageFeeVisible: jest.fn(),
  updateAdminShopPackageFeeContent: jest.fn(),
  uploadAdminShopCatalogSkuThumbnail: jest.fn()
}));

jest.mock('../../../utils/consultantHelper', () => ({
  getAllConsultantsWithStats: jest.fn()
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getTenantCodes: jest.fn()
}));

const EDITOR_CSS = fs.readFileSync(
  path.join(__dirname, '../AdminShopCatalogSkuEditorPage.css'),
  'utf8'
);

describe('AdminShopCatalogSkuEditorPage consultant select', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    getAdminShopPackageFee.mockReset();
    getAllConsultantsWithStats.mockReset();
    getTenantCodes.mockReset();
    getAdminShopPackageFee.mockResolvedValue({
      packageCode: 'PACKAGE_001',
      packageName: '언어치료 10회',
      unitPriceMinor: 100000,
      sessionCount: 10,
      priceReady: true,
      catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION,
      fieldCode: 'SPEECH',
      consultantId: null,
      catalogVisible: false
    });
    getTenantCodes.mockResolvedValue([
      { codeValue: 'SPEECH', koreanName: '언어치료', isActive: true }
    ]);
    getAllConsultantsWithStats.mockResolvedValue([
      {
        consultant: {
          id: 8,
          name: '김상담',
          role: 'CONSULTANT',
          isActive: true
        },
        currentClients: 1
      }
    ]);
  });

  test('상담 패키지면 상담사 이름이 option 으로 보이고 선택 글자는 잘리지 않는다', async() => {
    const style = document.createElement('style');
    style.textContent = EDITOR_CSS;
    document.head.appendChild(style);

    render(<AdminShopCatalogSkuEditorPage />);

    const consultantSelect = await screen.findByTestId(ADMIN_SHOP_SKU_TEST_IDS.CONSULTANT_SELECT);
    await waitFor(() => {
      expect(consultantSelect).not.toBeDisabled();
      expect(consultantSelect.querySelectorAll('option').length).toBeGreaterThan(1);
    });

    const consultantOption = screen.getByRole('option', { name: '김상담' });
    expect(consultantOption).toHaveAttribute('value', '8');
    expect(consultantOption).toHaveTextContent('김상담');
    expect(
      consultantSelect.querySelector('option[value=""]')
    ).toHaveTextContent(ADMIN_SHOP_FIELD_CODE_PLACEHOLDER);

    const fieldSelect = screen.getByTestId(ADMIN_SHOP_SKU_TEST_IDS.FIELD_CODE_SELECT);
    expect(fieldSelect).not.toBeDisabled();
    const fieldOption = screen.getByRole('option', { name: '언어치료' });
    expect(fieldOption).toHaveTextContent('언어치료');

    expect(screen.getByText(ADMIN_SHOP_CONSULTANT_LABEL)).toBeInTheDocument();
    const stack = consultantSelect.closest('.admin-shop-sku-editor__choice-stack');
    expect(stack).not.toBeNull();
    expect(stack.className).not.toContain('mg-v2-form-row');

    const optionStyle = window.getComputedStyle(consultantOption);
    const fieldOptionStyle = window.getComputedStyle(fieldOption);
    const selectStyle = window.getComputedStyle(consultantSelect);
    expect(optionStyle.overflow).toBe('visible');
    expect(optionStyle.whiteSpace).toBe('normal');
    expect(fieldOptionStyle.overflow).toBe('visible');
    expect(fieldOptionStyle.whiteSpace).toBe('normal');
    expect(selectStyle.overflow).toBe('visible');
    expect(selectStyle.whiteSpace).toBe('normal');
    expect(selectStyle.textOverflow).not.toBe('ellipsis');

    style.remove();
  });
});
