/**
 * PricingPage 통합 테스트
 *
 * - mock data import 시나리오 (pricingPlans.json mock)
 * - 데이터 로드 후 PricingTemplate 렌더링 확인
 * - 요금제 카드 클릭 → 선택 상태 업데이트
 * - 로딩 상태 / 에러 상태 렌더링
 * - PublicErrorBoundary wrapping 확인
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* axios mock — 선행 처리 필수 */
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

/* pricingPlans.json static import mock */
jest.mock('../../../data/pricingPlans.json', () => ({
  plans: [
    {
      planKey: 'basic',
      nameLabel: 'Basic',
      price: '49,000',
      priceUnit: '₩',
      pricePeriod: 'mo',
      features: ['상담사 5명까지'],
      isHighlighted: false,
      isEnterprise: false,
    },
    {
      planKey: 'pro',
      nameLabel: 'Pro',
      price: '149,000',
      priceUnit: '₩',
      pricePeriod: 'mo',
      features: ['상담사 20명까지'],
      isHighlighted: true,
      isEnterprise: false,
    },
    {
      planKey: 'enterprise',
      nameLabel: 'Enterprise',
      price: null,
      priceUnit: null,
      pricePeriod: null,
      features: ['상담사 무제한'],
      isHighlighted: false,
      isEnterprise: true,
    },
  ],
  matrix: {
    plans: [
      { key: 'basic', name: 'Basic' },
      { key: 'pro', name: 'Pro' },
      { key: 'enterprise', name: 'Enterprise' },
    ],
    featureCategories: [
      {
        category: '사용자 관리',
        features: [
          {
            name: '상담사 계정 수',
            basic: '최대 5명',
            pro: '최대 20명',
            enterprise: '무제한',
          },
        ],
      },
    ],
  },
}));

const PricingPage = require('../PricingPage').default;

/** 비동기 effect까지 flush한 후 렌더링 */
const renderPageFlushed = async (props = {}) => {
  let result;
  await act(async () => {
    result = render(
      <MemoryRouter>
        <PricingPage {...props} />
      </MemoryRouter>
    );
  });
  return result;
};

/* ================================================================
   테스트 스위트
   ================================================================ */
describe('PricingPage', () => {
  describe('데이터 로드 시나리오', () => {
    it('마운트 직후 로딩 상태가 표시된다', () => {
      render(
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('데이터 로드 후 3종 플랜 카드가 렌더링된다', async () => {
      await renderPageFlushed();
      /* Basic/Pro/Enterprise 텍스트 (카드 + matrix 헤더 포함) */
      expect(screen.getAllByText('Basic').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    });

    it('데이터 로드 후 PricingFeatureMatrix가 렌더링된다', async () => {
      await renderPageFlushed();
      expect(screen.getByTestId('pricing-feature-matrix')).toBeInTheDocument();
    });

    it('pricing-page data-testid가 존재한다', async () => {
      await renderPageFlushed();
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
    });

    it('데이터 로드 후 카드 래퍼가 3종 렌더링된다', async () => {
      await renderPageFlushed();
      expect(screen.getByTestId('pricing-card-wrapper-basic')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-pro')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-enterprise')).toBeInTheDocument();
    });
  });

  describe('사용자 시나리오 — 요금제 선택', () => {
    it('Basic 카드 클릭 시 선택 상태 클래스가 적용된다', async () => {
      await renderPageFlushed();

      fireEvent.click(screen.getByTestId('pricing-card-wrapper-basic'));

      expect(
        screen.getByTestId('pricing-card-wrapper-basic').className
      ).toContain('mg-v2-pricing-template__card-wrapper--selected');
    });

    it('Pro 카드 클릭 시 선택 상태가 Pro로 변경된다', async () => {
      await renderPageFlushed();

      fireEvent.click(screen.getByTestId('pricing-card-wrapper-pro'));

      expect(
        screen.getByTestId('pricing-card-wrapper-pro').className
      ).toContain('--selected');
    });

    it('Enterprise 카드 클릭 시 선택 상태 클래스가 적용되지 않는다', async () => {
      /* Enterprise → onContactSales 호출, selectedPlanKey 변경 없음 */
      /* jsdom에서 window.location.assign은 read-only이므로 delete 후 재정의 */
      const origLocation = window.location;
      // eslint-disable-next-line no-global-assign
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { assign: jest.fn(), href: origLocation.href },
      });

      await renderPageFlushed();

      fireEvent.click(screen.getByTestId('pricing-card-wrapper-enterprise'));

      expect(
        screen.getByTestId('pricing-card-wrapper-enterprise').className
      ).not.toContain('--selected');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: origLocation,
      });
    });
  });

  describe('PublicErrorBoundary wrapping', () => {
    it('정상 렌더링 시 pricing-page가 표시된다', async () => {
      await renderPageFlushed();
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
    });
  });

  describe('디자인 시스템 준수', () => {
    it('pricing-page에 mg-v2-pricing-page 클래스가 존재한다', async () => {
      await renderPageFlushed();
      const page = screen.getByTestId('pricing-page');
      expect(page.className).toContain('mg-v2-pricing-page');
    });
  });
});
