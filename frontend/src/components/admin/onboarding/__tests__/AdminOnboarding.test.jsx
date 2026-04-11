import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import AdminOnboarding from '../AdminOnboarding';
import StandardizedApi from '../../../../utils/standardizedApi';
import {
  ONBOARDING_MESSAGES,
  ONBOARDING_API_ENDPOINTS,
  ONBOARDING_TEXT,
  ONBOARDING_MOCK_DATA
} from '../../../../constants/adminOnboarding';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
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

describe('AdminOnboarding Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <AdminOnboarding />
    </MemoryRouter>
  );

  test('1. Stepper 플로우 테스트 - 1단계에서 다음 버튼 클릭 시 2단계로 전환', async() => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO })).toBeInTheDocument();
    });
    expect(screen.getByText(ONBOARDING_MOCK_DATA.TENANT_NAME)).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT });
    fireEvent.click(nextButton);

    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_ADMIN_INFO })).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_MOCK_DATA.ADMIN_NAME)).toBeInTheDocument();
  });

  test('1. Stepper 플로우 테스트 - 2단계에서 이전 및 다음 버튼 동작 검증', async() => {
    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));

    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_ADMIN_INFO })).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_PREV });
    fireEvent.click(prevButton);
    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));

    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));

    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_FINAL_REVIEW })).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_TEXT.DESC_FINAL_REVIEW)).toBeInTheDocument();
  });

  test('2. 승인 액션 테스트 (API Mocking)', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });

    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));

    const approveButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_APPROVE });
    fireEvent.click(approveButton);

    expect(window.confirm).toHaveBeenCalledWith(ONBOARDING_MESSAGES.CONFIRM_APPROVE);

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

    expect(window.alert).toHaveBeenCalledWith(ONBOARDING_MESSAGES.APPROVE_SUCCESS);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
  });

  test('2. 거절 액션 테스트 - 모달 렌더링 및 반려 API 호출 검증', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });

    renderComponent();

    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));

    const rejectButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_REJECT });
    fireEvent.click(rejectButton);

    expect(screen.getByText(ONBOARDING_MESSAGES.MODAL_REJECT_TITLE)).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(ONBOARDING_MESSAGES.MODAL_PLACEHOLDER_REASON);
    fireEvent.change(reasonInput, { target: { value: '서류 불충분' } });

    const confirmButtons = screen.getAllByRole('button', { name: ONBOARDING_MESSAGES.BTN_CONFIRM });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

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

    expect(window.alert).toHaveBeenCalledWith(ONBOARDING_MESSAGES.REJECT_SUCCESS);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
  });
});
