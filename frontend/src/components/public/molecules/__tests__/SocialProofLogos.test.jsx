/**
 * SocialProofLogos 단위 테스트
 *
 * Design v2 Refine v2 W3 SPEC §3.2
 *  - 기본 로고 5개 (ACME / Globex / INITECH / Umbrella / CYBERDYNE) 렌더링
 *  - label 슬롯 렌더링
 *  - logos 빈 배열일 때 null 반환 (렌더 없음)
 *  - 커스텀 src 사용
 *  - 접근성 (img alt 사용)
 *  - mg-v2-social-proof 클래스 사용 검증
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

const SocialProofLogos = require('../SocialProofLogos').default;

describe('SocialProofLogos', () => {
  it('renders default 5 logos', () => {
    render(<SocialProofLogos />);
    expect(screen.getByAltText('ACME')).toBeInTheDocument();
    expect(screen.getByAltText('Globex')).toBeInTheDocument();
    expect(screen.getByAltText('INITECH')).toBeInTheDocument();
    expect(screen.getByAltText('Umbrella')).toBeInTheDocument();
    expect(screen.getByAltText('CYBERDYNE')).toBeInTheDocument();
  });

  it('renders label slot when provided', () => {
    render(<SocialProofLogos label="현재 200+ 기업이 사용 중" />);
    expect(screen.getByText('현재 200+ 기업이 사용 중')).toBeInTheDocument();
  });

  it('returns null when logos array is empty', () => {
    const { container } = render(<SocialProofLogos logos={[]} />);
    expect(container.querySelector('.mg-v2-social-proof')).toBeNull();
  });

  it('uses custom src when provided in logo entry', () => {
    render(
      <SocialProofLogos
        logos={[{ key: 'custom', name: 'Custom', src: 'https://example.com/logo.svg' }]}
      />
    );
    const img = screen.getByAltText('Custom');
    expect(img).toHaveAttribute('src', 'https://example.com/logo.svg');
  });

  it('uses mg-v2-social-proof class on root', () => {
    const { container } = render(<SocialProofLogos />);
    expect(container.querySelector('.mg-v2-social-proof')).toBeInTheDocument();
  });

  it('exposes group aria-label', () => {
    render(<SocialProofLogos listAriaLabel="Customer Logos" />);
    expect(screen.getByLabelText('Customer Logos')).toBeInTheDocument();
  });
});
