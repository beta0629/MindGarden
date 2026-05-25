/**
 * SmsTemplateManagementPage 단위 테스트.
 *
 * 검증 시나리오:
 *  - 목록 렌더 + 검색·카테고리 필터
 *  - 템플릿 선택 시 글로벌 본문/테넌트 본문/변수 입력 폼 노출
 *  - 미리보기 호출 → previewSmsTemplate 호출 + 결과 노출
 *  - 저장 모달 → updateSmsTemplateTenantOverride 호출
 *  - override 삭제 모달 → deleteSmsTemplateTenantOverride 호출
 *
 * @author MindGarden
 * @since 2026-05-29
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../../api/admin/smsTemplateApi', () => ({
  __esModule: true,
  getSmsTemplates: jest.fn(),
  updateSmsTemplateTenantOverride: jest.fn(),
  deleteSmsTemplateTenantOverride: jest.fn(),
  previewSmsTemplate: jest.fn()
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-layout" data-title={title}>
      {children}
    </div>
  )
}));

jest.mock('../../../dashboard-v2/content', () => ({
  __esModule: true,
  ContentArea: ({ children }) => <div data-testid="content-area">{children}</div>,
  ContentHeader: ({ title, subtitle }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button', loading, ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({
    user: { role: 'ADMIN', userId: 'admin1' },
    isLoggedIn: true,
    isLoading: false
  })
}));

jest.mock('../../../../constants/roles', () => ({
  __esModule: true,
  USER_ROLES: { ADMIN: 'ADMIN', STAFF: 'STAFF' },
  RoleUtils: {
    hasAnyRole: (user, allowed) =>
      Boolean(user && allowed && allowed.includes(user.role))
  }
}));

// 안정적인 t 함수 — useEffect 의존성 지옥 방지를 위해 모듈 최상위에 1회만 생성.
// jest.mock factory 안에서는 mock* prefix 가 붙은 변수만 참조 가능 (Jest 호이스팅 룰).
jest.mock('react-i18next', () => {
  const mockT = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
  const mockTranslation = { t: mockT };
  return {
    __esModule: true,
    useTranslation: () => mockTranslation
  };
});

import {
  getSmsTemplates,
  updateSmsTemplateTenantOverride,
  deleteSmsTemplateTenantOverride,
  previewSmsTemplate
} from '../../../../api/admin/smsTemplateApi';

import SmsTemplateManagementPage from '../SmsTemplateManagementPage';

const SAMPLE_ITEMS = [
  {
    key: 'PAYMENT_COMPLETED',
    label: '결제 완료',
    description: '결제 완료 SMS',
    category: 'PAYMENT',
    variables: ['paymentAmount', 'consultantName'],
    globalContent: '결제: {{paymentAmount}}원 / {{consultantName}}',
    tenantContent: null,
    tenantOverride: false,
    updatedAt: '2026-05-29T10:00:00'
  },
  {
    key: 'CONSULTATION_CONFIRMED',
    label: '상담 확정',
    description: '상담 확정 SMS',
    category: 'BOOKING',
    variables: ['consultantName'],
    globalContent: '상담 확정: {{consultantName}}',
    tenantContent: '테넌트 본문',
    tenantOverride: true,
    updatedAt: '2026-05-29T11:00:00'
  }
];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SmsTemplateManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSmsTemplates.mockResolvedValue({ success: true, data: SAMPLE_ITEMS });
  });

  it('목록 + 카테고리 필터 + 테넌트 override 배지를 렌더한다', async() => {
    render(<SmsTemplateManagementPage />);
    await waitFor(() => expect(getSmsTemplates).toHaveBeenCalled());

    expect(await screen.findByTestId('sms-template-item-PAYMENT_COMPLETED')).toBeInTheDocument();
    expect(screen.getByTestId('sms-template-item-CONSULTATION_CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('테넌트 override')).toBeInTheDocument();
  });

  it('템플릿 선택 시 글로벌 본문 + 변수 입력 폼이 노출된다', async() => {
    render(<SmsTemplateManagementPage />);
    await waitFor(() => expect(getSmsTemplates).toHaveBeenCalled());

    fireEvent.click(await screen.findByTestId('sms-template-item-PAYMENT_COMPLETED'));

    expect(screen.getByTestId('sms-template-global-content')).toHaveTextContent(
      '결제: {{paymentAmount}}원 / {{consultantName}}'
    );
    expect(screen.getByTestId('sms-template-variable-paymentAmount')).toBeInTheDocument();
    expect(screen.getByTestId('sms-template-variable-consultantName')).toBeInTheDocument();
  });

  it('미리보기 버튼 클릭 시 previewSmsTemplate 가 호출되고 결과가 노출된다', async() => {
    previewSmsTemplate.mockResolvedValue({
      success: true,
      data: {
        key: 'PAYMENT_COMPLETED',
        sourceContent: '결제: {{paymentAmount}}원',
        previewContent: '결제: 500,000원',
        byteLength: 24,
        charLength: 12,
        missingVariables: [],
        fromTenantOverride: false
      }
    });
    render(<SmsTemplateManagementPage />);
    await waitFor(() => expect(getSmsTemplates).toHaveBeenCalled());

    fireEvent.click(await screen.findByTestId('sms-template-item-PAYMENT_COMPLETED'));
    fireEvent.change(screen.getByTestId('sms-template-variable-paymentAmount'), {
      target: { value: '500,000' }
    });
    fireEvent.click(screen.getByTestId('sms-template-preview-btn'));

    await waitFor(() => expect(previewSmsTemplate).toHaveBeenCalledWith(
      'PAYMENT_COMPLETED',
      expect.objectContaining({ variables: expect.objectContaining({ paymentAmount: '500,000' }) })
    ));
    expect(await screen.findByTestId('sms-template-preview-result')).toHaveTextContent('결제: 500,000원');
  });

  it('저장 모달 확인 시 updateSmsTemplateTenantOverride 가 호출된다', async() => {
    updateSmsTemplateTenantOverride.mockResolvedValue({ success: true, data: SAMPLE_ITEMS[0] });
    render(<SmsTemplateManagementPage />);
    await waitFor(() => expect(getSmsTemplates).toHaveBeenCalled());

    fireEvent.click(await screen.findByTestId('sms-template-item-PAYMENT_COMPLETED'));
    fireEvent.change(screen.getByTestId('sms-template-tenant-content'), {
      target: { value: '새 본문' }
    });
    fireEvent.click(screen.getByTestId('sms-template-save-btn'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sms-template-save-confirm'));

    await waitFor(() => expect(updateSmsTemplateTenantOverride).toHaveBeenCalledWith(
      'PAYMENT_COMPLETED',
      { content: '새 본문' }
    ));
  });

  it('테넌트 override 삭제 모달 확인 시 deleteSmsTemplateTenantOverride 가 호출된다', async() => {
    deleteSmsTemplateTenantOverride.mockResolvedValue({ success: true, data: SAMPLE_ITEMS[1] });
    render(<SmsTemplateManagementPage />);
    await waitFor(() => expect(getSmsTemplates).toHaveBeenCalled());

    // override 가 활성화된 두 번째 행 선택.
    fireEvent.click(await screen.findByTestId('sms-template-item-CONSULTATION_CONFIRMED'));
    await flush();
    fireEvent.click(screen.getByTestId('sms-template-delete-btn'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sms-template-delete-confirm'));

    await waitFor(() => expect(deleteSmsTemplateTenantOverride).toHaveBeenCalledWith(
      'CONSULTATION_CONFIRMED'
    ));
  });
});
