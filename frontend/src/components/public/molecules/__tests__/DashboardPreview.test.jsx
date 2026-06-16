/**
 * DashboardPreview 단위 테스트
 *
 * Design v2 Refine v2 W3 SPEC §3.3 / §9 / §12
 *  - 기본 자산(번들 SVG) 렌더링
 *  - src/alt 오버라이드 적용
 *  - caption 렌더링
 *  - mg-v2-dashboard-preview 클래스 사용 검증
 *  - 접근성 (figure + img alt)
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

const DashboardPreview = require('../DashboardPreview').default;

describe('DashboardPreview', () => {
  it('renders default img with alt text', () => {
    render(<DashboardPreview />);
    const img = screen.getByAltText('Core Solution Dashboard Preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('applies custom src and alt props', () => {
    render(
      <DashboardPreview
        src="https://example.com/dashboard.svg"
        alt="Custom Preview"
      />
    );
    const img = screen.getByAltText('Custom Preview');
    expect(img).toHaveAttribute('src', 'https://example.com/dashboard.svg');
  });

  it('renders caption when provided', () => {
    render(<DashboardPreview caption="대시보드 미리보기" />);
    expect(screen.getByText('대시보드 미리보기')).toBeInTheDocument();
  });

  it('uses mg-v2-dashboard-preview class on root figure', () => {
    const { container } = render(<DashboardPreview />);
    const figure = container.querySelector('figure.mg-v2-dashboard-preview');
    expect(figure).toBeInTheDocument();
  });

  it('uses lazy loading by default', () => {
    render(<DashboardPreview />);
    const img = screen.getByAltText('Core Solution Dashboard Preview');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('supports eager loading via prop', () => {
    render(<DashboardPreview loading="eager" alt="Eager" />);
    const img = screen.getByAltText('Eager');
    expect(img).toHaveAttribute('loading', 'eager');
  });
});
