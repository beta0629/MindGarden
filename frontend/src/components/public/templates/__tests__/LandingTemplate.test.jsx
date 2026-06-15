/**
 * LandingTemplate 통합 테스트
 *
 * - 4종 Organism(Hero/Features/Testimonials/CTA) 모두 렌더링
 * - props 전달 검증 (heroProps, featuresProps, testimonialsProps, ctaProps)
 * - PublicErrorBoundary 섹션별 격리 확인 (4개)
 * - 기본 props 렌더링 (props 미전달 시 기본값)
 * - 렌더 순서: Hero → Features → Testimonials → CTA
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
        R.createElement('h1', null, props.titleSlot || 'default-hero-title')
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

jest.mock('../../organisms/LandingTestimonials', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingTestimonials(props) {
      return R.createElement(
        'section',
        { 'data-testid': 'landing-testimonials' },
        R.createElement('span', null, (props.testimonialsSlot ? props.testimonialsSlot.length : 0) + ' testimonials')
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

  it('renders all 4 Organisms (Hero, Features, Testimonials, CTA)', () => {
    render(<LandingTemplate />);
    expect(screen.getByTestId('landing-hero')).toBeInTheDocument();
    expect(screen.getByTestId('landing-features')).toBeInTheDocument();
    expect(screen.getByTestId('landing-testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('landing-cta')).toBeInTheDocument();
  });

  it('renders 4 PublicErrorBoundary sections (one per Organism)', () => {
    render(<LandingTemplate />);
    const boundaries = screen.getAllByTestId('error-boundary');
    expect(boundaries).toHaveLength(4);
  });

  it('passes heroProps.titleSlot to LandingHero', () => {
    render(<LandingTemplate heroProps={{ titleSlot: 'Custom Hero Title' }} />);
    expect(screen.getByText('Custom Hero Title')).toBeInTheDocument();
  });

  it('passes featuresProps.featuresSlot to LandingFeatures', () => {
    const features = [
      { icon: '🔒', title: 'A', description: 'desc A' },
      { icon: '📅', title: 'B', description: 'desc B' }
    ];
    render(<LandingTemplate featuresProps={{ featuresSlot: features }} />);
    expect(screen.getByText('2 features')).toBeInTheDocument();
  });

  it('passes testimonialsProps.testimonialsSlot to LandingTestimonials', () => {
    const testimonials = [
      { content: 'Great!', author: 'Author 1', avatar: null },
      { content: 'Awesome!', author: 'Author 2', avatar: null }
    ];
    render(<LandingTemplate testimonialsProps={{ testimonialsSlot: testimonials }} />);
    expect(screen.getByText('2 testimonials')).toBeInTheDocument();
  });

  it('passes ctaProps.titleSlot to LandingCTA', () => {
    render(<LandingTemplate ctaProps={{ titleSlot: 'Custom CTA Title' }} />);
    expect(screen.getByText('Custom CTA Title')).toBeInTheDocument();
  });

  it('renders organisms in order: Hero → Features → Testimonials → CTA', () => {
    const { container } = render(<LandingTemplate />);
    const sections = container.querySelectorAll('[data-testid]');
    const testIds = Array.from(sections).map((el) => el.getAttribute('data-testid'));
    const heroIdx = testIds.indexOf('landing-hero');
    const featuresIdx = testIds.indexOf('landing-features');
    const testimonialsIdx = testIds.indexOf('landing-testimonials');
    const ctaIdx = testIds.indexOf('landing-cta');
    expect(heroIdx).toBeLessThan(featuresIdx);
    expect(featuresIdx).toBeLessThan(testimonialsIdx);
    expect(testimonialsIdx).toBeLessThan(ctaIdx);
  });

  it('uses mg-v2-landing-template class on wrapper', () => {
    const { container } = render(<LandingTemplate />);
    expect(container.querySelector('.mg-v2-landing-template')).toBeInTheDocument();
  });
});
