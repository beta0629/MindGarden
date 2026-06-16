/**
 * LandingTestimonials 단위 테스트
 *
 * - 기본 렌더링 (Stats + Carousel)
 * - Carousel 일시정지 동작
 * - 키보드 네비게이션 (좌우 화살표)
 * - aria-live, aria-roledescription
 * - 슬롯 props 주입
 * - mg-v2-* 클래스 사용 검증
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

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

const LandingTestimonials = require('../LandingTestimonials').default;

describe('LandingTestimonials', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders default stats', () => {
    render(<LandingTestimonials />);
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('도입 센터')).toBeInTheDocument();
    expect(screen.getByText('12,000+')).toBeInTheDocument();
  });

  it('renders custom stats via statsSlot', () => {
    const stats = [{ label: 'Custom Stat', value: '999' }];
    render(<LandingTestimonials statsSlot={stats} />);
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('Custom Stat')).toBeInTheDocument();
  });

  it('renders testimonials content', () => {
    render(<LandingTestimonials />);
    expect(screen.getByText(/코어 솔루션 도입 후 행정 업무가 절반으로 줄었습니다/)).toBeInTheDocument();
  });

  it('renders custom testimonials via testimonialsSlot', () => {
    const testimonials = [
      { content: 'Test review', author: 'Tester', avatar: null },
    ];
    render(<LandingTestimonials testimonialsSlot={testimonials} />);
    expect(screen.getByText(/Test review/)).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
  });

  it('has carousel with aria-roledescription', () => {
    const { container } = render(<LandingTestimonials />);
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    expect(carousel).toBeInTheDocument();
  });

  it('has aria-live="polite" on track', () => {
    const { container } = render(<LandingTestimonials />);
    const track = container.querySelector('.mg-v2-landing-testimonials__track');
    expect(track.getAttribute('aria-live')).toBe('polite');
  });

  it('pauses autoplay on pause button click', () => {
    render(<LandingTestimonials autoPlayMs={1000} />);
    const pauseBtn = screen.getByLabelText('일시정지');
    fireEvent.click(pauseBtn);
    expect(screen.getByLabelText('자동 재생')).toBeInTheDocument();
  });

  it('navigates to next slide with right arrow key', () => {
    const { container } = render(<LandingTestimonials />);
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    const track = container.querySelector('.mg-v2-landing-testimonials__track');
    expect(track.style.transform).toContain('translateX');
  });

  it('navigates to previous slide with left arrow key', () => {
    const { container } = render(<LandingTestimonials />);
    const carousel = container.querySelector('[aria-roledescription="carousel"]');
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    const track = container.querySelector('.mg-v2-landing-testimonials__track');
    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('auto-advances slides after autoPlayMs', () => {
    const { container } = render(<LandingTestimonials autoPlayMs={2000} />);
    const track = container.querySelector('.mg-v2-landing-testimonials__track');
    expect(track.style.transform).toBe('translateX(-0%)');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(track.style.transform).not.toBe('translateX(-0%)');
  });

  it('renders prev/next/pause controls', () => {
    render(<LandingTestimonials />);
    expect(screen.getByLabelText('이전 후기')).toBeInTheDocument();
    expect(screen.getByLabelText('다음 후기')).toBeInTheDocument();
    expect(screen.getByLabelText('일시정지')).toBeInTheDocument();
  });

  it('uses mg-v2-landing-testimonials class', () => {
    const { container } = render(<LandingTestimonials />);
    expect(container.querySelector('.mg-v2-landing-testimonials')).toBeInTheDocument();
  });

  it('has accessible section with aria-label', () => {
    render(<LandingTestimonials />);
    expect(screen.getByLabelText('Testimonials')).toBeInTheDocument();
  });
});
