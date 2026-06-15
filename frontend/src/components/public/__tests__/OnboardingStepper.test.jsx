/**
 * OnboardingStepper 단위 테스트
 *
 * - 6단계 렌더링
 * - 현재/완료/대기 상태 시각화
 * - 완료된 단계 클릭
 * - mg-v2-* 토큰 클래스 사용 검증
 * - 접근성 (aria-current, aria-label)
 *
 * @author MindGarden
 * @since 2026-06-15
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
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }
}));

const OnboardingStepper = require('../molecules/OnboardingStepper').default;

const renderStepper = (props = {}) =>
  render(
    <MemoryRouter>
      <OnboardingStepper currentStep={0} {...props} />
    </MemoryRouter>
  );

describe('OnboardingStepper', () => {
  it('renders 6 step items', () => {
    const { container } = renderStepper();
    const items = container.querySelectorAll('.mg-v2-onboarding-stepper__item');
    expect(items.length).toBe(6);
  });

  it('marks current step with aria-current="step"', () => {
    renderStepper({ currentStep: 2 });
    const currentButton = screen.getByRole('button', { current: 'step' });
    expect(currentButton).toBeInTheDocument();
  });

  it('shows completed state for past steps', () => {
    const { container } = renderStepper({ currentStep: 3 });
    const completedItems = container.querySelectorAll('.mg-v2-onboarding-stepper__item--completed');
    expect(completedItems.length).toBe(3);
  });

  it('shows pending state for future steps', () => {
    const { container } = renderStepper({ currentStep: 1 });
    const pendingItems = container.querySelectorAll('.mg-v2-onboarding-stepper__item--pending');
    expect(pendingItems.length).toBe(4);
  });

  it('calls onStepClick for completed steps', () => {
    const mockClick = jest.fn();
    renderStepper({ currentStep: 3, onStepClick: mockClick });
    
    const completedButtons = screen.getAllByRole('button').filter(
      btn => !btn.disabled && btn.getAttribute('aria-current') !== 'step'
    );
    
    if (completedButtons.length > 0) {
      fireEvent.click(completedButtons[0]);
      expect(mockClick).toHaveBeenCalled();
    }
  });

  it('uses mg-v2-onboarding-stepper class', () => {
    const { container } = renderStepper();
    expect(container.querySelector('.mg-v2-onboarding-stepper')).toBeInTheDocument();
  });

  it('has accessible navigation label', () => {
    renderStepper();
    const nav = screen.getByLabelText(/onboarding progress/i);
    expect(nav).toBeInTheDocument();
  });

  it('renders check icon for completed steps', () => {
    const { container } = renderStepper({ currentStep: 2 });
    const checkIcons = container.querySelectorAll('.mg-v2-onboarding-stepper__check-icon');
    expect(checkIcons.length).toBe(2);
  });
});
