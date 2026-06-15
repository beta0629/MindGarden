/**
 * LandingPage 통합 테스트
 *
 * 사용자 시나리오:
 * - Hero Primary CTA 클릭 → /onboarding 라우팅
 * - Hero Secondary CTA 클릭 → /pricing 라우팅
 * - Bottom Primary CTA 클릭 → /onboarding 라우팅
 * - Bottom Secondary CTA 클릭 → /onboarding 라우팅 (도입 문의)
 * - SEO meta: react-helmet document.title 확인
 * - i18n fallback 텍스트 렌더 확인
 * - LandingTemplate 렌더 확인
 *
 * useNavigate mock 전략:
 * - 변수 이름이 'mock' 접두사이면 jest.mock factory에서 참조 가능 (Jest 허용)
 * - jest.mock('react-router-dom', factory) 에서 useNavigate를 교체
 *
 * @author MindGarden
 * @since 2026-06-16
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

/* mockNavigate: 'mock' 접두사로 jest.mock factory 내 참조 허용 */
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

/* LandingTemplate mock — jest 팩토리 내 require 사용 */
jest.mock('../../../components/public/templates/LandingTemplate', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: function MockLandingTemplate(props) {
      var heroProps = props.heroProps || {};
      var ctaProps = props.ctaProps || {};
      return R.createElement(
        'div',
        { 'data-testid': 'landing-template' },
        R.createElement(
          'section',
          { 'data-testid': 'hero-section' },
          R.createElement('h1', null, heroProps.titleSlot),
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

/* LandingPage — 지연 require (모든 mock 등록 완료 후) */
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

  it('renders hero section', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
  });

  it('Hero Primary CTA 클릭 시 /onboarding 으로 navigate', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('hero-primary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('Hero Secondary CTA 클릭 시 /pricing 으로 navigate', () => {
    renderWithRouter(React.createElement(LandingPage));
    fireEvent.click(screen.getByTestId('hero-secondary-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/pricing');
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

  it('SEO meta: react-helmet이 title을 랜딩 페이지 타이틀로 설정', () => {
    renderWithRouter(React.createElement(LandingPage));
    /* react-helmet v6: Helmet.peek()으로 현재 head 상태 확인 (jsdom에서 DOM 직접 확인 대체) */
    const { Helmet } = require('react-helmet');
    const helmetState = Helmet.peek();
    expect(helmetState.title).toContain('MindGarden');
  });

  it('Hero 제목이 i18n fallback 텍스트로 렌더됨', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getByText('MindGarden for Counseling Centers')).toBeInTheDocument();
  });

  it('CTA Primary 버튼 텍스트가 i18n fallback으로 렌더됨', () => {
    renderWithRouter(React.createElement(LandingPage));
    expect(screen.getAllByText('Get Started Free').length).toBeGreaterThanOrEqual(1);
  });
});
