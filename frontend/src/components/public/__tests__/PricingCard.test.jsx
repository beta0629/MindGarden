/**
 * PricingCard 단위 테스트 (Refine v2)
 *
 * Backwards-compat: 기존 props (price/priceUnit/pricePeriod/isHighlighted/isEnterprise) 보존.
 * 추가 검증: variant, badgeLabel, subText, iconKey.
 *
 * @author MindGarden
 * @since 2026-06-16
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
  planKey: 'starter',
  nameLabel: 'Starter',
  price: '29,000',
  priceUnit: '₩',
  pricePeriod: '월',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  ctaLabel: '시작하기',
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
    expect(screen.getByText('Starter')).toBeInTheDocument();
  });

  it('renders price with unit and period', () => {
    renderCard();
    expect(screen.getByText('29,000')).toBeInTheDocument();
    expect(screen.getByText('₩')).toBeInTheDocument();
    expect(screen.getByText('/월')).toBeInTheDocument();
  });

  it('renders feature list', () => {
    renderCard();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });

  it('renders CTA link with ctaTo when no onClick', () => {
    renderCard();
    const cta = screen.getByText('시작하기');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/onboarding');
  });

  it('renders CTA as button when ctaOnClick provided', () => {
    const handleClick = jest.fn();
    renderCard({ ctaOnClick: handleClick, ctaLabel: '영업팀 문의' });
    const cta = screen.getByText('영업팀 문의');
    expect(cta.closest('button')).toBeInTheDocument();
  });

  it('applies highlighted/popular variant class when isHighlighted', () => {
    const { container } = renderCard({ isHighlighted: true });
    expect(container.querySelector('.mg-v2-pricing-card--highlighted')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-pricing-card--popular')).toBeInTheDocument();
  });

  it('shows recommended badge fallback when highlighted without explicit badge', () => {
    renderCard({ isHighlighted: true });
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('shows custom badgeLabel when provided', () => {
    renderCard({ badgeLabel: '가장 인기' });
    expect(screen.getByText('가장 인기')).toBeInTheDocument();
  });

  it('shows custom price for enterprise plan with null price', () => {
    renderCard({ isEnterprise: true, price: null });
    expect(screen.getByText('맞춤 견적')).toBeInTheDocument();
  });

  it('applies enterprise-dark variant class when isEnterprise', () => {
    const { container } = renderCard({ isEnterprise: true, price: null });
    expect(
      container.querySelector('.mg-v2-pricing-card--enterprise-dark')
    ).toBeInTheDocument();
  });

  it('explicit variant prop overrides backwards-compat resolution', () => {
    const { container } = renderCard({
      variant: 'enterprise-dark',
      isHighlighted: false,
      isEnterprise: false,
    });
    expect(container.querySelector('.mg-v2-pricing-card--enterprise-dark')).toBeInTheDocument();
  });

  it('renders subText when provided', () => {
    renderCard({ subText: '30일 무료 체험' });
    expect(screen.getByText('30일 무료 체험')).toBeInTheDocument();
  });

  it('renders plan icon when iconKey provided', () => {
    renderCard({ iconKey: 'starter' });
    expect(screen.getByTestId('pricing-plan-icon-starter')).toBeInTheDocument();
  });

  it('uses mg-v2-pricing-card class', () => {
    const { container } = renderCard();
    expect(container.querySelector('.mg-v2-pricing-card')).toBeInTheDocument();
  });

  it('has accessible article with aria-label', () => {
    renderCard();
    expect(screen.getByLabelText('Starter plan')).toBeInTheDocument();
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
