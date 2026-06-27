/**
 * HeroEyebrowChip 단위 테스트
 *
 * Design v2 Refine v2 W3 SPEC §3.2 / §9
 *  - children 텍스트 렌더링
 *  - 아이콘 슬롯(icon) 렌더링 + aria-hidden
 *  - ariaLabel 오버라이드
 *  - mg-v2-hero-eyebrow-chip 클래스 사용 검증
 *
 * @author CoreSolution
 * @since 2026-06-16
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

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

const HeroEyebrowChip = require('../HeroEyebrowChip').default;

describe('HeroEyebrowChip', () => {
  it('renders children text', () => {
    render(<HeroEyebrowChip>Multi-Tenant SaaS Platform</HeroEyebrowChip>);
    expect(screen.getByText('Multi-Tenant SaaS Platform')).toBeInTheDocument();
  });

  it('uses mg-v2-hero-eyebrow-chip class on root', () => {
    const { container } = render(<HeroEyebrowChip>Label</HeroEyebrowChip>);
    expect(container.querySelector('.mg-v2-hero-eyebrow-chip')).toBeInTheDocument();
  });

  it('renders icon slot with aria-hidden', () => {
    const { container } = render(
      <HeroEyebrowChip icon={<span data-testid="chip-icon">★</span>}>
        Label
      </HeroEyebrowChip>
    );
    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
    const iconWrap = container.querySelector('.mg-v2-hero-eyebrow-chip__icon');
    expect(iconWrap).toBeInTheDocument();
    expect(iconWrap.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies ariaLabel override on root', () => {
    render(
      <HeroEyebrowChip ariaLabel="Custom Eyebrow">
        Eyebrow Inner Text
      </HeroEyebrowChip>
    );
    expect(screen.getByLabelText('Custom Eyebrow')).toBeInTheDocument();
  });

  it('uses status role for assistive technologies', () => {
    render(<HeroEyebrowChip>Live status</HeroEyebrowChip>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
