/**
 * NotificationContext.markAllMessagesAsRead 단위 테스트.
 * 운영 핫픽스 (2026-05-23) — GNB "모두 읽음" 일괄 엔드포인트 호출 + 응답 unwrap 검증.
 *
 * @see docs/project-management/2026-05-23/CONSULTANT_UNREAD_MESSAGE_DEBUG_REPORT.md
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// 의존 모듈 mock (jest hoist) — 실제 import 보다 위에서 선언되어야 함
jest.mock('../SessionContext', () => ({
  useSession: () => ({
    user: { id: 3, role: 'CONSULTANT', tenantId: 'tenant-incheon-counseling-001' },
    isLoggedIn: true
  })
}));

jest.mock('../../utils/ajax', () => ({
  apiGet: jest.fn(() => Promise.resolve({ unreadCount: 0 })),
  apiPost: jest.fn(() => Promise.resolve({}))
}));

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

jest.mock('../../utils/consultationMessagesApi', () => ({
  getConsultationMessagesListPath: () => '/api/v1/consultation-messages/consultant/3'
}));

const StandardizedApi = require('../../utils/standardizedApi').default;
const { NotificationProvider, useNotification } = require('../NotificationContext');

const TestProbe = ({ onReady }) => {
  const ctx = useNotification();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return null;
};

const renderProvider = async() => {
  let captured;
  render(
    <NotificationProvider>
      <TestProbe onReady={(c) => { captured = c; }} />
    </NotificationProvider>
  );
  await waitFor(() => expect(captured).toBeDefined());
  return captured;
};

describe('NotificationContext.markAllMessagesAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/consultation-messages/mark-all-read 단일 호출 + ApiResponse.data 반환', async() => {
    StandardizedApi.post.mockResolvedValueOnce({
      success: true,
      data: { updatedCount: 263 }
    });

    const ctx = await renderProvider();
    const res = await ctx.markAllMessagesAsRead();

    expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.post).toHaveBeenCalledWith('/api/v1/consultation-messages/mark-all-read');
    expect(res).toEqual({ updatedCount: 263 });
  });

  it('응답이 ApiResponse 래퍼 없이 plain 객체이면 그대로 반환', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ updatedCount: 5 });

    const ctx = await renderProvider();
    const res = await ctx.markAllMessagesAsRead();

    expect(res).toEqual({ updatedCount: 5 });
  });

  it('API 실패 시 throw + console.error 로깅', async() => {
    const err = new Error('boom');
    StandardizedApi.post.mockRejectedValueOnce(err);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const ctx = await renderProvider();
    await expect(ctx.markAllMessagesAsRead()).rejects.toThrow('boom');
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });
});
