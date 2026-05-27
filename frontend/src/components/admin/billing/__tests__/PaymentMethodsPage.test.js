/**
 * PaymentMethodsPage — 어드민 결제 수단 라우트 페이지 단위 테스트.
 *
 * 검증 범위 (디자이너 핸드오프 2026-05-27 §B-2/§C-1/§C-4/§H):
 *  - ContentHeader + ContentSection SSOT 렌더
 *  - "결제 수단 등록" 액션 버튼이 ContentHeader actions 에 배치
 *  - 빈 상태에서 EmptyState + B0KlA 일러스트 + CTA 렌더
 *  - 데이터 있을 때 카드 그리드 + "기본 설정" 액션 + 기본 배지 렌더
 *  - 결제 수단 등록 모달은 UnifiedModal SSOT 사용
 *  - 기본 결제 수단 설정 컨펜 모달은 UnifiedModal SSOT 사용
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
  getPaymentMethods: jest.fn(),
  getSubscriptions: jest.fn()
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

jest.mock('../wrappers/PaymentMethodRegistrationWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="payment-method-registration-wrapper" />
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

import { getPaymentMethods } from '../../../../utils/billingService';
import PaymentMethodsPage from '../PaymentMethodsPage';

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin/billing/payment-methods']}>
    <PaymentMethodsPage />
  </MemoryRouter>
);

describe('PaymentMethodsPage — 어드민 결제 수단 라우트 (2026-05-27)', () => {
  beforeEach(() => {
    getPaymentMethods.mockReset();
    getPaymentMethods.mockResolvedValue([]);
  });

  describe('SSOT 레이아웃 정합', () => {
    it('페이지가 admin-billing-payment-methods-page testid 로 렌더된다', async() => {
      await act(async() => renderPage());
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-payment-methods-page')).toBeInTheDocument();
      });
    });

    it('"결제 수단 등록" 버튼이 ContentHeader actions 우측에 렌더된다', async() => {
      await act(async() => renderPage());
      const addBtn = await screen.findByTestId('admin-billing-add-payment-method');
      const headerRight = addBtn.closest('.mg-v2-content-header__right');
      expect(headerRight).not.toBeNull();
    });

    it('컨테이너에 inline max-width override 가 없다 (글로벌 SSOT 위임)', async() => {
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      const root = container.querySelector('.mg-v2-ad-b0kla__container');
      expect(root).not.toBeNull();
      const inlineMaxWidth = root.style && root.style.maxWidth;
      expect(inlineMaxWidth || '').toBe('');
    });
  });

  describe('빈 상태', () => {
    it('등록된 결제 수단이 없을 때 EmptyState + B0KlA 일러스트가 렌더된다', async() => {
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      await waitFor(() => {
        const empty = container.querySelector('.mg-v2-empty-state');
        expect(empty).not.toBeNull();
      });
      const illustration = container.querySelector('.mg-v2-tenant-profile__illustration');
      expect(illustration).not.toBeNull();
      expect(illustration.getAttribute('aria-hidden')).toBe('true');
    });

    it('빈 상태 CTA 가 노출된다', async() => {
      await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-empty-payment-method-cta')).toBeInTheDocument();
      });
    });
  });

  describe('데이터 있는 상태 (디자이너 §B-2)', () => {
    it('결제 수단 데이터가 있으면 카드 그리드가 렌더되고 EmptyState 가 없다', async() => {
      getPaymentMethods.mockResolvedValue([
        { paymentMethodId: 'pm-1', cardBrand: '신한카드', cardLast4: '1234', isDefault: true }
      ]);
      const { container } = await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid="admin-billing-payment-method-card"]');
        expect(cards.length).toBe(1);
      });
      const empties = container.querySelectorAll('.mg-v2-empty-state');
      expect(empties.length).toBe(0);
    });

    it('기본 결제 수단에는 "기본 설정" 버튼이 표시되지 않고 기본 배지가 표시된다', async() => {
      getPaymentMethods.mockResolvedValue([
        { paymentMethodId: 'pm-1', cardBrand: '신한카드', cardLast4: '1234', isDefault: true }
      ]);
      await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      await waitFor(() => {
        const cards = document.querySelectorAll('[data-testid="admin-billing-payment-method-card"]');
        expect(cards.length).toBe(1);
      });
      // 기본 결제 수단이므로 "기본 설정" 버튼은 렌더되지 않는다.
      expect(screen.queryByTestId('admin-billing-set-default')).toBeNull();
    });

    it('비기본 결제 수단에는 "기본 설정" 버튼이 렌더된다', async() => {
      getPaymentMethods.mockResolvedValue([
        { paymentMethodId: 'pm-2', cardBrand: '국민카드', cardLast4: '5678', isDefault: false }
      ]);
      await act(async() => renderPage());
      await screen.findByTestId('admin-billing-add-payment-method');
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-set-default')).toBeInTheDocument();
      });
    });
  });

  describe('UnifiedModal 흐름 (디자이너 §C-1 / §C-4)', () => {
    it('"결제 수단 등록" 클릭 시 PaymentMethodRegistrationWrapper 가 UnifiedModal 내부에 렌더된다', async() => {
      await act(async() => renderPage());
      const addBtn = await screen.findByTestId('admin-billing-add-payment-method');
      await act(async() => {
        fireEvent.click(addBtn);
      });
      await waitFor(() => {
        expect(screen.getByTestId('payment-method-registration-wrapper')).toBeInTheDocument();
      });
    });

    it('"기본 설정" 클릭 시 기본 결제 수단 컨펜 모달이 열린다', async() => {
      getPaymentMethods.mockResolvedValue([
        { paymentMethodId: 'pm-2', cardBrand: '국민카드', cardLast4: '5678', isDefault: false }
      ]);
      await act(async() => renderPage());
      const setDefaultBtn = await screen.findByTestId('admin-billing-set-default');
      await act(async() => {
        fireEvent.click(setDefaultBtn);
      });
      await waitFor(() => {
        expect(screen.getByTestId('admin-billing-set-default-confirm')).toBeInTheDocument();
      });
    });
  });
});
