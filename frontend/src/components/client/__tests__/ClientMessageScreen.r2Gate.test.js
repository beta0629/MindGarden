/**
 * ClientMessageScreen — #1729 r2: 모달 필드·가로 액션·목록 오류 토스트
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { useSession } from '../../../contexts/SessionContext';
import ClientMessageScreen from '../ClientMessageScreen';

const mockShowToast = jest.fn();
const CLIENT_USER = { id: 101, role: 'CLIENT', tenantId: 't', name: '테스트' };

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: jest.fn(),
  SessionContext: jest.requireActual('react').createContext(null)
}));

jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, removeToast: jest.fn(), toasts: [] })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="page-shell">{children}</div>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common:notification.unified.messageFieldSender': '보낸 사람',
        'common:notification.unified.messageFieldRelatedConsultation': '관련 상담',
        'common:notification.unified.messageFieldRemainingSessions': '남은 회기',
        'common:notification.unified.new_errorTitle': '알림을 불러오지 못했어요',
        'common:notification.unified.new_errorDesc': '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
        'common:notification.unified.new_errorToast': '알림을 불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
        'common:notification.unified.new_retry': '다시 시도',
        'common.actions.close': '닫기',
        'common.labels.consultant': '상담사',
        'admin.labels.urgent': '긴급'
      };
      return map[key] || key;
    }
  })
}));

describe('ClientMessageScreen r2 gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({
      user: CLIENT_USER,
      isLoggedIn: true,
      isLoading: false,
      hasCheckedSession: true
    });
  });

  test('상세 모달: 보낸 사람·관련 상담·남은 회기 + outline 닫기·primary 답장 전송', async() => {
    StandardizedApi.get.mockResolvedValue({
      messages: [{
        id: 1,
        title: '다음 상담 준비 안내',
        content: '본문',
        messageType: 'GENERAL',
        isRead: true,
        senderName: '김하늘 선생님',
        sentAt: '2026-10-21T08:40:00',
        metadata: {
          relatedConsultation: '10월 23일 (금) 오후 3:00 · 대면',
          remainingSessionsText: '10회기 패키지 중 3회 남음'
        }
      }],
      totalElements: 1,
      totalPages: 1
    });
    StandardizedApi.put.mockResolvedValue({});

    render(<MemoryRouter><ClientMessageScreen /></MemoryRouter>);
    fireEvent.click(await screen.findByTestId('client-messages-message-item'));
    const dialog = await screen.findByTestId('client-message-detail-modal');
    expect(dialog).toHaveTextContent('보낸 사람');
    expect(dialog).toHaveTextContent('김하늘 선생님');
    expect(dialog).toHaveTextContent('관련 상담');
    expect(dialog).toHaveTextContent('10월 23일 (금) 오후 3:00 · 대면');
    expect(dialog).toHaveTextContent('남은 회기');
    expect(dialog).toHaveTextContent('10회기 패키지 중 3회 남음');

    const actions = dialog.querySelector('.unified-notifications-modal__actions');
    expect(actions).not.toBeNull();
    expect(actions.querySelector('.mg-action-btn--outline')).toHaveTextContent('닫기');
    expect(actions.querySelector('.mg-action-btn--primary')).toHaveTextContent('답장 전송');
  });

  test('목록 API 실패 시 success empty 가 아니라 오류 EmptyState + showToast(error)', async() => {
    StandardizedApi.get.mockRejectedValue(new Error('network'));
    render(<MemoryRouter><ClientMessageScreen /></MemoryRouter>);
    expect(await screen.findByTestId('client-messages-error')).toBeInTheDocument();
    expect(screen.getByText('알림을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.queryByText('받은 메시지가 없어요')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: expect.stringContaining('알림을 불러오지 못했어요')
      }));
    });
  });
});
