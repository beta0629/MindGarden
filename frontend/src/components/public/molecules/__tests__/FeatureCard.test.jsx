/**
 * FeatureCard 단위 테스트
 *
 * Design v2 Refine v2 W3 SPEC §3.4
 *  - icon / title / description 렌더링
 *  - 아이콘 컨테이너 aria-hidden
 *  - title 은 h3 시맨틱 태그
 *  - mg-v2-feature-card 클래스 사용 검증
 *  - testId 오버라이드
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

const FeatureCard = require('../FeatureCard').default;

describe('FeatureCard', () => {
  it('renders title and description', () => {
    render(
      <FeatureCard
        icon={<svg data-testid="card-icon" />}
        title="멀티 테넌트 격리"
        description="테넌트별 데이터·권한·도메인을 완벽 분리"
      />
    );
    expect(screen.getByText('멀티 테넌트 격리')).toBeInTheDocument();
    expect(screen.getByText('테넌트별 데이터·권한·도메인을 완벽 분리')).toBeInTheDocument();
  });

  it('renders icon slot inside aria-hidden container', () => {
    const { container } = render(
      <FeatureCard
        icon={<svg data-testid="card-icon" />}
        title="title"
        description="desc"
      />
    );
    expect(screen.getByTestId('card-icon')).toBeInTheDocument();
    const iconWrap = container.querySelector('.mg-v2-feature-card__icon');
    expect(iconWrap).toBeInTheDocument();
    expect(iconWrap.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses h3 semantic tag for title', () => {
    render(
      <FeatureCard
        title="Heading 3"
        description="desc"
      />
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Heading 3');
  });

  it('uses mg-v2-feature-card class on root', () => {
    const { container } = render(
      <FeatureCard title="t" description="d" />
    );
    expect(container.querySelector('.mg-v2-feature-card')).toBeInTheDocument();
  });

  it('applies testId override when provided', () => {
    render(
      <FeatureCard
        title="t"
        description="d"
        testId="feature-card-isolation"
      />
    );
    expect(screen.getByTestId('feature-card-isolation')).toBeInTheDocument();
  });
});
