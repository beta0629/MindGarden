/**
 * SessionTransferHistorySection — API 매핑·양방향 표시
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SessionTransferHistorySection from '../SessionTransferHistorySection';
import StandardizedApi from '../../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';
import { SESSION_TRANSFER_HISTORY_UI } from '../../../../constants/sessionTransferHistory';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="empty">{title}</div>
}));

jest.mock('../../../common/Badge', () => ({
  __esModule: true,
  default: ({ children }) => <span data-testid="badge">{children}</span>
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ title, subtitle, children, dataTestId }) => (
    <section data-testid={dataTestId || 'content-section'}>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  )
}));

describe('SessionTransferHistorySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('매핑 ID로 이력을 불러와 양방향 헤드라인을 표시한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      items: [
        {
          id: 1,
          sessionCount: 6,
          fromClientName: '임선희',
          toClientName: '김예린',
          fromMappingId: 5001,
          toMappingId: 5002,
          direction: 'OUTGOING',
          verb: '승계',
          occurredAt: '2026-03-01T10:00:00'
        },
        {
          id: 2,
          sessionCount: 5,
          fromClientName: '김예린',
          toClientName: '임선희',
          fromMappingId: 5002,
          toMappingId: 5001,
          direction: 'INCOMING',
          verb: '이관',
          occurredAt: '2026-04-02T09:00:00'
        }
      ]
    });

    render(<SessionTransferHistorySection mappingId={5001} clientId={1001} />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.MAPPINGS.SESSION_TRANSFER_HISTORY(5001)
      );
    });

    expect(await screen.findByText('임선희 → 김예린: 6회 승계')).toBeInTheDocument();
    expect(screen.getByText('김예린 → 임선희: 5회 승계')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge').map((el) => el.textContent)).toEqual(['승계', '승계']);
    expect(screen.getByText(SESSION_TRANSFER_HISTORY_UI.SECTION_TITLE)).toBeInTheDocument();
    expect(SESSION_TRANSFER_HISTORY_UI.SECTION_TITLE).toBe('회기 승계 이력');
  });

  it('clientId 만 있으면 내담자 엔드포인트를 호출한다', async() => {
    StandardizedApi.get.mockResolvedValue({ items: [] });
    render(<SessionTransferHistorySection clientId={1001} />);
    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.CLIENTS.SESSION_TRANSFER_HISTORY(1001)
      );
    });
    expect(await screen.findByTestId('empty')).toHaveTextContent(
      SESSION_TRANSFER_HISTORY_UI.EMPTY_TITLE
    );
  });
});
