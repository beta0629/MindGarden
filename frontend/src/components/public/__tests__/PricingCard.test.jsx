/**
 * PricingCard 단위 테스트
 *
 * - 기본 카드 렌더링 (이름, 가격, 기능 목록, CTA)
 * - Highlighted (추천) 상태
 * - Enterprise (Custom 가격) 상태
 * - mg-v2-* 토큰 클래스 사용 검증
 * - 접근성 (aria-label)
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

const PricingCard = require('../molecules/PricingCard').default;

const defaultProps = {
  planKey: 'basic',
  nameLabel: 'Basic',
  price: '49,000',
  priceUnit: '₩',
  pricePeriod: 'mo',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  ctaLabel: 'Get Started',
  ctaTo: '/onboarding',
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <PricingCard {...defaultProps} {...props} />
    </MemoryRouter>
  );

describe('PricingCard', () => {
  it('renders plan name', () => {
    renderCard();
    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('renders price with unit and period', () => {
    renderCard();
    expect(screen.getByText('49,000')).toBeInTheDocument();
    expect(screen.getByText('₩')).toBeInTheDocument();
    expect(screen.getByText('/mo')).toBeInTheDocument();
  });

  it('renders feature list', () => {
    renderCard();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });

  it('renders CTA button with correct text', () => {
    renderCard();
    const cta = screen.getByText('Get Started');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/onboarding');
  });

  it('applies highlighted class when isHighlighted', () => {
    const { container } = renderCard({ isHighlighted: true });
    expect(container.querySelector('.mg-v2-pricing-card--highlighted')).toBeInTheDocument();
  });

  it('shows recommended badge when highlighted', () => {
    renderCard({ isHighlighted: true });
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('shows Custom price for enterprise plan', () => {
    renderCard({ isEnterprise: true, price: null });
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('uses mg-v2-pricing-card class', () => {
    const { container } = renderCard();
    expect(container.querySelector('.mg-v2-pricing-card')).toBeInTheDocument();
  });

  it('has accessible article with aria-label', () => {
    renderCard();
    expect(screen.getByLabelText('Basic plan')).toBeInTheDocument();
  });

  it('renders feature icons with aria-hidden', () => {
    const { container } = renderCard();
    const icons = container.querySelectorAll('.mg-v2-pricing-card__feature-icon');
    expect(icons.length).toBe(3);
    icons.forEach(icon => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
