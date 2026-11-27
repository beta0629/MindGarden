/**
 * ClientEventTimelineList — 빈 상태·403 조용한 안내·이벤트 렌더
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ClientEventTimelineList from '../ClientEventTimelineList';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import {
  CLIENT_EVENT_TYPE,
  CLIENT_EVENT_TIMELINE_UI
} from '../../../../constants/clientEventTimeline';
import { HTTP_STATUS } from '../../../../constants/magicNumbers';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

describe('ClientEventTimelineList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('events=[] → 빈 상태 문구', async() => {
    StandardizedApi.get.mockResolvedValue({
      events: [],
      totalCount: 0,
      totalPages: 0,
      number: 0,
      size: 20,
      last: true
    });

    render(<ClientEventTimelineList clientId={101} />);

    await waitFor(() => {
      expect(screen.getByText(CLIENT_EVENT_TIMELINE_UI.EMPTY)).toBeInTheDocument();
    });
    expect(notificationManager.error).not.toHaveBeenCalled();
  });

  it('이벤트 유형 한글 라벨 + reason 표시, beforeJson/afterJson 미노출', async() => {
    StandardizedApi.get.mockResolvedValue({
      events: [
        {
          id: 1,
          clientId: 101,
          eventType: CLIENT_EVENT_TYPE.MAPPING_CREATED,
          occurredAt: '2026-11-20T10:30:00',
          reason: '신규 배정',
          beforeJson: '{"secret":"before"}',
          afterJson: '{"secret":"after"}'
        }
      ],
      totalCount: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true
    });

    render(<ClientEventTimelineList clientId={101} />);

    await waitFor(() => {
      expect(screen.getByText('배정 생성')).toBeInTheDocument();
    });
    expect(screen.getByText('신규 배정')).toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
    expect(screen.queryByText(/beforeJson/)).not.toBeInTheDocument();
    expect(screen.queryByText(/afterJson/)).not.toBeInTheDocument();
  });

  it('403 → 조용한 안내, notification 미호출', async() => {
    const err = new Error('접근 권한이 없습니다.');
    err.status = HTTP_STATUS.FORBIDDEN;
    StandardizedApi.get.mockRejectedValue(err);

    render(<ClientEventTimelineList clientId={101} />);

    await waitFor(() => {
      expect(screen.getByText(CLIENT_EVENT_TIMELINE_UI.FORBIDDEN)).toBeInTheDocument();
    });
    expect(notificationManager.error).not.toHaveBeenCalled();
  });

  it('last===false 이면 더보기 후 append', async() => {
    StandardizedApi.get
      .mockResolvedValueOnce({
        events: [
          {
            id: 2,
            eventType: CLIENT_EVENT_TYPE.PAYMENT_COMPLETED,
            occurredAt: '2026-11-21T12:00:00',
            reason: null
          }
        ],
        totalCount: 2,
        totalPages: 2,
        number: 0,
        size: 20,
        last: false
      })
      .mockResolvedValueOnce({
        events: [
          {
            id: 1,
            eventType: CLIENT_EVENT_TYPE.SCHEDULE_CREATED,
            occurredAt: '2026-11-19T09:00:00',
            reason: null
          }
        ],
        totalCount: 2,
        totalPages: 2,
        number: 1,
        size: 20,
        last: true
      });

    render(<ClientEventTimelineList clientId={101} />);

    await waitFor(() => {
      expect(screen.getByText('결제 완료')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: CLIENT_EVENT_TIMELINE_UI.LOAD_MORE })).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: CLIENT_EVENT_TIMELINE_UI.LOAD_MORE }));
    });

    await waitFor(() => {
      expect(screen.getByText('일정 생성')).toBeInTheDocument();
    });
    expect(screen.getByText('결제 완료')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CLIENT_EVENT_TIMELINE_UI.LOAD_MORE })).not.toBeInTheDocument();
  });
});
