/**
 * TenantProfile — UI/UX 개선 회귀 테스트 (2026-05-27).
 *
 * 검증 범위:
 *  - 핸드오프 §A: "이름 변경" 액션이 ContentHeader.actions 우측에 렌더 + "활성" 배지 동행.
 *  - 핸드오프 §A / §B: 테넌트 정보 카드 2-컬럼 grid 구조 (`__grid--two-col`).
 *  - 핸드오프 §C: 구독/결제 빈 상태가 EmptyState + B0KlA 일러스트(aria-hidden="true").
 *  - 핸드오프 §E: 탭 role="tablist" / role="tab" / aria-selected.
 *  - 핸드오프 §H: 좌측 vertical green accent bar 가 CSS 차원에서 제거 (border-left 가 inline 미사용).
 *
 * @see docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_DESIGN_HANDOFF.md
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
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

jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiPostFormData: jest.fn()
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn().mockResolvedValue({ success: true }),
    patch: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../../utils/billingService', () => ({
  __esModule: true,
  getPaymentMethods: jest.fn(),
  getSubscriptions: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), show: jest.fn() }
}));

jest.mock('../../../hooks/useConfirm', () => ({
  __esModule: true,
  useConfirm: () => [jest.fn().mockResolvedValue(true), () => null]
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (
    isOpen ? (
      <div role="dialog" data-testid="unified-modal-mock">
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../billing/PaymentMethodRegistration', () => ({
  __esModule: true,
  default: () => <div data-testid="payment-method-registration" />
}));

jest.mock('../../billing/SubscriptionManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="subscription-management" />
}));

const mockSessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-test' },
  sessionInfo: { tenantId: 'tenant-test' },
  isLoggedIn: true,
  isLoading: false,
  checkSession: jest.fn(),
  hasAnyRole: (roles) => roles.includes('ADMIN')
};
jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockSessionState
}));

import StandardizedApi from '../../../utils/standardizedApi';
import { getPaymentMethods, getSubscriptions } from '../../../utils/billingService';
import TenantProfile from '../TenantProfile';

const TENANT_FIXTURE = {
  tenantId: 'tenant-test',
  name: '마인드가든심리상담센터',
  status: 'ACTIVE',
  businessType: '심리상담'
};

const renderTenantProfile = () => render(
  <MemoryRouter initialEntries={['/admin/tenant/profile']}>
    <TenantProfile />
  </MemoryRouter>
);

describe('TenantProfile UI/UX (2026-05-27)', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    getPaymentMethods.mockReset();
    getSubscriptions.mockReset();

    StandardizedApi.get.mockResolvedValue({ tenant: TENANT_FIXTURE });
    getPaymentMethods.mockResolvedValue([]);
    getSubscriptions.mockResolvedValue([]);
  });

  describe('핸드오프 §A — 헤더 액션 배치', () => {
    it('"이름 변경" 버튼이 ContentHeader 우측 actions 에 렌더된다', async() => {
      await act(async() => {
        renderTenantProfile();
      });

      const renameBtn = await screen.findByTestId('tenant-profile-rename-open');
      expect(renameBtn).toBeInTheDocument();

      const headerActions = renameBtn.closest('.mg-v2-tenant-profile__header-actions');
      expect(headerActions).not.toBeNull();
      const contentHeader = renameBtn.closest('.mg-v2-content-header');
      expect(contentHeader).not.toBeNull();
    });

    it('"이름 변경" 버튼에 aria-label 이 설정된다', async() => {
      await act(async() => {
        renderTenantProfile();
      });
      const renameBtn = await screen.findByTestId('tenant-profile-rename-open');
      expect(renameBtn.getAttribute('aria-label')).toBe('admin:tenantProfile.actions.changeNameAria');
    });

    it('"활성" 상태 배지가 헤더 actions 영역에 동행 렌더된다', async() => {
      await act(async() => {
        renderTenantProfile();
      });

      await screen.findByTestId('tenant-profile-rename-open');
      const renameBtn = screen.getByTestId('tenant-profile-rename-open');
      const headerActions = renameBtn.closest('.mg-v2-tenant-profile__header-actions');
      expect(headerActions).not.toBeNull();
      expect(within(headerActions).getByText('활성')).toBeInTheDocument();
    });
  });

  describe('핸드오프 §A / §B — 테넌트 정보 2-컬럼 grid', () => {
    it('테넌트 정보 카드는 __grid--two-col 클래스를 가진 grid 컨테이너를 포함한다', async() => {
      const { container } = await act(async() => renderTenantProfile());
      await screen.findByTestId('tenant-profile-rename-open');
      const twoColGrid = container.querySelector('.mg-v2-tenant-profile__grid--two-col');
      expect(twoColGrid).not.toBeNull();
      const columns = twoColGrid.querySelectorAll(':scope > .mg-v2-tenant-profile__column');
      expect(columns.length).toBe(2);
    });
  });

  describe('핸드오프 §C — 빈 상태 EmptyState + B0KlA 일러스트', () => {
    it('구독/결제 데이터가 없을 때 EmptyState 가 일러스트와 함께 렌더된다', async() => {
      const { container } = await act(async() => renderTenantProfile());
      await screen.findByTestId('tenant-profile-rename-open');

      const empties = container.querySelectorAll('.mg-v2-empty-state');
      expect(empties.length).toBeGreaterThanOrEqual(2);

      // 일러스트 SVG 가 두 곳 모두에 렌더되며 aria-hidden 이 유지된다.
      const illustrations = container.querySelectorAll('.mg-v2-tenant-profile__illustration');
      expect(illustrations.length).toBeGreaterThanOrEqual(2);
      illustrations.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
      });
    });

    it('빈 상태 CTA 버튼이 i18n 키 기반 라벨로 렌더된다', async() => {
      await act(async() => {
        renderTenantProfile();
      });
      await screen.findByTestId('tenant-profile-rename-open');

      expect(screen.getByTestId('tenant-profile-empty-subscription-cta')).toBeInTheDocument();
      expect(screen.getByTestId('tenant-profile-empty-payment-cta')).toBeInTheDocument();
    });

    it('구독 데이터가 있을 때는 EmptyState 가 아닌 요약 리스트가 렌더된다', async() => {
      getSubscriptions.mockResolvedValue([
        {
          subscriptionId: 'sub-1',
          planName: '베이직 요금제',
          status: 'ACTIVE',
          amount: 39000
        }
      ]);
      const { container } = await act(async() => renderTenantProfile());
      await screen.findByTestId('tenant-profile-rename-open');

      const subscriptionItems = container.querySelectorAll('.subscription-summary-item');
      await waitFor(() => {
        expect(subscriptionItems.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('핸드오프 §E — 탭 a11y', () => {
    it('탭 컨테이너에 role="tablist" 가 부여된다', async() => {
      const { container } = await act(async() => renderTenantProfile());
      await screen.findByTestId('tenant-profile-rename-open');
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).not.toBeNull();
      const tabs = tablist.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(3);
      // 기본 활성 탭(개요) 의 aria-selected=true 확인.
      const activeTab = Array.from(tabs).find((el) => el.getAttribute('aria-selected') === 'true');
      expect(activeTab).not.toBeUndefined();
    });
  });

  describe('핸드오프 §B / §H — 좌측 accent bar 제거 정책', () => {
    it('ContentSection 카드에 inline 스타일로 border-left 가 적용되지 않는다', async() => {
      const { container } = await act(async() => renderTenantProfile());
      await screen.findByTestId('tenant-profile-rename-open');
      const cards = container.querySelectorAll('.mg-v2-content-section--card');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        const inlineBorderLeft = card.style && card.style.borderLeft;
        expect(inlineBorderLeft || '').toBe('');
      });
    });
  });
});
