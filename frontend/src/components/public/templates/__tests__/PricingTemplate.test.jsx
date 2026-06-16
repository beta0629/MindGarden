/**
 * PricingTemplate 통합 테스트 (Refine v2)
 *
 * - 3 plan 카드 렌더링
 * - Eyebrow / H1 / Subtitle 렌더링
 * - BillingCycleToggle 렌더링 + onCycleChange 호출
 * - Compare Toggle 클릭 → matrix 가시성 토글
 * - TrustBadges 렌더링
 * - Enterprise 카드 클릭 → onContactSales
 * - Starter/Pro 카드 클릭 → onSelectPlan
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
   픽스처 — Refine v2 스키마
   ================================================================ */
const MOCK_PLANS = [
  {
    planKey: 'starter',
    variant: 'starter',
    nameLabel: 'Starter',
    monthlyPrice: 29000,
    yearlyPrice: 23200,
    currency: '₩',
    billingPeriodLabel: '월',
    iconKey: 'starter',
    subTextDefault: '30일 무료 체험',
    features: ['5명 사용자', '10GB 저장'],
    isHighlighted: false,
    isEnterprise: false,
  },
  {
    planKey: 'pro',
    variant: 'popular',
    nameLabel: 'Pro',
    monthlyPrice: 89000,
    yearlyPrice: 71200,
    currency: '₩',
    billingPeriodLabel: '월',
    iconKey: 'pro',
    badgeKey: 'public.pricing.popularBadge',
    badgeDefault: '가장 인기',
    features: ['무제한 사용자', '100GB 저장'],
    isHighlighted: true,
    isEnterprise: false,
  },
  {
    planKey: 'enterprise',
    variant: 'enterprise-dark',
    nameLabel: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    currency: null,
    billingPeriodLabel: null,
    iconKey: 'enterprise',
    features: ['전담 매니저', 'On-premise 옵션'],
    isHighlighted: false,
    isEnterprise: true,
  },
];

const MOCK_MATRIX_PLANS = [
  { key: 'starter', name: 'Starter' },
  { key: 'pro', name: 'Pro' },
  { key: 'enterprise', name: 'Enterprise' },
];

