/**
 * LandingTemplate 통합 테스트
 *
 * Design v2 Refine v2 W3 — Hero → Features → TrustBadgesGrid → CTA 4-섹션 조립.
 *  - 4종 컴포넌트 모두 렌더링 (trustBadgesProps 주입 시)
 *  - props 전달 검증 (heroProps, featuresProps, trustBadgesProps, ctaProps)
 *  - PublicErrorBoundary 섹션별 격리 확인
 *  - 기본 props 렌더링 (props 미전달 시 trust badges 미렌더)
 *  - 렌더 순서: Hero → Features → TrustBadgesGrid → CTA
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

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key, fallback) => (typeof fallback === 'string' ? fallback : key) }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('i18next-browser-languagedetector', () => ({
  __esModule: true,
  default: {
    type: 'languageDetector',
    init: jest.fn(),
    detect: () => 'ko',
    cacheUserLanguage: jest.fn()
  }
}));

jest.mock('../../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

/* PublicLayout mock — jest 팩토리 내 require('react') 사용 */
jest.mock('../../layouts/PublicLayout', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockPublicLayout({ children }) {
      return R.createElement('div', { 'data-testid': 'public-layout' }, children);
    }
  };
});

jest.mock('../../organisms/PublicErrorBoundary', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockPublicErrorBoundary({ children }) {
      return R.createElement('div', { 'data-testid': 'error-boundary' }, children);
    }
  };
});

jest.mock('../../organisms/LandingHero', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingHero(props) {
      return R.createElement(
        'section',
        { 'data-testid': 'landing-hero' },
        R.createElement('h1', null, props.titleSlot || props.titleLine1Slot || 'default-hero-title')
      );
    }
  };
});

jest.mock('../../organisms/LandingFeatures', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingFeatures(props) {
      return R.createElement(
        'section',
        { 'data-testid': 'landing-features' },
        R.createElement('span', null, (props.featuresSlot ? props.featuresSlot.length : 0) + ' features')
      );
    }
  };
});

jest.mock('../../molecules/TrustBadgesGrid', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockTrustBadgesGrid(props) {
      return R.createElement(
        'section',
        { 'data-testid': 'trust-badges' },
        R.createElement('span', null, (props.badges ? props.badges.length : 0) + ' badges')
      );
    }
  };
});

jest.mock('../../organisms/LandingCTA', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingCTA(props) {
      return R.createElement(
        'section',
        { 'data-testid': 'landing-cta' },
        R.createElement('h2', null, props.titleSlot || 'default-cta-title'),
        props.primaryCta &&
          R.createElement(
            'button',
            { type: 'button', onClick: props.primaryCta.onClick },
            props.primaryCta.label
          ),
        props.secondaryCta &&
          R.createElement(
            'button',
            { type: 'button', onClick: props.secondaryCta.onClick },
            props.secondaryCta.label
          )
      );
    }
  };
});

const LandingTemplate = require('../LandingTemplate').default;

describe('LandingTemplate', () => {
  it('renders PublicLayout wrapper', () => {
    render(<LandingTemplate />);
    expect(screen.getByTestId('public-layout')).toBeInTheDocument();
  });

  it('renders 3 sections by default (Hero, Features, CTA) when trustBadgesProps is null', () => {
    render(<LandingTemplate />);
    expect(screen.getByTestId('landing-hero')).toBeInTheDocument();
    expect(screen.getByTestId('landing-features')).toBeInTheDocument();
    expect(screen.queryByTestId('trust-badges')).not.toBeInTheDocument();
    expect(screen.getByTestId('landing-cta')).toBeInTheDocument();
  });

  it('renders trust badges when trustBadgesProps is provided', () => {
    render(
      <LandingTemplate
        trustBadgesProps={{ badges: ['iso27001', 'soc2'] }}
      />
    );
    expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
    expect(screen.getByText('2 badges')).toBeInTheDocument();
  });

  it('renders PublicErrorBoundary per section (3 by default, 4 with trust badges)', () => {
    const { rerender } = render(<LandingTemplate />);
    expect(screen.getAllByTestId('error-boundary')).toHaveLength(3);

    rerender(<LandingTemplate trustBadgesProps={{ badges: ['iso27001'] }} />);
    expect(screen.getAllByTestId('error-boundary')).toHaveLength(4);
  });

  it('passes heroProps.titleSlot to LandingHero', () => {
    render(<LandingTemplate heroProps={{ titleSlot: 'Custom Hero Title' }} />);
    expect(screen.getByText('Custom Hero Title')).toBeInTheDocument();
  });

  it('passes featuresProps.featuresSlot to LandingFeatures', () => {
    const features = [
      { key: 'a', icon: null, title: 'A', description: 'desc A' },
      { key: 'b', icon: null, title: 'B', description: 'desc B' }
    ];
    render(<LandingTemplate featuresProps={{ featuresSlot: features }} />);
    expect(screen.getByText('2 features')).toBeInTheDocument();
  });

  it('passes ctaProps.titleSlot to LandingCTA', () => {
    render(<LandingTemplate ctaProps={{ titleSlot: 'Custom CTA Title' }} />);
    expect(screen.getByText('Custom CTA Title')).toBeInTheDocument();
  });

  it('renders sections in order: Hero → Features → TrustBadgesGrid → CTA', () => {
    const { container } = render(
      <LandingTemplate trustBadgesProps={{ badges: ['iso27001'] }} />
    );
    const sections = container.querySelectorAll('[data-testid]');
    const testIds = Array.from(sections).map((el) => el.getAttribute('data-testid'));
    const heroIdx = testIds.indexOf('landing-hero');
    const featuresIdx = testIds.indexOf('landing-features');
    const trustIdx = testIds.indexOf('trust-badges');
    const ctaIdx = testIds.indexOf('landing-cta');
    expect(heroIdx).toBeLessThan(featuresIdx);
    expect(featuresIdx).toBeLessThan(trustIdx);
    expect(trustIdx).toBeLessThan(ctaIdx);
  });

  it('uses mg-v2-landing-template class on wrapper', () => {
    const { container } = render(<LandingTemplate />);
    expect(container.querySelector('.mg-v2-landing-template')).toBeInTheDocument();
  });
});
