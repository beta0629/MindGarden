/**
 * OnboardingTemplate 통합 테스트 (Phase C-Refine v2)
 *
 * SPEC §2 / §3 / §6: 40/60 Split View, 좌측 Brand Panel, 우측 Form Panel,
 * 4-dot Stepper, STEP X OF N 인디케이터.
 *
 * @author CoreSolution
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
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

const OnboardingTemplate = require('../OnboardingTemplate').default;

const DEFAULT_PROPS = {
  currentStep: 0,
  totalSteps: 4,
  onStepClick: jest.fn(),
  children: <div data-testid="onboarding-form-child">form content</div>,
};

const renderTemplate = (overrides = {}) =>
  render(
    <MemoryRouter>
      <OnboardingTemplate {...DEFAULT_PROPS} {...overrides} />
    </MemoryRouter>
  );

describe('OnboardingTemplate (Phase C-Refine v2)', () => {
  it('renders 40/60 split container', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-split')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-onboarding-split__left')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-onboarding-split__right')).toBeInTheDocument();
  });

  it('renders Core Solution brand wordmark in left panel', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-split__brand')).toBeInTheDocument();
    const wordmark = container.querySelector('.mg-v2-onboarding-split__brand-name');
    expect(wordmark).toBeInTheDocument();
    expect(wordmark.textContent).toMatch(/Core Solution/i);
  });

  it('renders tenant network visual molecule', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-tenant-network')).toBeInTheDocument();
  });

  it('renders value proposition title and description', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-split__value-title')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-onboarding-split__value-desc')).toBeInTheDocument();
  });

  it('renders STEP X OF N indicator with progressbar role', () => {
    const { container } = renderTemplate({ currentStep: 1, totalSteps: 4 });
    expect(container.querySelector('.mg-v2-onboarding-split__step-indicator')).toBeInTheDocument();
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });

  it('renders 4-dot OnboardingStepDots in right panel', () => {
    const { container } = renderTemplate();
    expect(container.querySelector('.mg-v2-onboarding-step-dots')).toBeInTheDocument();
    const dots = container.querySelectorAll('.mg-v2-onboarding-step-dots__dot');
    expect(dots.length).toBe(4);
  });

  it('renders children inside the form wrapper', () => {
    renderTemplate();
    expect(screen.getByTestId('onboarding-form-child')).toBeInTheDocument();
  });

  it('marks completed dots when currentStep > 0', () => {
    const { container } = renderTemplate({ currentStep: 2 });
    const completed = container.querySelectorAll('.mg-v2-onboarding-step-dots__dot--completed');
    expect(completed.length).toBe(2);
  });

  it('does not render raw object output (safeDisplay compliance)', () => {
    const { container } = renderTemplate();
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('clamps currentStep into valid range', () => {
    const { container } = renderTemplate({ currentStep: 99 });
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveAttribute('aria-valuenow', String(DEFAULT_PROPS.totalSteps));
  });
});
