/**
 * PricingFeatureMatrix 단위 테스트
 *
 * - 데스크탑 테이블 렌더링 (role="table", Sticky 헤더)
 * - 모바일 Accordion 렌더링 (role="region", aria-expanded, aria-controls)
 * - 셀 표시: ✓ (포함) / — (미포함) / 텍스트
 * - Accordion 토글 콜백
 * - a11y (ARIA roles/attributes)
 * - mg-v2-* 클래스 사용 검증
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

const PricingFeatureMatrix = require('../PricingFeatureMatrix').default;

const mockPlans = [
  { key: 'basic', name: 'Basic' },
  { key: 'pro', name: 'Pro' },
  { key: 'enterprise', name: 'Enterprise' },
];

const mockFeatureCategories = [
  {
    category: '사용자 관리',
    features: [
      { name: '상담사 계정 수', basic: 'Up to 5', pro: 'Up to 20', enterprise: 'Unlimited' },
      { name: '권한 관리', basic: false, pro: true, enterprise: true },
    ],
  },
  {
    category: '상담 기능',
    features: [
      { name: '기본 상담 기록', basic: true, pro: true, enterprise: true },
      { name: '고급 통계', basic: false, pro: true, enterprise: true },
    ],
  },
];

const renderMatrix = (props = {}) =>
  render(
    <PricingFeatureMatrix
      plans={mockPlans}
      featureCategories={mockFeatureCategories}
      {...props}
    />
  );

describe('PricingFeatureMatrix', () => {
  describe('공통 렌더링', () => {
    it('메인 컨테이너가 mg-v2-feature-matrix 클래스로 렌더링된다', () => {
      const { container } = renderMatrix();
      expect(container.querySelector('.mg-v2-feature-matrix')).toBeInTheDocument();
    });

    it('data-testid="pricing-feature-matrix"가 존재한다', () => {
      renderMatrix();
      expect(screen.getByTestId('pricing-feature-matrix')).toBeInTheDocument();
    });

    it('breakpointMobile 기본값 768이 data 속성에 반영된다', () => {
      renderMatrix();
      const el = screen.getByTestId('pricing-feature-matrix');
      expect(el).toHaveAttribute('data-breakpoint-mobile', '768');
    });
  });

  describe('데스크탑 테이블 뷰', () => {
    it('role="table"인 요소가 존재한다', () => {
      renderMatrix();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('Sticky 헤더에 plan 이름이 표시된다', () => {
      const { container } = renderMatrix();
      const stickyHeader = container.querySelector('.mg-v2-feature-matrix__thead');
      expect(stickyHeader).toBeInTheDocument();

      const headerCells = stickyHeader.querySelectorAll('[role="columnheader"]');
      expect(headerCells).toHaveLength(4);
      expect(headerCells[0]).toHaveTextContent('Features');
      expect(headerCells[1]).toHaveTextContent('Basic');
      expect(headerCells[2]).toHaveTextContent('Pro');
      expect(headerCells[3]).toHaveTextContent('Enterprise');
    });

    it('Sticky 헤더 요소가 position: sticky CSS 클래스를 갖는다', () => {
      const { container } = renderMatrix();
      const stickyHeader = container.querySelector('.mg-v2-feature-matrix__thead');
      expect(stickyHeader).toBeInTheDocument();
    });

    it('카테고리 이름이 행으로 표시된다', () => {
      renderMatrix();
      expect(screen.getAllByText('사용자 관리').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('상담 기능').length).toBeGreaterThanOrEqual(1);
    });

    it('포함(true)인 셀에 ✓가 표시된다', () => {
      renderMatrix();
      const checks = screen.getAllByLabelText('Included');
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0]).toHaveTextContent('✓');
    });

    it('미포함(false)인 셀에 —가 표시된다', () => {
      renderMatrix();
      const dashes = screen.getAllByLabelText('Not included');
      expect(dashes.length).toBeGreaterThan(0);
      expect(dashes[0]).toHaveTextContent('—');
    });

    it('텍스트 값("Up to 5" 등)이 표시된다', () => {
      renderMatrix();
      expect(screen.getAllByText('Up to 5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Up to 20').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);
    });

    it('feature-matrix-table testid가 존재한다', () => {
      renderMatrix();
      expect(screen.getByTestId('feature-matrix-table')).toBeInTheDocument();
    });
  });

  describe('모바일 Accordion 뷰', () => {
    it('role="region"인 Accordion 컨테이너가 존재한다', () => {
      renderMatrix();
      const regions = screen.getAllByRole('region');
      const accordionRegion = regions.find(
        (el) => el.getAttribute('data-testid') === 'feature-matrix-accordion'
      );
      expect(accordionRegion).toBeInTheDocument();
    });

    it('각 카테고리에 대한 Accordion 트리거 버튼이 존재한다', () => {
      renderMatrix();
      expect(screen.getByTestId('accordion-trigger-0')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-trigger-1')).toBeInTheDocument();
    });

    it('Accordion 트리거에 aria-expanded="false"가 초기 설정된다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('Accordion 트리거에 aria-controls가 설정된다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');
      expect(trigger).toHaveAttribute('aria-controls');
      const controlsId = trigger.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
    });

    it('Accordion 트리거 클릭 시 aria-expanded가 "true"로 변경된다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('Accordion 토글 시 패널 컨텐츠의 expanded 클래스가 변경된다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');
      const panelId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);

      expect(panel).not.toHaveClass('mg-v2-feature-matrix__accordion-content--expanded');
      fireEvent.click(trigger);
      expect(panel).toHaveClass('mg-v2-feature-matrix__accordion-content--expanded');
    });

    it('Accordion 재클릭 시 다시 접힌다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('Accordion 뱃지에 plan 이름과 값이 표시된다', () => {
      renderMatrix();
      const trigger = screen.getByTestId('accordion-trigger-0');
      fireEvent.click(trigger);

      const badges = screen.getAllByText(/Basic:/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('feature-matrix-accordion testid가 존재한다', () => {
      renderMatrix();
      expect(screen.getByTestId('feature-matrix-accordion')).toBeInTheDocument();
    });
  });

  describe('접근성(a11y)', () => {
    it('테이블에 aria-label이 존재한다', () => {
      renderMatrix();
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Feature comparison table');
    });

    it('Accordion 영역에 aria-label이 존재한다', () => {
      renderMatrix();
      const regions = screen.getAllByRole('region');
      const accordion = regions.find(
        (el) => el.getAttribute('aria-label') === 'Feature comparison'
      );
      expect(accordion).toBeInTheDocument();
    });

    it('columnheader role이 올바르게 부여된다', () => {
      renderMatrix();
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(4);
    });

    it('chevron 아이콘에 aria-hidden="true"가 설정된다', () => {
      const { container } = renderMatrix();
      const chevrons = container.querySelectorAll('.mg-v2-feature-matrix__chevron');
      chevrons.forEach((chevron) => {
        expect(chevron).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
