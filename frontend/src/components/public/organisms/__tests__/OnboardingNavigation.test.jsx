/**
 * OnboardingNavigation 단위 테스트
 *
 * - 렌더링 (Step별 버튼 구성)
 * - 접근성 (aria-label, aria-busy, disabled)
 * - 콜백 호출 (onPrev, onNext, onSave, onSubmit)
 * - 로딩 상태 (isSubmitting)
 * - 키보드 단축키 (Enter=다음)
 * - Step 0: 이전 버튼 없음
 * - Step 5: 완료 화면 (홈으로 버튼만)
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

const OnboardingNavigation = require('../OnboardingNavigation').default;

const defaultProps = {
  currentStep: 1,
  totalSteps: 6,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onSave: jest.fn(),
  onSubmit: jest.fn(),
  isValid: true,
  isSubmitting: false,
};

const renderNav = (props = {}) =>
  render(
    <MemoryRouter>
      <OnboardingNavigation {...defaultProps} {...props} />
    </MemoryRouter>
  );

describe('OnboardingNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('renders navigation with accessible label', () => {
      renderNav();
      expect(screen.getByLabelText(/온보딩 네비게이션/)).toBeInTheDocument();
    });

    it('uses mg-v2-onboarding-nav class', () => {
      const { container } = renderNav();
      expect(container.querySelector('.mg-v2-onboarding-nav')).toBeInTheDocument();
    });

    it('renders prev, next, save buttons at step 1', () => {
      renderNav({ currentStep: 1 });
      expect(screen.getByText(/이전/)).toBeInTheDocument();
      expect(screen.getByText(/다음 단계로/)).toBeInTheDocument();
      expect(screen.getByText(/임시저장/)).toBeInTheDocument();
    });
  });

  describe('Step 0 — 이전 버튼 없음', () => {
    it('does not show prev button on first step', () => {
      renderNav({ currentStep: 0 });
      expect(screen.queryByText(/이전/)).not.toBeInTheDocument();
    });

    it('shows next button on first step', () => {
      renderNav({ currentStep: 0 });
      expect(screen.getByText(/다음 단계로/)).toBeInTheDocument();
    });
  });

  describe('Step 4 (submit step) — 신청 완료하기', () => {
    it('shows submit button instead of next at step 4', () => {
      renderNav({ currentStep: 4 });
      expect(screen.getByText(/신청 완료하기/)).toBeInTheDocument();
      expect(screen.queryByText(/다음 단계로/)).not.toBeInTheDocument();
    });
  });

  describe('Step 5 — 완료 화면', () => {
    it('shows only home button on last step', () => {
      renderNav({ currentStep: 5 });
      expect(screen.getByText(/홈으로 돌아가기/)).toBeInTheDocument();
      expect(screen.queryByText(/이전/)).not.toBeInTheDocument();
      expect(screen.queryByText(/임시저장/)).not.toBeInTheDocument();
    });
  });

  describe('콜백 호출', () => {
    it('calls onPrev when prev button clicked', () => {
      const onPrev = jest.fn();
      renderNav({ currentStep: 2, onPrev });
      fireEvent.click(screen.getByText(/이전/));
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when next button clicked', () => {
      const onNext = jest.fn();
      renderNav({ currentStep: 1, onNext, isValid: true });
      fireEvent.click(screen.getByText(/다음 단계로/));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when save button clicked', () => {
      const onSave = jest.fn();
      renderNav({ currentStep: 1, onSave });
      fireEvent.click(screen.getByText(/임시저장/));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit when submit button clicked at step 4', () => {
      const onSubmit = jest.fn();
      renderNav({ currentStep: 4, onSubmit, isValid: true });
      fireEvent.click(screen.getByText(/신청 완료하기/));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('isValid 상태', () => {
    it('disables next button when isValid is false', () => {
      renderNav({ currentStep: 1, isValid: false });
      expect(screen.getByText(/다음 단계로/).closest('button')).toBeDisabled();
    });

    it('enables next button when isValid is true', () => {
      renderNav({ currentStep: 1, isValid: true });
      expect(screen.getByText(/다음 단계로/).closest('button')).not.toBeDisabled();
    });
  });

  describe('isSubmitting 로딩 상태', () => {
    it('shows spinner and loading text when submitting', () => {
      const { container } = renderNav({ currentStep: 4, isSubmitting: true, isValid: true });
      expect(screen.getByText(/처리 중/)).toBeInTheDocument();
      expect(container.querySelector('.mg-v2-onboarding-nav__spinner')).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      renderNav({ currentStep: 4, isSubmitting: true, isValid: true });
      expect(screen.getByText(/처리 중/).closest('button')).toBeDisabled();
    });

    it('has aria-busy on submit button when submitting', () => {
      renderNav({ currentStep: 4, isSubmitting: true, isValid: true });
      expect(screen.getByText(/처리 중/).closest('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('키보드 단축키', () => {
    it('calls onNext on Enter keydown when isValid', () => {
      const onNext = jest.fn();
      renderNav({ currentStep: 1, onNext, isValid: true });
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('does not call onNext on Enter when isValid is false', () => {
      const onNext = jest.fn();
      renderNav({ currentStep: 1, onNext, isValid: false });
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onSubmit on Enter at submit step', () => {
      const onSubmit = jest.fn();
      renderNav({ currentStep: 4, onSubmit, isValid: true });
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('data-step 속성', () => {
    it('sets data-step attribute', () => {
      const { container } = renderNav({ currentStep: 3 });
      expect(container.querySelector('[data-step="3"]')).toBeInTheDocument();
    });
  });
});
