import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import AdminOnboarding from '../AdminOnboarding';
import StandardizedApi from '../../../../utils/standardizedApi';
import {
  ONBOARDING_API_ENDPOINTS,
  ONBOARDING_MOCK_DATA
} from '../../../../constants/adminOnboarding';
import adminKo from '../../../../locales/ko/admin.json';
import commonKo from '../../../../locales/ko/common.json';

jest.mock('react-i18next', () => {
  const adminLocale = require('../../../../locales/ko/admin.json');
  const commonLocale = require('../../../../locales/ko/common.json');

  const lookup = (dict, path) => path.split('.').reduce((acc, part) => (
    acc && typeof acc === 'object' && Object.prototype.hasOwnProperty.call(acc, part)
      ? acc[part]
      : undefined
  ), dict);

  const translate = (key) => {
    const raw = String(key);
    const namespaced = raw.includes(':');
    const ns = namespaced ? raw.slice(0, raw.indexOf(':')) : 'common';
    const path = namespaced ? raw.slice(raw.indexOf(':') + 1) : raw;
    const dict = ns === 'admin' ? adminLocale : commonLocale;
    const value = lookup(dict, path);
    return typeof value === 'string' ? value : raw;
  };

  return {
    __esModule: true,
    useTranslation: () => ({
      t: translate,
      i18n: { language: 'ko' }
    }),
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-id-123' }),
  MemoryRouter: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../layout/AdminCommonLayout', () => {
  return function MockAdminCommonLayout({ children, title }) {
    return (
      <div data-testid="admin-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

const COPY = adminKo.onboarding;
const CONFIRM_CONTINUE = commonKo.modal.warning.defaultConfirmButton;
const ALERT_TITLE = commonKo.modal.success.defaultTitle;
const ALERT_CONFIRM = commonKo.modal.alert.defaultConfirmButton;

async function dismissSuccessAlert(message) {
  const dialog = await screen.findByRole('dialog', { name: ALERT_TITLE });
  expect(within(dialog).getByText(message)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: ALERT_CONFIRM }));
}

describe('AdminOnboarding Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <AdminOnboarding />
    </MemoryRouter>
  );

  test('1. Stepper 플로우 테스트 - 1단계에서 다음 버튼 클릭 시 2단계로 전환', async() => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: COPY.step['1'].label })).toBeInTheDocument();
    });
    expect(screen.getByText(ONBOARDING_MOCK_DATA.TENANT_NAME)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));

    expect(screen.getByRole('heading', { name: COPY.step['2'].label })).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_MOCK_DATA.ADMIN_NAME)).toBeInTheDocument();
  });

  test('1. Stepper 플로우 테스트 - 2단계에서 이전 및 다음 버튼 동작 검증', async() => {
    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: COPY.step['1'].label }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));

    expect(screen.getByRole('heading', { name: COPY.step['2'].label })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COPY.btn.prev }));
    expect(screen.getByRole('heading', { name: COPY.step['1'].label })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));

    expect(screen.getByRole('heading', { name: COPY.step['3'].label })).toBeInTheDocument();
    expect(screen.getByText(COPY.field.finalReviewDesc)).toBeInTheDocument();
  });

  test('2. 승인 액션 테스트 (API Mocking)', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });

    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: COPY.step['1'].label }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));

    fireEvent.click(screen.getByRole('button', { name: COPY.btn.approve }));

    const confirmDialog = await screen.findByRole('dialog', { name: commonKo.modal.warning.defaultTitle });
    expect(within(confirmDialog).getByText(COPY.confirm.approve)).toBeInTheDocument();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: CONFIRM_CONTINUE }));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        ONBOARDING_API_ENDPOINTS.DECISION('test-id-123'),
        {
          status: 'APPROVED',
          actorId: 'admin_user',
          note: ONBOARDING_MOCK_DATA.NOTE_APPROVE
        }
      );
    });

    await dismissSuccessAlert(COPY.msg.approveSuccess);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
    });
  });

  test('2. 거절 액션 테스트 - 모달 렌더링 및 반려 API 호출 검증', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });

    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: COPY.step['1'].label }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));
    fireEvent.click(screen.getByRole('button', { name: COPY.btn.next }));

    fireEvent.click(screen.getByRole('button', { name: COPY.btn.reject }));

    expect(screen.getByRole('dialog', { name: COPY.modal.rejectTitle })).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(COPY.modal.rejectReasonPlaceholder);
    fireEvent.change(reasonInput, { target: { value: '서류 불충분' } });

    const rejectDialog = screen.getByRole('dialog', { name: COPY.modal.rejectTitle });
    fireEvent.click(within(rejectDialog).getByRole('button', { name: COPY.btn.confirm }));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        ONBOARDING_API_ENDPOINTS.DECISION('test-id-123'),
        {
          status: 'REJECTED',
          actorId: 'admin_user',
          note: '서류 불충분'
        }
      );
    });

    await dismissSuccessAlert(COPY.msg.rejectSuccess);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
    });
  });
});
