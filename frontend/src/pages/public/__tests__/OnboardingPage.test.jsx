/**
 * OnboardingPage 통합 테스트 (Phase C-Refine v2)
 *
 * SPEC: 4단계 stepper, Split View, 회사명/업종/임직원 규모 첫 화면.
 *   - StandardizedApi 모킹으로 도메인 중복검사·제출 흐름 검증
 *   - safeDisplay 준수 (객체 직접 렌더 없음)
 *   - 다음/이전 단계 전환, validation 동작 확인
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import '../../../i18n';
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
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
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

describe('OnboardingPage (Phase C-Refine v2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ available: true });
    mockPost.mockResolvedValue({ success: true });
  });

  it('renders the v2 split view template', () => {
    const { container } = renderPage();
    expect(container.querySelector('.mg-v2-onboarding-split')).toBeInTheDocument();
  });

  it('renders step 0 with company name, industry, staff size inputs', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[name="tenantName"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="businessType"]')).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-onboarding-segmented')).toBeInTheDocument();
  });

  it('renders v2 title "Start your tenant registration" or Korean equivalent', () => {
    renderPage();
    const title = screen.getByText(/테넌트 등록을 시작하세요|Start your tenant registration/i);
    expect(title).toBeInTheDocument();
  });

  it('renders the login link in step 0', () => {
    renderPage();
    const link = screen.getByText(/로그인|Log in/i);
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('disables CTA until company name is provided on step 0', () => {
    const { container } = renderPage();
    const cta = container.querySelector('.mg-v2-onboarding-form__cta');
    expect(cta).toBeDisabled();
    fireEvent.change(container.querySelector('input[name="tenantName"]'), {
      target: { name: 'tenantName', value: 'Acme Corp' },
    });
    expect(cta).not.toBeDisabled();
  });

  it('advances to step 1 when CTA clicked with valid company name', async () => {
    const { container } = renderPage();
    fireEvent.change(container.querySelector('input[name="tenantName"]'), {
      target: { name: 'tenantName', value: 'Acme Corp' },
    });
    fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));
    await waitFor(() => {
      expect(container.querySelector('[data-step="1"]')).toBeInTheDocument();
    });
  });

  it('selects staff size segmented control', () => {
    const { container } = renderPage();
    const segments = container.querySelectorAll('.mg-v2-onboarding-segmented__item');
    expect(segments.length).toBe(4);
    fireEvent.click(segments[1]);
    expect(segments[1].classList.contains('mg-v2-onboarding-segmented__item--selected')).toBe(true);
  });

  it('renders 4-dot stepper with 4 dots', () => {
    const { container } = renderPage();
    const dots = container.querySelectorAll('.mg-v2-onboarding-step-dots__dot');
    expect(dots.length).toBe(4);
  });

  it('runs domain check on blur in step 1', async () => {
    const { container } = renderPage();
    fireEvent.change(container.querySelector('input[name="tenantName"]'), {
      target: { name: 'tenantName', value: 'Acme Corp' },
    });
    fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));
    await waitFor(() => {
      expect(container.querySelector('input[name="domain"]')).toBeInTheDocument();
    });

    const domainInput = container.querySelector('input[name="domain"]');
    fireEvent.change(domainInput, { target: { name: 'domain', value: 'acme' } });
    await act(async () => {
      fireEvent.blur(domainInput);
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        '/api/v1/public/onboarding/domain-check',
        expect.objectContaining({ domain: 'acme' })
      );
    });
  });

  describe('관리자 비밀번호 공통 정책', () => {
    const fill = (container, name, value) => {
      const el = container.querySelector(`input[name="${name}"]`);
      fireEvent.change(el, { target: { name, value } });
      return el;
    };

    const goToAdminStep = async (container) => {
      fill(container, 'tenantName', 'Acme Corp');
      fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));
      await waitFor(() => expect(container.querySelector('input[name="domain"]')).toBeInTheDocument());
      fill(container, 'domain', 'acme');
      fill(container, 'phone', '01012345678');
      fill(container, 'email', 'fake.company@example.com');
      fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));
      await waitFor(() => expect(container.querySelector('input[name="password"]')).toBeInTheDocument());
      fill(container, 'adminName', '관리자');
      fill(container, 'adminEmail', 'fake.admin@example.com');
      fireEvent.click(container.querySelector('input[name="terms"]'));
      fireEvent.click(container.querySelector('input[name="privacy"]'));
    };

    it('대문자 없는 비밀번호는 제출 API 를 부르지 않고 정책 안내를 표시한다', async () => {
      const { container } = renderPage();
      await goToAdminStep(container);
      const pwd = fill(container, 'password', 'noupper1!x');
      fill(container, 'passwordConfirm', 'noupper1!x');
      fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));

      const alert = await screen.findByText(/대문자를 포함해야/);
      expect(alert).toHaveAttribute('role', 'alert');
      expect(pwd).toHaveAttribute('aria-invalid', 'true');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('정책을 만족하면 제출 API 를 부른다', async () => {
      const { container } = renderPage();
      await goToAdminStep(container);
      fill(container, 'password', 'Fake7!Qzm');
      fill(container, 'passwordConfirm', 'Fake7!Qzm');
      fireEvent.click(container.querySelector('.mg-v2-onboarding-form__cta'));

      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      expect(mockPost.mock.calls[0][1].password).toBe('Fake7!Qzm');
    });
  });

  it('does not render raw object output (safeDisplay compliance)', () => {
    const { container } = renderPage();
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('renders Core Solution brand wordmark in left panel', () => {
    const { container } = renderPage();
    const wordmark = container.querySelector('.mg-v2-onboarding-split__brand-name');
    expect(wordmark).toBeInTheDocument();
    expect(wordmark.textContent).toMatch(/Core Solution/i);
  });
});
