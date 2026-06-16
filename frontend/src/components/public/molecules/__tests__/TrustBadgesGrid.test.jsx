/**
 * TrustBadgesGrid 단위 테스트
 *
 * Design v2 Refine v2 W3 — Landing 인증 배지 인라인 SVG 컴포넌트.
 *  - 기본 4개 배지(ISO 27001/SOC 2/GDPR/KISA-ISMS) 렌더링
 *  - heading 슬롯 렌더링
 *  - labels 오버라이드 적용
 *  - badges 배열로 표시 항목 제어
 *  - 접근성 (aria-label, role="img" on SVG)
 *  - mg-v2-trust-badges-grid 클래스 사용 검증
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

const TrustBadgesGrid = require('../TrustBadgesGrid').default;

describe('TrustBadgesGrid', () => {
  it('renders default 4 badges (ISO 27001 / SOC 2 / GDPR / KISA-ISMS)', () => {
    render(<TrustBadgesGrid />);
    expect(screen.getByLabelText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByLabelText('SOC 2')).toBeInTheDocument();
    expect(screen.getByLabelText('GDPR')).toBeInTheDocument();
    expect(screen.getByLabelText('KISA-ISMS')).toBeInTheDocument();
  });

  it('renders heading when provided', () => {
    render(<TrustBadgesGrid heading="Trusted Security & Compliance" />);
    expect(screen.getByText('Trusted Security & Compliance')).toBeInTheDocument();
  });

  it('renders only the badges listed in props.badges', () => {
    render(<TrustBadgesGrid badges={['iso27001', 'gdpr']} />);
    expect(screen.getByLabelText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByLabelText('GDPR')).toBeInTheDocument();
    expect(screen.queryByLabelText('SOC 2')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('KISA-ISMS')).not.toBeInTheDocument();
  });

  it('applies labels override', () => {
    render(
      <TrustBadgesGrid
        badges={['iso27001']}
        labels={{ iso27001: 'ISO/IEC 27001' }}
      />
    );
    expect(screen.getByLabelText('ISO/IEC 27001')).toBeInTheDocument();
  });

  it('exposes section aria-label', () => {
    render(<TrustBadgesGrid ariaLabel="Compliance Badges" />);
    expect(screen.getByLabelText('Compliance Badges')).toBeInTheDocument();
  });

  it('uses mg-v2-trust-badges-grid class on section', () => {
    const { container } = render(<TrustBadgesGrid />);
    expect(container.querySelector('.mg-v2-trust-badges-grid')).toBeInTheDocument();
  });

  it('renders an SVG with role="img" per badge', () => {
    const { container } = render(<TrustBadgesGrid />);
    const svgs = container.querySelectorAll('svg[role="img"]');
    expect(svgs.length).toBe(4);
  });
});
