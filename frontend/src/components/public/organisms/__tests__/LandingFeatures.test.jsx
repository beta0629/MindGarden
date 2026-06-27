/**
 * LandingFeatures 단위 테스트
 *
 * Design v2 Refine v2 W3 — FeatureCard 기반으로 리팩터된 LandingFeatures organism.
 *  - 기본 렌더링 (디폴트 카드: 멀티 테넌트 격리 / 자동화 워크플로우 / 실시간 운영 분석)
 *  - 커스텀 featuresSlot 주입
 *  - 카드 아이콘/타이틀/설명 렌더링 (FeatureCard 사용)
 *  - 접근성 (section, aria-label, aria-hidden on icons)
 *  - mg-v2-landing-features / mg-v2-feature-card 클래스 사용 검증
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

const LandingFeatures = require('../LandingFeatures').default;

describe('LandingFeatures', () => {
  it('renders default features cards (B2B SaaS)', () => {
    render(<LandingFeatures />);
    expect(screen.getByText('멀티 테넌트 격리')).toBeInTheDocument();
    expect(screen.getByText('자동화 워크플로우')).toBeInTheDocument();
    expect(screen.getByText('실시간 운영 분석')).toBeInTheDocument();
  });

  it('renders custom features via featuresSlot prop', () => {
    const custom = [
      { key: 'a', icon: null, title: 'Feature A', description: 'Desc A' },
      { key: 'b', icon: null, title: 'Feature B', description: 'Desc B' },
    ];
    render(<LandingFeatures featuresSlot={custom} />);
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Desc B')).toBeInTheDocument();
  });

  it('renders default feature descriptions', () => {
    render(<LandingFeatures />);
    expect(screen.getByText('테넌트별 데이터·권한·도메인을 완벽 분리')).toBeInTheDocument();
  });

  it('renders icons with aria-hidden (FeatureCard)', () => {
    const { container } = render(<LandingFeatures />);
    const icons = container.querySelectorAll('.mg-v2-feature-card__icon');
    expect(icons.length).toBe(3);
    icons.forEach((icon) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('has accessible section with aria-label', () => {
    render(<LandingFeatures />);
    expect(screen.getByLabelText('Features')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-features class on wrapper', () => {
    const { container } = render(<LandingFeatures />);
    expect(container.querySelector('.mg-v2-landing-features')).toBeInTheDocument();
  });

  it('renders correct number of FeatureCard articles', () => {
    const custom = [
      { key: '1', title: 'One', description: 'D1' },
      { key: '2', title: 'Two', description: 'D2' },
      { key: '3', title: 'Three', description: 'D3' },
      { key: '4', title: 'Four', description: 'D4' },
    ];
    const { container } = render(<LandingFeatures featuresSlot={custom} />);
    const cards = container.querySelectorAll('.mg-v2-feature-card');
    expect(cards.length).toBe(4);
  });
});
