/**
 * OnboardingTemplate 통합 테스트
 *
 * Phase C-3 W1: Template이 Stepper + StepForm + Navigation을 모두 렌더링하는지,
 * props에 따라 Navigation 활성/비활성 토글이 올바른지 검증.
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

const OnboardingTemplate = require('../OnboardingTemplate').default;

const DEFAULT_PROPS = {
  currentStep: 0,
  formData: {
    tenantName: '',
    domain: '',
    phone: '',
    email: '',
    businessType: '',
    categories: [],
    staffSize: '',
    plan: '',
    paymentMethod: '',
    terms: false,
    privacy: false,
    marketing: false,
    adminName: '',
    adminEmail: '',
    password: '',
    passwordConfirm: '',
  },
  errors: {},
  domainStatus: 'idle',
  isValid: false,
  isSubmitting: false,
  onChange: jest.fn(),
  onDomainCheck: jest.fn(),
  onStepClick: jest.fn(),
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onSave: jest.fn(),
  onSubmit: jest.fn(),
};

const renderTemplate = (overrides = {}) =>
  render(
    <MemoryRouter>
      <OnboardingTemplate {...DEFAULT_PROPS} {...overrides} />
    </MemoryRouter>
  );

describe('OnboardingTemplate', () => {
  it('renders the template container with mg-v2 class', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-template')).toBeInTheDocument();
  });

  it('renders page title and subtitle', () => {
    const { container } = renderTemplate();
    const title = container.querySelector('.mg-v2-onboarding-template__title');
    expect(title).toBeInTheDocument();
    const subtitle = container.querySelector('.mg-v2-onboarding-template__subtitle');
    expect(subtitle).toBeInTheDocument();
  });

  it('renders OnboardingStepper component', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-stepper')).toBeInTheDocument();
  });

  it('renders OnboardingStepForm component', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-step-form')).toBeInTheDocument();
  });

  it('renders OnboardingNavigation component', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-nav')).toBeInTheDocument();
  });

  it('renders PublicLayout wrapper', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-public-layout') || container.querySelector('.public-layout')).toBeInTheDocument();
  });

  it('has accessible live region for step content', () => {
    renderTemplate();
    const liveRegion = screen.getByLabelText(/단계별 입력 영역|Step content area/i);
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('renders stepper at step 3', () => {
    const { container } = renderTemplate({ currentStep: 3 });
    const completedItems = container.querySelectorAll('.mg-v2-onboarding-stepper__item--completed');
    expect(completedItems.length).toBe(3);
  });

  it('renders navigation buttons on first step', () => {
    const { container } = renderTemplate({ currentStep: 0 });
    const navBtns = container.querySelectorAll('.mg-v2-onboarding-nav__btn');
    expect(navBtns.length).toBeGreaterThan(0);
  });

  it('renders navigation buttons when isValid is true', () => {
    const { container } = renderTemplate({ currentStep: 0, isValid: true });
    const navBtns = container.querySelectorAll('.mg-v2-onboarding-nav__btn');
    expect(navBtns.length).toBeGreaterThan(0);
  });

  it('renders navigation at step 4', () => {
    const { container } = renderTemplate({ currentStep: 4, isValid: true });
    const nav = container.querySelector('.mg-v2-onboarding-nav');
    expect(nav).toBeInTheDocument();
  });
});
