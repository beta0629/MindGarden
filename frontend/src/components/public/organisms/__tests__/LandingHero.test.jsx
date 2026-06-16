/**
 * LandingHero 단위 테스트
 *
 * Design v2 Refine v2 W3 — 50/50 Hero + Eyebrow Chip + 2줄 H1(그라데이션) +
 * Primary/Secondary CTA + SocialProofLogos + DashboardPreview 슬롯.
 *
 *  - 기본 렌더링 (legacy titleSlot, subtitleSlot, primary/secondary CTA)
 *  - 2줄 타이틀 (titleLine1Slot + titleLine2Slot)
 *  - eyebrowSlot (string → HeroEyebrowChip 으로 래핑)
 *  - dashboardSlot 노드 주입
 *  - socialProofSlot 노드 주입
 *  - 버튼 클릭 콜백
 *  - 접근성 (aria-label, section)
 *  - mg-v2-* 클래스 사용 검증
 *
 * @author CoreSolution
 * @since 2026-06-16
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
  it('renders legacy default title and subtitle', () => {
    render(<LandingHero />);
    expect(screen.getByText('마음을 돌보는 가장 안정적인 공간')).toBeInTheDocument();
    expect(
      screen.getByText('상담 기록부터 예약 관리까지, 원장님을 위한 완벽한 솔루션')
    ).toBeInTheDocument();
  });

  it('renders custom titleSlot when titleLine slots are not provided', () => {
    render(<LandingHero titleSlot="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders 2-line gradient title via titleLine1Slot/titleLine2Slot', () => {
    render(
      <LandingHero
        titleLine1Slot="여러 테넌트, 하나의 플랫폼."
        titleLine2Slot="운영을 단순하게."
      />
    );
    expect(screen.getByText('여러 테넌트, 하나의 플랫폼.')).toBeInTheDocument();
    const gradient = screen
      .getByText('운영을 단순하게.')
      .closest('.mg-v2-landing-hero__title-line--gradient');
    expect(gradient).toBeInTheDocument();
  });

  it('renders eyebrow chip when eyebrowSlot is a string', () => {
    render(<LandingHero eyebrowSlot="Multi-Tenant SaaS Platform" />);
    expect(screen.getByText('Multi-Tenant SaaS Platform')).toBeInTheDocument();
  });

  it('renders primary and secondary CTA buttons by default', () => {
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
    render(<LandingHero secondaryCta={{ label: '데모 보기', onClick }} />);
    fireEvent.click(screen.getByText('데모 보기'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders hero image when heroImageSlot is a string (legacy)', () => {
    render(<LandingHero heroImageSlot="https://example.com/hero.png" />);
    const img = screen.getByAltText('Core Solution 대시보드');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/hero.png');
  });

  it('renders custom node when dashboardSlot is provided', () => {
    render(
      <LandingHero
        dashboardSlot={<div data-testid="dashboard-preview">dash</div>}
      />
    );
    expect(screen.getByTestId('dashboard-preview')).toBeInTheDocument();
  });

  it('renders socialProofSlot node', () => {
    render(
      <LandingHero
        socialProofSlot={<div data-testid="social-proof">200+ customers</div>}
      />
    );
    expect(screen.getByTestId('social-proof')).toBeInTheDocument();
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
