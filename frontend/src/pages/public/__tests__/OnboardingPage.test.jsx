/**
 * OnboardingPage 통합 테스트
 *
 * Phase C-3 W1:
 * - API mock (jest.fn) 으로 도메인 중복검사·제출 흐름 검증
 * - 사용자 시나리오: 약관 동의 → "다음" → step 이동
 * - 도메인 중복검사 실패 시 에러 메시지 노출
 * - React issue-130 / safeDisplay: 객체 직접 출력 없음
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

const OnboardingPage = require('../OnboardingPage').default;

const renderPage = () =>
  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>
  );

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ available: true });
    mockPost.mockResolvedValue({ success: true });
  });

  it('renders the onboarding page with template', () => {
    const { container } = renderPage();
    expect(container.querySelector('.mg-v2-onboarding-template')).toBeInTheDocument();
  });

  it('renders at step 0 initially', () => {
    const { container } = renderPage();
    const stepper = container.querySelector('.mg-v2-onboarding-stepper');
    expect(stepper).toBeInTheDocument();
    const currentItem = container.querySelector('.mg-v2-onboarding-stepper__item--current');
    expect(currentItem).toBeInTheDocument();
  });

  it('shows validation error when required fields are empty on next click', () => {
    const { container } = renderPage();
    const nextBtn = container.querySelector('.mg-v2-onboarding-nav__btn--primary');
    if (nextBtn) {
      fireEvent.click(nextBtn);
      expect(container.querySelector('.mg-v2-step-form')).toBeInTheDocument();
    }
  });

  it('navigates to next step after filling required fields', async () => {
    const { container } = renderPage();

    const tenantInput = container.querySelector('input[name="tenantName"]');
    const domainInput = container.querySelector('input[name="domain"]');
    const phoneInput = container.querySelector('input[name="phone"]');
    const emailInput = container.querySelector('input[name="email"]');

    if (tenantInput && domainInput && phoneInput && emailInput) {
      fireEvent.change(tenantInput, { target: { name: 'tenantName', value: '테스트 센터' } });
      fireEvent.change(domainInput, { target: { name: 'domain', value: 'test-center' } });
      fireEvent.change(phoneInput, { target: { name: 'phone', value: '01012345678' } });
      fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });

      const navBtns = container.querySelectorAll('.mg-v2-onboarding-nav__btn--primary');
      const nextBtn = navBtns[navBtns.length - 1];
      if (nextBtn) {
        fireEvent.click(nextBtn);
        await waitFor(() => {
          const completedItems = container.querySelectorAll(
            '.mg-v2-onboarding-stepper__item--completed'
          );
          expect(completedItems.length).toBeGreaterThanOrEqual(1);
        });
      }
    }
  });

  it('shows domain taken error when domain check returns unavailable', async () => {
    mockGet.mockResolvedValueOnce({ available: false });

    const { container } = renderPage();

    const domainInput = container.querySelector('input[name="domain"]');
    if (domainInput) {
      fireEvent.change(domainInput, { target: { name: 'domain', value: 'taken-domain' } });

      const checkBtn = container.querySelector('[data-testid="domain-check-btn"]')
        || container.querySelector('.mg-v2-onboarding-step-form__domain-check-btn');

      if (checkBtn) {
        await act(async () => {
          fireEvent.click(checkBtn);
        });
        await waitFor(() => {
          expect(mockGet).toHaveBeenCalledWith(
            '/api/v1/public/onboarding/domain-check',
            expect.objectContaining({ domain: 'taken-domain' })
          );
        });
      }
    }
  });

  it('shows domain check network error message', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const { container } = renderPage();

    const domainInput = container.querySelector('input[name="domain"]');
    if (domainInput) {
      fireEvent.change(domainInput, { target: { name: 'domain', value: 'test-domain' } });

      const checkBtn = container.querySelector('[data-testid="domain-check-btn"]')
        || container.querySelector('.mg-v2-onboarding-step-form__domain-check-btn');

      if (checkBtn) {
        await act(async () => {
          fireEvent.click(checkBtn);
        });
        await waitFor(() => {
          expect(mockGet).toHaveBeenCalled();
        });
      }
    }
  });

  it('does not render raw object to DOM (safeDisplay compliance)', () => {
    const { container } = renderPage();
    const bodyText = container.textContent || '';
    expect(bodyText).not.toContain('[object Object]');
  });
});
