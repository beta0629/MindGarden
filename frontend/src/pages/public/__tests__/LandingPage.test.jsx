/**
 * LandingPage 통합 테스트
 *
 * Design v2 Refine v2 W3 — Multi-Tenant SaaS Platform 카피 + Hero/Trust/CTA 슬롯 주입.
 *
 * 사용자 시나리오:
 *  - Hero Primary CTA → /onboarding
 *  - Hero Secondary CTA (데모 보기) → /onboarding
 *  - Bottom Primary CTA → /onboarding
 *  - Bottom Secondary CTA (도입 문의) → /onboarding
 *  - SEO meta: react-helmet document.title 확인 ("Core Solution" 포함)
 *  - i18n fallback 텍스트 렌더 확인 (eyebrow / titleLine / CTA)
 *  - LandingTemplate 렌더 확인
 *  - trustBadgesProps 전달 확인
 *
 * useNavigate mock: 변수 이름이 'mock' 접두사이면 jest.mock factory에서 참조 가능.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();

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

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key)
  }),
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

jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

/* LandingTemplate mock — heroProps/trustBadgesProps/ctaProps 만 노출 */
jest.mock('../../../components/public/templates/LandingTemplate', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingTemplate(props) {
      var heroProps = props.heroProps || {};
      var ctaProps = props.ctaProps || {};
      var trustBadgesProps = props.trustBadgesProps || null;
      return R.createElement(
        'div',
        { 'data-testid': 'landing-template' },
        R.createElement(
          'section',
          { 'data-testid': 'hero-section' },
          heroProps.titleLine1Slot &&
            R.createElement('h1', { 'data-testid': 'hero-title-line-1' }, heroProps.titleLine1Slot),
          heroProps.titleLine2Slot &&
            R.createElement('h1', { 'data-testid': 'hero-title-line-2' }, heroProps.titleLine2Slot),
          heroProps.primaryCta &&
            R.createElement(
              'button',
              {
                type: 'button',
                'data-testid': 'hero-primary-cta',
                onClick: heroProps.primaryCta.onClick
              },
              heroProps.primaryCta.label
            ),
          heroProps.secondaryCta &&
            R.createElement(
              'button',
              {
                type: 'button',
                'data-testid': 'hero-secondary-cta',
                onClick: heroProps.secondaryCta.onClick
              },
              heroProps.secondaryCta.label
            )
        ),
        trustBadgesProps &&
          R.createElement(
            'section',
            { 'data-testid': 'trust-section' },
            R.createElement(
              'span',
              { 'data-testid': 'trust-count' },
              (trustBadgesProps.badges || []).length + ' badges'
            )
          ),
        R.createElement(
          'section',
          { 'data-testid': 'cta-section' },
          ctaProps.primaryCta &&
            R.createElement(
              'button',
              {
                type: 'button',
                'data-testid': 'bottom-primary-cta',
                onClick: ctaProps.primaryCta.onClick
              },
              ctaProps.primaryCta.label
            ),
          ctaProps.secondaryCta &&
            R.createElement(
              'button',
              {
                type: 'button',
                'data-testid': 'bottom-secondary-cta',
                onClick: ctaProps.secondaryCta.onClick
              },
              ctaProps.secondaryCta.label
            )
        )
      );
    }
  };
});

let LandingPage;

beforeAll(() => {
  LandingPage = require('../LandingPage').default;
});

const { MemoryRouter } = require('react-router-dom');

const renderWithRouter = (ui) =>
  render(React.createElement(MemoryRouter, { initialEntries: ['/landing'] }, ui));

describe('LandingPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    document.title = '';
  });

  it('renders LandingTemplate', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('landing-template')).toBeInTheDocument();
  });

  it('renders hero / trust / CTA sections', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('trust-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
  });

  it('Hero Primary CTA 클릭 시 /onboarding 으로 navigate', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('hero-primary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('Hero Secondary CTA(데모 보기) 클릭 시 /onboarding 으로 navigate', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('hero-secondary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('Bottom Primary CTA 클릭 시 /onboarding 으로 navigate', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('bottom-primary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('Bottom Secondary CTA 클릭 시 /onboarding 으로 navigate (도입 문의)', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('bottom-secondary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('SEO meta: react-helmet이 title에 Core Solution 을 포함', () => {
    renderWithRouter(React.createElement(LandingPage));
    const { Helmet } = require('react-helmet');
    const helmetState = Helmet.peek();
    expect(helmetState.title).toContain('Core Solution');
    expect(helmetState.title).toMatch(/Multi-Tenant SaaS Platform/i);
  });

  it('Hero 2줄 제목 슬롯이 모두 렌더됨', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('hero-title-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('hero-title-line-2')).toBeInTheDocument();
  });

  it('CTA Primary 버튼 텍스트가 i18n fallback (Get Started Free) 으로 렌더됨', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getAllByText('Get Started Free').length).toBeGreaterThanOrEqual(1);
  });

  it('Trust 배지 4개가 props 로 전달됨', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('trust-count')).toHaveTextContent('4 badges');
  });
});
