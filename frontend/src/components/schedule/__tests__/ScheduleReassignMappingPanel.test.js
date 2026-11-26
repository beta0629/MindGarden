/**
 * ScheduleReassignMappingPanel — 사유 칩·200자·확정 disabled·cancelRecommended 링크.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScheduleReassignMappingPanel, {
  isReassignReasonValid,
  resolveReassignReason
} from '../ScheduleReassignMappingPanel';
import {
  REASSIGN_REASON_CHIP_CUSTOM,
  REASSIGN_REASON_CHIPS,
  REASSIGN_REASON_MAX_LENGTH,
  REASSIGN_UI
} from '../../../constants/scheduleReassignMapping';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockSuccess = jest.fn();

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args)
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { success: (...args) => mockSuccess(...args), error: jest.fn(), warning: jest.fn() }
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, title }) => (isOpen ? (
    <div data-testid="schedule-reassign-mapping-panel" role="dialog">
      <h2>{title}</h2>
      {children}
    </div>
  ) : null)
}));

jest.mock('../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, 'aria-label': ariaLabel }) => (
    <div role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={String(value) === String(opt.value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../../common/coverChapter/useCoverDrawerFocus', () => ({
  __esModule: true,
  default: () => {}
}));

const schedule = {
  id: 501,
  mappingId: 100,
  packageName: '현재 패키지',
  totalSessions: 10,
  usedSessions: 1,
  remainingSessions: 9,
  sessionSequence: 1
};

const candidates = [
  {
    mappingId: 200,
    packageName: '다른 상품',
    status: 'ACTIVE',
    totalSessions: 10,
    usedSessions: 0,
    remainingSessions: 10
  },
  {
    mappingId: 201,
    packageName: '초기상담',
    status: 'ACTIVE',
    totalSessions: 1,
    usedSessions: 0,
    remainingSessions: 1
  }
];

const renderPanel = (props = {}) => render(
  <MemoryRouter>
    <ScheduleReassignMappingPanel
      isOpen
      onClose={jest.fn()}
      schedule={schedule}
      {...props}
    />
  </MemoryRouter>
);

describe('resolveReassignReason / isReassignReasonValid', () => {
  test('칩 선택 시 칩 라벨이 사유', () => {
    const chip = REASSIGN_REASON_CHIPS[0];
    expect(resolveReassignReason(chip.value, '')).toBe(chip.label);
    expect(isReassignReasonValid(resolveReassignReason(chip.value, ''))).toBe(true);
  });

  test('직접입력 공백이면 무효, 200자 초과 무효', () => {
    expect(isReassignReasonValid('')).toBe(false);
    expect(isReassignReasonValid('   ')).toBe(false);
    expect(isReassignReasonValid('ok')).toBe(true);
    expect(isReassignReasonValid('x'.repeat(REASSIGN_REASON_MAX_LENGTH + 1))).toBe(false);
    expect(resolveReassignReason(REASSIGN_REASON_CHIP_CUSTOM, '직접 사유')).toBe('직접 사유');
  });
});

describe('ScheduleReassignMappingPanel', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockSuccess.mockReset();
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/candidates')) {
        return Promise.resolve(candidates);
      }
      if (String(url).includes('/preview')) {
        return Promise.resolve({
          plannedSessionSequence: 1,
          originUsedAfter: 0,
          originRemainingAfter: 10,
          originTotalSessions: 10,
          targetUsedAfter: 1,
          targetRemainingAfter: 9,
          targetTotalSessions: 10,
          sessionWouldRestoreOnOrigin: true,
          cancelRecommended: false
        });
      }
      return Promise.resolve([]);
    });
  });

  test('후보 목록·현재 배정 비활성·초기상담 ACTIVE rem≥1 표시', async () => {
    renderPanel();
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.SCHEDULES.REASSIGN_MAPPING_CANDIDATES(501)
      );
    });
    expect(await screen.findByTestId('reassign-mapping-candidate-200')).toBeInTheDocument();
    expect(screen.getByTestId('reassign-mapping-candidate-201')).toBeInTheDocument();
    expect(screen.getByTestId('reassign-mapping-current')).toBeDisabled();
    expect(screen.getByText(REASSIGN_UI.DISCLAIMER)).toBeInTheDocument();
    expect(screen.queryByText(/매칭/)).not.toBeInTheDocument();
  });

  test('사유 없으면 확정 disabled, 칩 선택 후 확정 가능', async () => {
    renderPanel();
    await screen.findByTestId('reassign-mapping-candidate-200');
    fireEvent.click(screen.getByTestId('reassign-mapping-candidate-200'));
    fireEvent.click(screen.getByTestId('reassign-next'));
    await waitFor(() => expect(screen.getByTestId('reassign-next')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('reassign-next'));
    expect(await screen.findByTestId('reassign-confirm')).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: REASSIGN_REASON_CHIPS[2].label }));
    expect(screen.getByTestId('reassign-confirm')).not.toBeDisabled();

    mockPost.mockResolvedValueOnce({
      scheduleId: 501,
      originMappingId: 100,
      targetMappingId: 200,
      sessionSequence: 1,
      cancelRecommended: true
    });
    fireEvent.click(screen.getByTestId('reassign-confirm'));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.SCHEDULES.REASSIGN_MAPPING(501),
        { targetMappingId: 200, reason: REASSIGN_REASON_CHIPS[2].label }
      );
    });
    expect(mockSuccess).toHaveBeenCalledWith(REASSIGN_UI.SUCCESS_TOAST);
    const link = await screen.findByTestId('reassign-cancel-recommended-link');
    expect(link).toHaveAttribute('href', ADMIN_ROUTES.MAPPING_MANAGEMENT);
  });

  test('직접입력 max 200 · 닫기 라벨에 취소 단어 없음', async () => {
    renderPanel();
    await screen.findByTestId('reassign-mapping-candidate-200');
    fireEvent.click(screen.getByTestId('reassign-mapping-candidate-200'));
    fireEvent.click(screen.getByTestId('reassign-next'));
    await waitFor(() => expect(screen.getByTestId('reassign-next')).toBeEnabled());
    fireEvent.click(screen.getByTestId('reassign-next'));

    fireEvent.click(screen.getByRole('radio', { name: '직접 입력' }));
    const input = await screen.findByTestId('reassign-reason-input');
    fireEvent.change(input, { target: { value: 'a'.repeat(250) } });
    expect(input.value).toHaveLength(REASSIGN_REASON_MAX_LENGTH);
    expect(screen.getByTestId('reassign-reason-count')).toHaveTextContent(
      `${REASSIGN_REASON_MAX_LENGTH}/${REASSIGN_REASON_MAX_LENGTH}`
    );
    expect(screen.getByTestId('reassign-close')).toHaveTextContent('닫기');
    expect(screen.getByTestId('reassign-confirm')).toHaveTextContent('배정 변경');
  });
});
