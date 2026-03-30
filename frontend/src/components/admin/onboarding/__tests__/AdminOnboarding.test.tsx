import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminOnboarding from '../AdminOnboarding';
import StandardizedApi from '../../../../utils/standardizedApi';
import { ONBOARDING_MESSAGES, ONBOARDING_API_ENDPOINTS, ONBOARDING_TEXT, ONBOARDING_MOCK_DATA } from '../../../../constants/adminOnboarding';

// Mock dependencies
jest.mock('../../../../utils/standardizedApi', () => ({
  post: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-id-123' }),
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
}));

// Mock AdminCommonLayout to simplify testing
jest.mock('../../../layout/AdminCommonLayout', () => {
  return function MockAdminCommonLayout({ children, title }: { children: React.ReactNode, title: string }) {
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

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminOnboarding />
      </MemoryRouter>
    );
  };

  test('1. Stepper 플로우 테스트 - 1단계에서 다음 버튼 클릭 시 2단계로 전환', async () => {
    renderComponent();

    // 1단계 렌더링 확인 (데이터 로드 후)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO })).toBeInTheDocument();
    });
    expect(screen.getByText(ONBOARDING_MOCK_DATA.TENANT_NAME)).toBeInTheDocument();

    // '다음' 버튼 클릭
    const nextButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT });
    fireEvent.click(nextButton);

    // 2단계 렌더링 확인
    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_ADMIN_INFO })).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_MOCK_DATA.ADMIN_NAME)).toBeInTheDocument();
  });

  test('1. Stepper 플로우 테스트 - 2단계에서 이전 및 다음 버튼 동작 검증', async () => {
    renderComponent();

    // 1단계 -> 2단계
    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));
    
    // 2단계 확인
    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_ADMIN_INFO })).toBeInTheDocument();

    // '이전' 버튼 클릭 -> 1단계
    const prevButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_PREV });
    fireEvent.click(prevButton);
    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO })).toBeInTheDocument();

    // 다시 '다음' 버튼 클릭 -> 2단계
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));
    
    // '다음' 버튼 클릭 -> 3단계
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT }));
    
    // 3단계 확인
    expect(screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_FINAL_REVIEW })).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_TEXT.DESC_FINAL_REVIEW)).toBeInTheDocument();
  });

  test('2. 승인 액션 테스트 (API Mocking)', async () => {
    (StandardizedApi.post as jest.Mock).mockResolvedValueOnce({ success: true });
    
    renderComponent();

    // 3단계로 이동
    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT })); // 2단계
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT })); // 3단계

    // 승인 버튼 클릭
    const approveButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_APPROVE });
    fireEvent.click(approveButton);

    // confirm 창 호출 확인
    expect(window.confirm).toHaveBeenCalledWith(ONBOARDING_MESSAGES.CONFIRM_APPROVE);

    // API 호출 확인
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

    // alert 및 페이지 이동 확인
    expect(window.alert).toHaveBeenCalledWith(ONBOARDING_MESSAGES.APPROVE_SUCCESS);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
  });

  test('2. 거절 액션 테스트 - 모달 렌더링 및 반려 API 호출 검증', async () => {
    (StandardizedApi.post as jest.Mock).mockResolvedValueOnce({ success: true });
    
    renderComponent();

    // 3단계로 이동
    await waitFor(() => screen.getByRole('heading', { name: ONBOARDING_TEXT.SECTION_BASIC_INFO }));
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT })); // 2단계
    fireEvent.click(screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_NEXT })); // 3단계

    // 거절 버튼 클릭
    const rejectButton = screen.getByRole('button', { name: ONBOARDING_MESSAGES.BTN_REJECT });
    fireEvent.click(rejectButton);

    // 모달 렌더링 확인
    expect(screen.getByText(ONBOARDING_MESSAGES.MODAL_REJECT_TITLE)).toBeInTheDocument();
    
    // 반려 사유 입력
    const reasonInput = screen.getByPlaceholderText(ONBOARDING_MESSAGES.MODAL_PLACEHOLDER_REASON);
    fireEvent.change(reasonInput, { target: { value: '서류 불충분' } });

    // 모달 내 확인(반려) 버튼 클릭
    // 모달 내의 확인 버튼을 특정하기 위해
    const confirmButtons = screen.getAllByRole('button', { name: ONBOARDING_MESSAGES.BTN_CONFIRM });
    // UnifiedModal 내의 버튼을 클릭
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    // API 호출 확인
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

    // alert 및 페이지 이동 확인
    expect(window.alert).toHaveBeenCalledWith(ONBOARDING_MESSAGES.REJECT_SUCCESS);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/onboarding');
  });
});
