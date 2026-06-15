/**
 * LandingHero 단위 테스트
 *
 * - 기본 렌더링 (타이틀, 서브타이틀, CTA)
 * - 슬롯 props 주입
 * - 버튼 클릭 콜백
 * - 접근성 (aria-label, section)
 * - mg-v2-* 클래스 사용 검증
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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

const LandingHero = require('../LandingHero').default;

describe('LandingHero', () => {
  it('renders default title and subtitle', () => {
    render(<LandingHero />);
    expect(screen.getByText('마음을 돌보는 가장 안정적인 공간')).toBeInTheDocument();
    expect(screen.getByText('상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션')).toBeInTheDocument();
  });

  it('renders custom title via titleSlot prop', () => {
    render(<LandingHero titleSlot="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders primary and secondary CTA buttons', () => {
    render(<LandingHero />);
    expect(screen.getByText('무료로 시작하기')).toBeInTheDocument();
    expect(screen.getByText('요금제 보기')).toBeInTheDocument();
  });

  it('calls primaryCta.onClick when primary button clicked', () => {
    const onClick = jest.fn();
    render(<LandingHero primaryCta={{ label: 'Start', onClick }} />);
    fireEvent.click(screen.getByText('Start'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls secondaryCta.onClick when secondary button clicked', () => {
    const onClick = jest.fn();
    render(<LandingHero secondaryCta={{ label: 'Pricing', onClick }} />);
    fireEvent.click(screen.getByText('Pricing'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders hero image when heroImageSlot is a string', () => {
    render(<LandingHero heroImageSlot="https://example.com/hero.png" />);
    const img = screen.getByAltText('MindGarden 대시보드');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/hero.png');
  });

  it('renders custom node when heroImageSlot is a React element', () => {
    render(<LandingHero heroImageSlot={<div data-testid="custom-hero">Custom</div>} />);
    expect(screen.getByTestId('custom-hero')).toBeInTheDocument();
  });

  it('has accessible section with aria-label', () => {
    render(<LandingHero />);
    expect(screen.getByLabelText('Hero')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-hero class', () => {
    const { container } = render(<LandingHero />);
    expect(container.querySelector('.mg-v2-landing-hero')).toBeInTheDocument();
  });
});
