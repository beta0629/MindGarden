/**
 * OnboardingStepDots 단위 테스트 (Phase C-Refine v2)
 *
 * SPEC §3.2 / §8: 4-dot 시각 stepper, 완료된 dot 클릭 가능.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

const OnboardingStepDots = require('../OnboardingStepDots').default;

const renderDots = (props = {}) =>
  render(
    <MemoryRouter>
      <OnboardingStepDots {...props} />
    </MemoryRouter>
  );

describe('OnboardingStepDots', () => {
  it('renders 4 dots by default', () => {
    const { container } = renderDots();
    expect(container.querySelectorAll('.mg-v2-onboarding-step-dots__dot').length).toBe(4);
  });

  it('renders custom totalSteps count', () => {
    const { container } = renderDots({ totalSteps: 6 });
    expect(container.querySelectorAll('.mg-v2-onboarding-step-dots__dot').length).toBe(6);
  });

  it('marks current step with aria-current="step"', () => {
    renderDots({ currentStep: 2 });
    const current = screen.getByRole('button', { current: 'step' });
    expect(current).toBeInTheDocument();
  });

  it('shows completed state for past steps', () => {
    const { container } = renderDots({ currentStep: 3 });
    const completed = container.querySelectorAll('.mg-v2-onboarding-step-dots__dot--completed');
    expect(completed.length).toBe(3);
  });

  it('shows pending state for future steps', () => {
    const { container } = renderDots({ currentStep: 1 });
    const pending = container.querySelectorAll('.mg-v2-onboarding-step-dots__dot--pending');
    expect(pending.length).toBe(2);
  });

  it('calls onStepClick only for completed steps', () => {
    const onStepClick = jest.fn();
    renderDots({ currentStep: 2, onStepClick });
    const buttons = screen.getAllByRole('button');
    const completedButtons = buttons.filter((btn) => !btn.disabled);
    expect(completedButtons.length).toBe(2);
    fireEvent.click(completedButtons[0]);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it('renders check icon for completed steps', () => {
    const { container } = renderDots({ currentStep: 2 });
    expect(container.querySelectorAll('.mg-v2-onboarding-step-dots__check').length).toBe(2);
  });

  it('renders nav with accessible label', () => {
    renderDots();
    expect(screen.getByLabelText(/온보딩 진행률|Onboarding progress/i)).toBeInTheDocument();
  });
});