const MOCK_MATRIX_CATEGORIES = [
  {
    category: '사용자 관리',
    features: [
      { name: '사용자 수', starter: '5명', pro: '무제한', enterprise: '무제한' },
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

describe('PricingTemplate (Refine v2)', () => {
  describe('헤더 렌더링', () => {
    it('루트 클래스 mg-v2-pricing-template 가 존재한다', () => {
      const { container } = renderTemplate();
      expect(container.querySelector('.mg-v2-pricing-template')).toBeInTheDocument();
    });

    it('Eyebrow "PRICING" 이 노출된다', () => {
      renderTemplate();
      expect(screen.getByText('PRICING')).toBeInTheDocument();
    });

    it('H1 (heroTitle) 이 노출된다', () => {
      renderTemplate();
      expect(
        screen.getByText('비즈니스 규모에 맞춘 합리적인 요금')
      ).toBeInTheDocument();
    });

    it('Sub-H1 (heroSubtitle) 이 노출된다', () => {
      renderTemplate();
      expect(
        screen.getByText('모든 플랜은 투명한 가격과 유연한 확장성을 제공합니다.')
      ).toBeInTheDocument();
    });
  });

  describe('카드 렌더링', () => {
    it('3종 플랜 카드 래퍼가 모두 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('pricing-card-wrapper-starter')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-pro')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-card-wrapper-enterprise')).toBeInTheDocument();
    });

    it('PricingCard의 플랜 이름이 렌더링된다', () => {
      renderTemplate();
      expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    });

    it('Pro 카드의 "가장 인기" 뱃지가 노출된다', () => {
      renderTemplate();
      expect(screen.getByText('가장 인기')).toBeInTheDocument();
    });

    it('Enterprise 카드는 "맞춤 견적" 가격 표시', () => {
      renderTemplate();
      expect(screen.getByText('맞춤 견적')).toBeInTheDocument();
    });

    it('월간 사이클일 때 monthlyPrice 가 표시된다', () => {
      renderTemplate({ cycle: 'monthly' });
      expect(screen.getByText('29,000')).toBeInTheDocument();
      expect(screen.getByText('89,000')).toBeInTheDocument();
    });

    it('연간 사이클일 때 yearlyPrice 가 표시된다', () => {
      renderTemplate({ cycle: 'yearly' });
      expect(screen.getByText('23,200')).toBeInTheDocument();
      expect(screen.getByText('71,200')).toBeInTheDocument();
    });
  });

  describe('BillingCycleToggle', () => {
    it('toggle 이 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('billing-cycle-toggle')).toBeInTheDocument();
    });

    it('연간 버튼 클릭 시 onCycleChange("yearly") 호출', () => {
      const onCycleChange = jest.fn();
      renderTemplate({ onCycleChange, cycle: 'monthly' });
      fireEvent.click(screen.getByTestId('billing-cycle-toggle-yearly'));
      expect(onCycleChange).toHaveBeenCalledWith('yearly');
    });

    it('동일 사이클 클릭 시 onCycleChange 미호출', () => {
      const onCycleChange = jest.fn();
      renderTemplate({ onCycleChange, cycle: 'monthly' });
      fireEvent.click(screen.getByTestId('billing-cycle-toggle-monthly'));
      expect(onCycleChange).not.toHaveBeenCalled();
    });
  });

  describe('Compare Toggle / Matrix', () => {
    it('Compare Toggle 이 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('pricing-compare-toggle')).toBeInTheDocument();
    });

    it('초기 상태에서 matrix 는 hidden 속성이 적용된다', () => {
      renderTemplate();
      const matrixSection = screen.getByTestId('pricing-template-matrix');
      expect(matrixSection.hasAttribute('hidden')).toBe(true);
    });

    it('토글 클릭 시 matrix 의 hidden 이 해제된다', () => {
      renderTemplate();
      const toggle = screen.getByTestId('pricing-compare-toggle');
      fireEvent.click(toggle);
      const matrixSection = screen.getByTestId('pricing-template-matrix');
      expect(matrixSection.hasAttribute('hidden')).toBe(false);
    });

    it('matrixPlans 가 없으면 matrix 섹션이 렌더링되지 않는다', () => {
      renderTemplate({ matrixPlans: [], matrixCategories: [] });
      expect(screen.queryByTestId('pricing-template-matrix')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pricing-compare-toggle')).not.toBeInTheDocument();
    });
  });

  describe('TrustBadges', () => {
    it('TrustBadges 가 렌더링된다', () => {
      renderTemplate();
      expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
    });

    it('matrixPlans 가 없어도 TrustBadges 는 노출된다 (Spec §3.4)', () => {
      renderTemplate({ matrixPlans: [], matrixCategories: [] });
      expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('selectedPlanKey 에 해당하는 카드 wrapper 에 --selected 클래스가 추가된다', () => {
      renderTemplate({ selectedPlanKey: 'pro' });
      const proWrapper = screen.getByTestId('pricing-card-wrapper-pro');
      expect(proWrapper.className).toContain('mg-v2-pricing-template__card-wrapper--selected');
    });
  });

  describe('인터랙션 — onSelectPlan / onContactSales', () => {
    it('Starter 카드 클릭 시 onSelectPlan("starter") 이 호출된다', () => {
      const onSelectPlan = jest.fn();
      renderTemplate({ onSelectPlan });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-starter'));
      expect(onSelectPlan).toHaveBeenCalledWith('starter');
    });

    it('Pro 카드 클릭 시 onSelectPlan("pro") 이 호출된다', () => {
      const onSelectPlan = jest.fn();
      renderTemplate({ onSelectPlan });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-pro'));
      expect(onSelectPlan).toHaveBeenCalledWith('pro');
    });

    it('Enterprise 카드 클릭 시 onContactSales 가 호출된다', () => {
      const onContactSales = jest.fn();
      renderTemplate({ onContactSales });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-enterprise'));
      expect(onContactSales).toHaveBeenCalled();
    });

    it('Enterprise 카드 클릭 시 onSelectPlan 은 호출되지 않는다', () => {
      const onSelectPlan = jest.fn();
      const onContactSales = jest.fn();
      renderTemplate({ onSelectPlan, onContactSales });
      fireEvent.click(screen.getByTestId('pricing-card-wrapper-enterprise'));
      expect(onSelectPlan).not.toHaveBeenCalled();
      expect(onContactSales).toHaveBeenCalled();
    });
  });
});
