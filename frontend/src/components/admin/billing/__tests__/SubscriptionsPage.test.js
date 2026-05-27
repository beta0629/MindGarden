/**
 * SubscriptionsPage — 어드민 구독 관리 라우트 페이지 단위 테스트.
 *
 * 검증 범위 (디자이너 핸드오프 2026-05-27 §B/§C/§H):
 *  - ContentHeader + ContentSection SSOT 렌더
 *  - "구독 등록" 액션 버튼이 ContentHeader actions 에 배치
 *  - 빈 상태에서 EmptyState + B0KlA 일러스트 + CTA 렌더
 *  - 데이터 있을 때 카드 그리드 + "구독 취소" 액션 렌더
 *  - 구독 등록 모달은 UnifiedModal SSOT 사용 (커스텀 오버레이 금지)
 *  - 구독 취소 컨펜 모달은 UnifiedModal SSOT 사용
 *
 * @author MindGarden
 * @since 2026-05-27
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => {
  const stableT = (key, defOrOpts, opts) => {
    const hasDefaultString = typeof defOrOpts === 'string';
    const fallback = hasDefaultString ? defOrOpts : key;
    const opts2 = hasDefaultString ? opts : defOrOpts;
    if (opts2 && typeof opts2 === 'object' && opts2.defaultValue !== undefined) {
      return String(opts2.defaultValue);
    }
    return fallback;
  };
  const stableUseTranslation = { t: stableT };
  return {
    __esModule: true,
    useTranslation: () => stableUseTranslation,
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

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
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn().mockResolvedValue({ success: true }),
    patch: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../../../utils/billingService', () => ({
  __esModule: true,
  getSubscriptions: jest.fn(),
  getPaymentMethods: jest.fn(),
  cancelSubscription: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), show: jest.fn() }
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
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

jest.mock('../wrappers/SubscriptionManagementWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="subscription-management-wrapper" />
}));

const mockSessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-billing' },
  sessionInfo: { tenantId: 'tenant-billing' },
  isLoggedIn: true,
  isLoading: false,
  checkSession: jest.fn(),
  hasAnyRole: (roles) => roles.includes('ADMIN')
};
jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockSessionState
}));

import { getSubscriptions, cancelSubscription } from '../../../../utils/billingService';
import SubscriptionsPage from '../SubscriptionsPage';

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin/billing/subscriptions']}>
    <SubscriptionsPage />
  </MemoryRouter>
);

describe('SubscriptionsPage — 어드민 구독 관리 라우트 (2026-05-27)', () => {
  beforeEach(() => {
    getSubscriptions.mockReset();
    cancelSubscription.mockReset();
    getSubscriptions.mockResolvedValue([]);
    cancelSubscription.mockResolvedValue({ success: true });
  });

  describe('SSOT 레이아웃 정합', () => {
    it('ContentHeader 가 페이지 타이틀과 함께 렌더된다', async() => {
      await act(async() => renderPage());
      const page = await screen.findByTestId('admin-billing-subscriptions-page');
      expect(page).toBeInTheDocument();
      const header = document.querySelector('.mg-v2-content-header');
      expect(header).not.toBeNull();
    });

    it('"구독 등록" 버튼이 ContentHeader actions 우측에 렌더된다', async() => {
      await act(async() => renderPage());
      const addBtn = await screen.findByTestId('admin-billing-add-subscription');
      expect(addBtn).toBeInTheDocument();
      const headerRight = addBtn.closest('.mg-v2-content-header__right');
      expect(headerRight).not.toBeNull();
    });

    it('ContentSection (mg-v2-content-section--card) 카드가 단일 렌더된다', async() => {
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      const sections = container.querySelectorAll('.mg-v2-content-section');
      expect(sections.length).toBe(1);
    });

    it('컨테이너에 inline max-width override 가 없다 (글로벌 SSOT 위임)', async() => {
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      const root = container.querySelector('.mg-v2-ad-b0kla__container');
      expect(root).not.toBeNull();
      const inlineMaxWidth = root.style && root.style.maxWidth;
      expect(inlineMaxWidth || '').toBe('');
    });
  });

  describe('빈 상태 (디자이너 §C-3)', () => {
    it('구독이 없을 때 EmptyState 가 일러스트와 함께 렌더된다', async() => {
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      await waitFor(() => {
        const empty = container.querySelector('.mg-v2-empty-state');
        expect(empty).not.toBeNull();
      });
      const illustration = container.querySelector('.mg-v2-tenant-profile__illustration');
      expect(illustration).not.toBeNull();
      expect(illustration.getAttribute('aria-hidden')).toBe('true');
    });

    it('빈 상태에서 "구독 등록" CTA 가 노출된다', async() => {
      await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-empty-subscription-cta')).toBeInTheDocument();
      });
    });
  });

  describe('데이터 있는 상태 (디자이너 §B-1)', () => {
    it('구독 데이터가 있으면 카드 그리드가 렌더되고 EmptyState 가 없다', async() => {
      getSubscriptions.mockResolvedValue([
        { subscriptionId: 'sub-1', planName: '베이직', status: 'ACTIVE', amount: 39000 }
      ]);
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid="admin-billing-subscription-card"]');
        expect(cards.length).toBe(1);
      });
      const empties = container.querySelectorAll('.mg-v2-empty-state');
      expect(empties.length).toBe(0);
    });

    it('카드 액션에 "구독 취소" 버튼이 렌더된다', async() => {
      getSubscriptions.mockResolvedValue([
        { subscriptionId: 'sub-1', planName: '베이직', status: 'ACTIVE', amount: 39000 }
      ]);
      await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-subscription');
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-cancel-subscription')).toBeInTheDocument();
      });
    });
  });

  describe('UnifiedModal 흐름 (디자이너 §C-2 / §C-3)', () => {
    it('"구독 등록" 클릭 시 UnifiedModal 이 열린다', async() => {
      await act(async() => renderPage());
      const addBtn = await screen.findByTestId('admin-billing-add-subscription');
      await act(async() => {
        fireEvent.click(addBtn);
      });
      await waitFor(() => {
        expect(screen.getByTestId('subscription-management-wrapper')).toBeInTheDocument();
      });
    });

    it('"구독 취소" 클릭 시 컨펜 모달이 열린다', async() => {
      getSubscriptions.mockResolvedValue([
        { subscriptionId: 'sub-1', planName: '베이직', status: 'ACTIVE', amount: 39000 }
      ]);
      await act(async() => renderPage());
      const cancelBtn = await screen.findByTestId('admin-billing-cancel-subscription');
      await act(async() => {
        fireEvent.click(cancelBtn);
      });
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-cancel-subscription-confirm')).toBeInTheDocument();
      });
    });

    it('취소 컨펜 모달에서 "확인" 클릭 시 cancelSubscription API 가 호출된다', async() => {
      getSubscriptions.mockResolvedValue([
        { subscriptionId: 'sub-77', planName: '프로', status: 'ACTIVE', amount: 99000 }
      ]);
      await act(async() => renderPage());
      const cancelBtn = await screen.findByTestId('admin-billing-cancel-subscription');
      await act(async() => {
        fireEvent.click(cancelBtn);
      });
      const confirmBtn = await screen.findByTestId('admin-billing-cancel-subscription-confirm');
      await act(async() => {
        fireEvent.click(confirmBtn);
      });
      await waitFor(() => {
        expect(cancelSubscription).toHaveBeenCalledWith('sub-77');
      });
    });
  });
});
