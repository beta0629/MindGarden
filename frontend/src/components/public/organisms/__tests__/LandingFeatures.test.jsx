/**
 * LandingFeatures 단위 테스트
 *
 * - 기본 렌더링 (디폴트 카드)
 * - 커스텀 featuresSlot 주입
 * - 카드 아이콘·타이틀·설명 렌더링
 * - 접근성 (section, aria-label, aria-hidden on icons)
 * - mg-v2-* 클래스 사용 검증
 *
 * @author MindGarden
 * @since 2026-06-15
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
  it('renders default features cards', () => {
    render(<LandingFeatures />);
    expect(screen.getByText('스마트 예약 관리')).toBeInTheDocument();
    expect(screen.getByText('안전한 상담 기록')).toBeInTheDocument();
    expect(screen.getByText('자동 정산 시스템')).toBeInTheDocument();
  });

  it('renders custom features via featuresSlot prop', () => {
    const custom = [
      { icon: '🎯', title: 'Feature A', description: 'Desc A' },
      { icon: '🚀', title: 'Feature B', description: 'Desc B' },
    ];
    render(<LandingFeatures featuresSlot={custom} />);
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Desc B')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<LandingFeatures />);
    expect(screen.getByText('노쇼를 방지하는 자동 알림과 캘린더 연동')).toBeInTheDocument();
  });

  it('renders icons with aria-hidden', () => {
    const { container } = render(<LandingFeatures />);
    const icons = container.querySelectorAll('.mg-v2-landing-features__card-icon');
    icons.forEach(icon => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('has accessible section with aria-label', () => {
    render(<LandingFeatures />);
    expect(screen.getByLabelText('Features')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-features class', () => {
    const { container } = render(<LandingFeatures />);
    expect(container.querySelector('.mg-v2-landing-features')).toBeInTheDocument();
  });

  it('renders correct number of cards', () => {
    const custom = [
      { icon: '1', title: 'One', description: 'D1' },
      { icon: '2', title: 'Two', description: 'D2' },
      { icon: '3', title: 'Three', description: 'D3' },
      { icon: '4', title: 'Four', description: 'D4' },
    ];
    const { container } = render(<LandingFeatures featuresSlot={custom} />);
    const cards = container.querySelectorAll('.mg-v2-landing-features__card');
    expect(cards.length).toBe(4);
  });
});
