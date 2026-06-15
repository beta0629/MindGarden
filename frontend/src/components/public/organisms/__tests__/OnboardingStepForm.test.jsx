/**
 * OnboardingStepForm 단위 테스트
 *
 * - Step별 렌더링 (Step 0~5)
 * - 접근성 (aria-label, aria-required, role)
 * - 검증 메시지 표시 (에러)
 * - 키보드 접근성 (tabIndex, focus)
 * - 콜백 호출 (onChange, onDomainCheck)
 * - 비밀번호 강도 인디케이터 (Step 4)
 * - 약관 전체 동의 토글 (Step 3)
 * - 완료 화면 PENDING 안내 (Step 5)
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

const OnboardingStepForm = require('../OnboardingStepForm').default;

const defaultProps = {
  currentStep: 0,
  formData: {},
  onChange: jest.fn(),
  errors: {},
};

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <OnboardingStepForm {...defaultProps} {...props} />
    </MemoryRouter>
  );

describe('OnboardingStepForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 0 — 기본 정보', () => {
    it('renders tenant name, domain, phone, email fields', () => {
      renderForm({ currentStep: 0 });
      expect(screen.getByLabelText(/테넌트명/)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /도메인/ })).toBeInTheDocument();
      expect(screen.getByLabelText(/대표 연락처/)).toBeInTheDocument();
      expect(screen.getByLabelText(/대표 이메일/)).toBeInTheDocument();
    });

    it('shows error messages for invalid fields', () => {
      renderForm({
        currentStep: 0,
        errors: { tenantName: '필수 항목입니다' },
      });
      expect(screen.getByRole('alert')).toHaveTextContent('필수 항목입니다');
    });

    it('calls onChange when input changes', () => {
      const onChange = jest.fn();
      renderForm({ currentStep: 0, onChange });
      fireEvent.change(screen.getByLabelText(/테넌트명/), { target: { value: '테스트' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('calls onDomainCheck when domain check button clicked', () => {
      const onDomainCheck = jest.fn();
      renderForm({ currentStep: 0, onDomainCheck });
      fireEvent.click(screen.getByLabelText(/도메인 중복 확인/));
      expect(onDomainCheck).toHaveBeenCalledTimes(1);
    });

    it('shows domain available message on success status', () => {
      renderForm({ currentStep: 0, domainStatus: 'available' });
      expect(screen.getByRole('status')).toHaveTextContent(/사용 가능/);
    });

    it('has aria-required on required fields', () => {
      renderForm({ currentStep: 0 });
      expect(screen.getByLabelText(/테넌트명/)).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Step 1 — 비즈니스 정보', () => {
    it('renders business type dropdown', () => {
      renderForm({ currentStep: 1 });
      expect(screen.getByLabelText(/업종/)).toBeInTheDocument();
    });

    it('renders category chips', () => {
      renderForm({ currentStep: 1 });
      expect(screen.getByText(/아동\/청소년/)).toBeInTheDocument();
      expect(screen.getByText(/부부\/가족/)).toBeInTheDocument();
    });

    it('toggles category chip selection', () => {
      const onChange = jest.fn();
      renderForm({ currentStep: 1, onChange, formData: { categories: [] } });
      fireEvent.click(screen.getByText(/아동\/청소년/));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ name: 'categories', value: ['child'] }),
        })
      );
    });

    it('renders staff size options', () => {
      const { container } = renderForm({ currentStep: 1 });
      const staffGroup = container.querySelector('[role="radiogroup"]');
      expect(staffGroup).toBeInTheDocument();
      const radios = staffGroup.querySelectorAll('[role="radio"]');
      expect(radios.length).toBe(4);
    });
  });

  describe('Step 2 — 결제 정보', () => {
    it('renders pricing plan cards with ₩TBD placeholder', () => {
      renderForm({ currentStep: 2 });
      const tbdElements = screen.getAllByText(/₩TBD/);
      expect(tbdElements.length).toBeGreaterThanOrEqual(2);
    });

    it('renders payment method buttons', () => {
      renderForm({ currentStep: 2 });
      expect(screen.getByText(/카드/)).toBeInTheDocument();
      expect(screen.getByText(/계좌이체/)).toBeInTheDocument();
      expect(screen.getByText(/세금계산서/)).toBeInTheDocument();
    });

    it('renders recommended badge on Pro plan', () => {
      const { container } = renderForm({ currentStep: 2 });
      expect(container.querySelector('.mg-v2-step-form__plan-badge')).toBeInTheDocument();
    });

    it('selects plan via keyboard (Enter)', () => {
      const onChange = jest.fn();
      renderForm({ currentStep: 2, onChange });
      const planCards = document.querySelectorAll('.mg-v2-step-form__plan-card');
      fireEvent.keyDown(planCards[0], { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ name: 'plan', value: 'basic' }),
        })
      );
    });
  });

  describe('Step 3 — 약관 동의', () => {
    it('renders agree-all checkbox', () => {
      renderForm({ currentStep: 3 });
      expect(screen.getByLabelText(/전체 동의/)).toBeInTheDocument();
    });

    it('renders individual term items', () => {
      renderForm({ currentStep: 3 });
      expect(screen.getByLabelText(/이용약관 동의/)).toBeInTheDocument();
      expect(screen.getByLabelText(/개인정보 처리방침 동의/)).toBeInTheDocument();
      expect(screen.getByLabelText(/마케팅 수신 동의/)).toBeInTheDocument();
    });

    it('toggles all terms on agree-all click', () => {
      const onChange = jest.fn();
      renderForm({ currentStep: 3, onChange, formData: {} });
      fireEvent.click(screen.getByLabelText(/전체 동의/));
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('displays required/optional badges', () => {
      renderForm({ currentStep: 3 });
      const badges = document.querySelectorAll('.mg-v2-step-form__term-badge--required');
      expect(badges.length).toBe(2);
    });
  });

  describe('Step 4 — 관리자 계정', () => {
    it('renders admin name, email, password, password confirm fields', () => {
      renderForm({ currentStep: 4 });
      expect(screen.getByLabelText(/관리자 이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/로그인 이메일/)).toBeInTheDocument();
      expect(document.getElementById('password')).toBeInTheDocument();
      expect(screen.getByLabelText(/비밀번호 확인/)).toBeInTheDocument();
    });

    it('shows password strength indicator', () => {
      renderForm({
        currentStep: 4,
        formData: { password: 'Abc123!@' },
      });
      const bars = document.querySelectorAll('.mg-v2-step-form__strength-bar');
      expect(bars.length).toBe(4);
      expect(screen.getByText(/안전/)).toBeInTheDocument();
    });

    it('shows weak strength for short password', () => {
      renderForm({
        currentStep: 4,
        formData: { password: 'abc' },
      });
      expect(screen.getByText(/취약/)).toBeInTheDocument();
    });

    it('shows fair strength for moderate password', () => {
      renderForm({
        currentStep: 4,
        formData: { password: 'Abcdefgh' },
      });
      expect(screen.getByText(/보통/)).toBeInTheDocument();
    });
  });

  describe('Step 5 — 완료', () => {
    it('renders completion message with PENDING notice', () => {
      renderForm({ currentStep: 5 });
      expect(screen.getByText(/신청이 완료되었습니다/)).toBeInTheDocument();
      expect(screen.getByText(/승인/)).toBeInTheDocument();
    });

    it('has role="status" for live region', () => {
      const { container } = renderForm({ currentStep: 5 });
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });
  });

  describe('공통', () => {
    it('uses mg-v2-step-form class', () => {
      const { container } = renderForm();
      expect(container.querySelector('.mg-v2-step-form')).toBeInTheDocument();
    });

    it('has accessible section label', () => {
      renderForm();
      expect(screen.getByLabelText(/온보딩 입력 양식/)).toBeInTheDocument();
    });

    it('sets data-step attribute', () => {
      const { container } = renderForm({ currentStep: 2 });
      expect(container.querySelector('[data-step="2"]')).toBeInTheDocument();
    });
  });
});
