/**
 * SmsLogCard — 단위 테스트.
 *
 * 검증 매트릭스:
 *  - S1: 마운트 시 getRecentSmsLogs(default limit) 호출
 *  - S2: 응답이 success/data 봉투인 경우 row 렌더 + 채널·상태 배지 노출
 *  - S3: 빈 응답 시 placeholder 노출
 *  - S4: API 실패 시 error 메시지 alert + items 비움
 *  - S5: 새로고침 클릭 시 재호출
 *  - S6: PII 가드 — recipientPhone 그대로 노출(추가 마스킹 X)
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../../api/admin/pushMonitoringApi', () => {
  const actual = jest.requireActual('../../../../api/admin/pushMonitoringApi');
  return {
    __esModule: true,
    ...actual,
    getRecentSmsLogs: jest.fn()
  };
});

import {
  getRecentSmsLogs,
  SMS_LOGS_DEFAULT_LIMIT
} from '../../../../api/admin/pushMonitoringApi';
import SmsLogCard from '../organisms/SmsLogCard';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const buildEntry = (overrides = {}) => ({
  id: 1001,
  templateCode: 'RESERVATION_REMINDER_D2',
  channelUsed: 'SMS',
  targetType: 'SCHEDULE',
  targetId: 42,
  recipientUserId: 7,
  recipientName: '홍길동',
  recipientPhone: '010-***-1234',
  successFlag: true,
  errorCode: null,
  errorMessage: null,
  createdAt: '2026-06-13T12:34:00',
  ...overrides
});

const envelope = (data) => ({ success: true, data });

const renderCard = async (props = {}) => {
  let result;
  await act(async () => {
    result = render(<SmsLogCard {...props} />);
  });
  return result;
};

describe('SmsLogCard', () => {
  beforeEach(() => {
    getRecentSmsLogs.mockReset();
  });

  test('S1: 마운트 시 getRecentSmsLogs(default limit) 호출', async () => {
    getRecentSmsLogs.mockResolvedValue(envelope([]));
    await renderCard();
    await waitFor(() => expect(getRecentSmsLogs).toHaveBeenCalledTimes(1));
    expect(getRecentSmsLogs).toHaveBeenCalledWith({ limit: SMS_LOGS_DEFAULT_LIMIT });
  });

  test('S2: 응답을 풀어 row 렌더 + 채널·상태 배지 노출', async () => {
    getRecentSmsLogs.mockResolvedValue(envelope([
      buildEntry({ id: 2001, channelUsed: 'SMS', successFlag: true }),
      buildEntry({
        id: 2002,
        channelUsed: 'ALIMTALK',
        successFlag: false,
        errorCode: 'SEND_FAILED',
        errorMessage: 'Solapi 5xx'
      })
    ]));
    await renderCard();
    const rows = await screen.findAllByTestId('sms-log-row');
    expect(rows.length).toBe(2);
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS)).toBeInTheDocument();
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK)).toBeInTheDocument();
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_SUCCESS)).toBeInTheDocument();
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_STATUS_FAILURE)).toBeInTheDocument();
    expect(screen.getByText('Solapi 5xx')).toBeInTheDocument();
  });

  test('S3: 빈 응답 시 placeholder 노출', async () => {
    getRecentSmsLogs.mockResolvedValue(envelope([]));
    await renderCard();
    await waitFor(() =>
      expect(screen.getByTestId('sms-log-card-empty')).toBeInTheDocument());
    expect(
      screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_EMPTY_TITLE)
    ).toBeInTheDocument();
  });

  test('S4: API 실패 시 error alert 노출 + 행 없음', async () => {
    getRecentSmsLogs.mockRejectedValue(new Error('Network down'));
    await renderCard();
    const alert = await screen.findByTestId('sms-log-card-error');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toEqual(expect.stringContaining('Network down'));
    expect(screen.queryAllByTestId('sms-log-row').length).toBe(0);
  });

  test('S5: 새로고침 클릭 시 재호출', async () => {
    getRecentSmsLogs.mockResolvedValue(envelope([]));
    await renderCard();
    await waitFor(() => expect(getRecentSmsLogs).toHaveBeenCalledTimes(1));
    const refreshBtn = screen.getByRole('button', {
      name: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SMS_LOGS_REFRESH
    });
    await act(async () => {
      fireEvent.click(refreshBtn);
    });
    expect(getRecentSmsLogs).toHaveBeenCalledTimes(2);
  });

  test('S6: PII 가드 — recipientPhone 백엔드 마스킹 값 그대로', async () => {
    getRecentSmsLogs.mockResolvedValue(envelope([
      buildEntry({ recipientPhone: '010-***-9999', recipientName: '최테스터' })
    ]));
    await renderCard();
    expect(await screen.findByText('010-***-9999')).toBeInTheDocument();
    expect(screen.getByText('최테스터')).toBeInTheDocument();
  });
});
