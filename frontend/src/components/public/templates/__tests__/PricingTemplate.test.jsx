/**
 * PricingTemplate 통합 테스트
 *
 * - 3 plan 카드 렌더링 검증
 * - PricingFeatureMatrix 렌더링 검증
 * - 요금제 카드 클릭 → onSelectPlan 호출
 * - Enterprise 카드 클릭 → onContactSales 호출
 * - 선택 상태 클래스 적용 확인
 * - matrixPlans/matrixCategories 미제공 시 matrix 섹션 미표시
 * - mg-v2-* 클래스 사용 검증
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/* axios mock — i18n/표준 모듈이 axios를 참조하므로 선행 처리 */
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

const PricingTemplate = require('../PricingTemplate').default;

/* ================================================================
   테스트 픽스처
   ================================================================ */
const MOCK_PLANS = [
  {
    planKey: 'basic',
    nameLabel: 'Basic',
    price: '49,000',
    priceUnit: '₩',
    pricePeriod: 'mo',
    features: ['상담사 5명까지', '기본 일정 관리'],
    isHighlighted: false,
    isEnterprise: false,
  },
  {
    planKey: 'pro',
    nameLabel: 'Pro',
    price: '149,000',
    priceUnit: '₩',
    pricePeriod: 'mo',
    features: ['상담사 20명까지', '고급 일정 관리'],
    isHighlighted: true,
    isEnterprise: false,
  },
  {
    planKey: 'enterprise',
    nameLabel: 'Enterprise',
    price: null,
    priceUnit: null,
    pricePeriod: null,
    features: ['상담사 무제한', '커스텀 브랜딩'],
    isHighlighted: false,
    isEnterprise: true,
  },
];

const MOCK_MATRIX_PLANS = [
  { key: 'basic', name: 'Basic' },
  { key: 'pro', name: 'Pro' },
  { key: 'enterprise', name: 'Enterprise' },
];

const MOCK_MATRIX_CATEGORIES = [
  {
    category: '사용자 관리',
    features: [
      { name: '상담사 계정 수', basic: '최대 5명', pro: '최대 20명', enterprise: '무제한' },
      { name: '권한 관리', basic: false, pro: true, enterprise: true },
    ],
  },
  {
    category: '상담 기능',
    features: [
      { name: '기본 상담 기록', basic: true, pro: true, enterprise: true },
    ],
  },
];

const renderTemplate = (props = {}) =>
  render(
    <MemoryRouter>
      <PricingTemplate
        plans={MOCK_PLANS}
        matrixPlans={MOCK_MATRIX_PLANS}
        matrixCategories={MOCK_MATRIX_CATEGORIES}
        {...props}
      />
    </MemoryRouter>
  );

/* ================================================================
   테스트 스위트
   ================================================================ */
describe('PricingTemplate', () => {
  describe('렌더링', () => {
    it('mg-v2-pricing-template 루트 클래스가 존재한다', () => {
      const { container } = renderTemplate();
      expect(container.querySelector('.mg-v2-pricing-template')).toBeInTheDocument();
    });

    it('3종 플랜 카드 래퍼가 모두 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('pricing-card-wrapper-basic')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-pro')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-enterprise')).toBeInTheDocument();
    });

    it('PricingCard의 플랜 이름이 렌더링된다', () => {
      renderTemplate();
      /* Basic/Pro/Enterprise는 카드(h3)와 matrix 헤더 양쪽에 표시될 수 있으므로 getAllByText 사용 */
      expect(screen.getAllByText('Basic').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    });

    it('PricingFeatureMatrix가 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('pricing-template-matrix')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-feature-matrix')).toBeInTheDocument();
    });

    it('matrixPlans가 없으면 matrix 섹션이 렌더링되지 않는다', () => {
      renderTemplate({ matrixPlans: [], matrixCategories: [] });
      expect(screen.queryByTestId('pricing-template-matrix')).not.toBeInTheDocument();
    });

    it('cards 섹션에 aria-label이 존재한다', () => {
      renderTemplate();
      expect(screen.getByTestId('pricing-template-cards')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('selectedPlanKey에 해당하는 카드 래퍼에 --selected 클래스가 추가된다', () => {
      renderTemplate({ selectedPlanKey: 'pro' });
      const proWrapper = screen.getByTestId('pricing-card-wrapper-pro');
      expect(proWrapper.className).toContain('mg-v2-pricing-template__card-wrapper--selected');
    });

    it('selectedPlanKey가 null이면 어느 카드도 --selected 클래스를 가지지 않는다', () => {
      renderTemplate({ selectedPlanKey: null });
      const cards = screen.getAllByTestId(/pricing-card-wrapper-/);
      cards.forEach((card) => {
        expect(card.className).not.toContain('--selected');
      });
    });
  });

  describe('인터랙션 — onSelectPlan', () => {
    it('Basic 카드 클릭 시 onSelectPlan("basic")이 호출된다', () => {
      const onSelectPlan = jest.fn();
      renderTemplate({ onSelectPlan });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-basic'));
      expect(onSelectPlan).toHaveBeenCalledTimes(1);
      expect(onSelectPlan).toHaveBeenCalledWith('basic');
    });

    it('Pro 카드 클릭 시 onSelectPlan("pro")이 호출된다', () => {
      const onSelectPlan = jest.fn();
      renderTemplate({ onSelectPlan });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-pro'));
      expect(onSelectPlan).toHaveBeenCalledWith('pro');
    });

    it('onSelectPlan이 없어도 클릭 시 에러가 발생하지 않는다', () => {
      renderTemplate({ onSelectPlan: undefined });
      expect(() => {
        fireEvent.click(screen.getByTestId('pricing-card-wrapper-basic'));
      }).not.toThrow();
    });
  });

  describe('인터랙션 — onContactSales', () => {
    it('Enterprise 카드 클릭 시 onContactSales가 호출된다', () => {
      const onContactSales = jest.fn();
      renderTemplate({ onContactSales });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-enterprise'));
      expect(onContactSales).toHaveBeenCalledTimes(1);
    });

    it('Enterprise 카드 클릭 시 onSelectPlan은 호출되지 않는다', () => {
      const onSelectPlan = jest.fn();
      const onContactSales = jest.fn();
      renderTemplate({ onSelectPlan, onContactSales });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-enterprise'));
      expect(onSelectPlan).not.toHaveBeenCalled();
      expect(onContactSales).toHaveBeenCalledTimes(1);
    });
  });

  describe('디자인 시스템 준수', () => {
    it('헤더에 mg-v2-pricing-template__title 클래스가 존재한다', () => {
      const { container } = renderTemplate();
      expect(container.querySelector('.mg-v2-pricing-template__title')).toBeInTheDocument();
    });

    it('카드 래퍼에 mg-v2-pricing-template__card-wrapper 클래스가 존재한다', () => {
      const { container } = renderTemplate();
      const wrappers = container.querySelectorAll('.mg-v2-pricing-template__card-wrapper');
      expect(wrappers.length).toBe(3);
    });
  });
});
