/**
 * TrustBadges 단위 테스트 (Refine v2 W2)
 *
 * @author MindGarden
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
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

const TrustBadges = require('../TrustBadges').default;

describe('TrustBadges', () => {
  it('기본 4개 배지가 렌더링된다 (ISO 27001 / SOC 2 / GDPR / KISA-ISMS)', () => {
    render(<TrustBadges />);
    expect(screen.getByTestId('trust-badge-iso27001')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-soc2')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-gdpr')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-kisaIsms')).toBeInTheDocument();
  });

  it('각 배지의 라벨이 표시된다', () => {
    render(<TrustBadges />);
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('SOC 2')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
    expect(screen.getByText('KISA-ISMS')).toBeInTheDocument();
  });

  it('루트 ul 에 mg-v2-trust-badges 클래스가 있다', () => {
    const { container } = render(<TrustBadges />);
    const root = container.querySelector('ul.mg-v2-trust-badges');
    expect(root).toBeInTheDocument();
  });

  it('badgeKeys prop 으로 일부 키만 노출 가능', () => {
    render(<TrustBadges badgeKeys={['gdpr', 'soc2']} />);
    expect(screen.getByTestId('trust-badge-gdpr')).toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-soc2')).toBeInTheDocument();
    expect(screen.queryByTestId('trust-badge-iso27001')).not.toBeInTheDocument();
    expect(screen.queryByTestId('trust-badge-kisaIsms')).not.toBeInTheDocument();
  });

  it('알 수 없는 키는 무시된다 (null 렌더)', () => {
    render(<TrustBadges badgeKeys={['unknown-badge', 'gdpr']} />);
    expect(screen.queryByTestId('trust-badge-unknown-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('trust-badge-gdpr')).toBeInTheDocument();
  });
});
