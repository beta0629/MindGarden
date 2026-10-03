/**
 * 설정 공통 셸 스모크 — 센터 프로필 · 브랜딩 · 사업자·약관
 * 실제 페이지를 렌더해 SettingsPageShell / SettingsSectionPanel 계약을 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
      const hasDefaultString = typeof defOrOpts === 'string';
      const fallback = hasDefaultString ? defOrOpts : key;
      const opts2 = hasDefaultString ? opts : defOrOpts;
      if (opts2 && typeof opts2 === 'object' && opts2.defaultValue !== undefined) {
        return String(opts2.defaultValue);
      }
      return fallback;
    }
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('i18next-browser-languagedetector', () => ({
  __esModule: true,
  default: { type: 'languageDetector', init: jest.fn(), detect: () => 'ko', cacheUserLanguage: jest.fn() }
}));

jest.mock('../../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiPostFormData: jest.fn()
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn().mockResolvedValue({ success: true }),
    patch: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../../../utils/billingService', () => ({
  __esModule: true,
  getPaymentMethods: jest.fn(),
  getSubscriptions: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), show: jest.fn() }
}));

jest.mock('../../../../hooks/useBranding', () => ({
  __esModule: true,
  useBranding: () => ({ isLoading: false, refreshBranding: jest.fn() })
}));

jest.mock('../../../../utils/brandingUtils', () => ({
  __esModule: true,
  updateBrandingInfo: jest.fn(),
  uploadLogo: jest.fn(),
  uploadFavicon: jest.fn(),
  getBrandingInfo: jest.fn(),
  getCustomLogoSrc: jest.fn(() => null)
}));

jest.mock('../../../../utils/merchantLegalApi', () => ({
  __esModule: true,
  ...jest.requireActual('../../../../utils/merchantLegalApi'),
  getMerchantLegal: jest.fn(),
  saveMerchantLegal: jest.fn()
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading, loadingText }) => (
    <div data-testid="admin-layout">
      {loading ? <div role="status">{loadingText}</div> : children}
    </div>
  )
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (
    isOpen ? (
      <div role="dialog">
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

const mockSessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-test', tenantName: '테스트센터' },
  sessionInfo: { tenantId: 'tenant-test' },
  isLoggedIn: true,
  isLoading: false,
  checkSession: jest.fn(),
  hasAnyRole: (roles) => roles.includes('ADMIN')
};
jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockSessionState
}));

import StandardizedApi from '../../../../utils/standardizedApi';
import { getPaymentMethods, getSubscriptions } from '../../../../utils/billingService';
import { getBrandingInfo } from '../../../../utils/brandingUtils';
import { getMerchantLegal } from '../../../../utils/merchantLegalApi';
import TenantProfile from '../../../tenant/TenantProfile';
import BrandingManagement from '../../BrandingManagement';
import MerchantLegalSettings from '../../../tenant/MerchantLegalSettings';

const renderPage = async(Page) => {
  let result;
  await act(async() => {
    result = render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    );
  });
  return result;
};

const expectSettingsShell = (container, title) => {
  const shell = container.querySelector('section.mg-v2-erp-shell.mg-v2-settings-shell');
  expect(shell).not.toBeNull();
  const h1 = shell.querySelector('h1');
  expect(h1).not.toBeNull();
  expect(h1).toHaveTextContent(title);
  expect(container.querySelector('.mg-v2-content-header')).toBeNull();
  expect(container.querySelectorAll('.mg-v2-settings-panel').length).toBeGreaterThan(0);
  return shell;
};

describe('설정 공통 셸 스모크 — 센터 프로필 · 브랜딩 · 사업자·약관', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue({
      tenant: { tenantId: 'tenant-test', name: '테스트센터', status: 'ACTIVE', businessType: '심리상담' }
    });
    getSubscriptions.mockResolvedValue([]);
    getPaymentMethods.mockResolvedValue([]);
    getBrandingInfo.mockResolvedValue({ companyName: '테스트센터', companyNameEn: 'Test Center' });
    getMerchantLegal.mockResolvedValue({ representativeName: '홍길동' });
  });

  it('센터 프로필: 셸 + TabChipRow 탭 + 요약 띠(실데이터)', async() => {
    const { container } = await renderPage(TenantProfile);
    await screen.findByTestId('tenant-profile-rename-open');
    const shell = expectSettingsShell(container, 'common:tenant.TenantProfile.t_326425a6');
    expect(shell.querySelector('[data-testid="tab-chip-row"]')).not.toBeNull();
    const strip = shell.querySelector('[data-testid="settings-summary-strip"]');
    expect(strip).not.toBeNull();
    expect(strip).toHaveTextContent('테스트센터');
    expect(strip).toHaveTextContent('심리상담');
    expect(strip).toHaveTextContent('활성');
    expect(shell.querySelector('[role="tabpanel"]')).not.toBeNull();
    expect(container.querySelector('.mg-v2-segmented-tabs, .mg-v2-ad-b0kla__pill-toggle')).toBeNull();
  });

  it('브랜딩: 셸 + 섹션 패널 + 입력 계약 클래스', async() => {
    const { container } = await renderPage(BrandingManagement);
    const shell = expectSettingsShell(container, 'admin:BrandingManagement.t_fe06000d');
    expect(shell.querySelectorAll('.mg-v2-settings-panel').length).toBe(4);
    expect(shell.querySelector('#branding-company-name')).toHaveClass('mg-v2-form-input');
    expect(container.querySelector('.mg-branding-settings__accent-bar')).toBeNull();
    expect(shell.querySelector('button[type="submit"]')).toHaveClass('mg-v2-settings-button');
  });

  it('사업자·약관: 셸 + 요약 띠 + 저장 버튼 유지', async() => {
    const { container } = await renderPage(MerchantLegalSettings);
    const shell = expectSettingsShell(container, '사업자·약관');
    expect(shell.querySelector('[data-testid="settings-summary-strip"]')).not.toBeNull();
    const save = screen.getByTestId('merchant-legal-save');
    expect(save).toHaveClass('mg-v2-settings-button');
    expect(save.closest('.mg-v2-settings-header')).not.toBeNull();
    expect(screen.getByTestId('merchant-legal-preview-rail')).toHaveAttribute('id', 'merchant-legal-public-preview');
    expect(screen.getByTestId('merchant-legal-biz-number')).toHaveClass('mg-v2-form-input');
  });
});
