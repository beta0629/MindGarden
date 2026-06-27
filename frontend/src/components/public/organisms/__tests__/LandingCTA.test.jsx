/**
 * LandingCTA 단위 테스트
 *
 * - 기본 렌더링 (타이틀, 서브타이틀, 버튼)
 * - 슬롯 props 주입
 * - 버튼 클릭 콜백
 * - 접근성 (aria-label, section)
 * - mg-v2-* 클래스 사용 (다크 배경)
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

const LandingCTA = require('../LandingCTA').default;

describe('LandingCTA', () => {
  it('renders default title and subtitle', () => {
    render(<LandingCTA />);
    expect(screen.getByText('지금 바로 차원이 다른 상담 센터 관리를 경험해보세요.')).toBeInTheDocument();
    expect(screen.getByText('14일 무료 체험으로 모든 기능을 사용해볼 수 있습니다.')).toBeInTheDocument();
  });

  it('renders custom title via titleSlot prop', () => {
    render(<LandingCTA titleSlot="Custom CTA Title" />);
    expect(screen.getByText('Custom CTA Title')).toBeInTheDocument();
  });

  it('renders custom subtitle via subtitleSlot prop', () => {
    render(<LandingCTA subtitleSlot="Custom subtitle" />);
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });

  it('renders primary and secondary CTA buttons', () => {
    render(<LandingCTA />);
    expect(screen.getByText('무료로 시작하기')).toBeInTheDocument();
    expect(screen.getByText('도입 문의하기')).toBeInTheDocument();
  });

  it('calls primaryCta.onClick when primary button clicked', () => {
    const onClick = jest.fn();
    render(<LandingCTA primaryCta={{ label: 'Start', onClick }} />);
    fireEvent.click(screen.getByText('Start'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls secondaryCta.onClick when secondary button clicked', () => {
    const onClick = jest.fn();
    render(<LandingCTA secondaryCta={{ label: 'Contact', onClick }} />);
    fireEvent.click(screen.getByText('Contact'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has accessible section with aria-label', () => {
    render(<LandingCTA />);
    expect(screen.getByLabelText('Call to Action')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-cta class', () => {
    const { container } = render(<LandingCTA />);
    expect(container.querySelector('.mg-v2-landing-cta')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-cta__btn--primary class for primary button', () => {
    const { container } = render(<LandingCTA />);
    expect(container.querySelector('.mg-v2-landing-cta__btn--primary')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-cta__btn--secondary class for secondary button', () => {
    const { container } = render(<LandingCTA />);
    expect(container.querySelector('.mg-v2-landing-cta__btn--secondary')).toBeInTheDocument();
  });
});
