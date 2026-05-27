/**
 * WithdrawalPendingWidget 회귀 테스트.
 *
 * 검증 범위:
 *  - 30일 유예 카운트다운 (computeDaysRemaining 순수 함수)
 *  - 만료 일시 포맷 (YYYY-MM-DD HH:mm)
 *  - 탈퇴 취소 버튼 — API 성공/실패 → 알림 + onCancelled 콜백
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawalPendingWidget, {
  computeDaysRemaining
} from '../WithdrawalPendingWidget';
import mypageApi from '../../../../utils/mypageApi';
import notificationManager from '../../../../utils/notification';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts && typeof opts === 'object') {
        return `${key}::${JSON.stringify(opts)}`;
      }
      return key;
    },
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

jest.mock('../../../../utils/mypageApi', () => ({
  __esModule: true,
  default: {
    requestWithdrawal: jest.fn(),
    cancelWithdrawal: jest.fn(),
    getWithdrawalStatus: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn()
  }
}));

describe('WithdrawalPendingWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mypageApi.cancelWithdrawal.mockResolvedValue({ success: true });
  });

  describe('computeDaysRemaining (순수 함수)', () => {
    it('25일 뒤 → 25일 반환', () => {
      const now = new Date('2026-06-10T00:00:00Z');
      const expires = new Date('2026-07-05T00:00:00Z').toISOString();
      expect(computeDaysRemaining(expires, () => now)).toBe(25);
    });
    it('과거 시각 → 0', () => {
      const now = new Date('2026-06-10T00:00:00Z');
      const expires = new Date('2026-06-01T00:00:00Z').toISOString();
      expect(computeDaysRemaining(expires, () => now)).toBe(0);
    });
    it('null 입력 → null', () => {
      expect(computeDaysRemaining(null)).toBeNull();
      expect(computeDaysRemaining(undefined)).toBeNull();
    });
    it('잘못된 날짜 → null', () => {
      expect(computeDaysRemaining('not-a-date')).toBeNull();
    });
  });

  it('카운트다운 + 만료 일시가 노출된다', () => {
    const now = new Date('2026-06-10T09:00:00Z');
    render(
      <WithdrawalPendingWidget
        withdrawalRequestedAt="2026-06-10T09:00:00"
        withdrawalExpiresAt="2026-07-10T09:00:00"
        nowProvider={() => now}
      />
    );

    expect(screen.getByTestId('mypage-withdrawal-pending-widget')).toBeInTheDocument();
    const badge = screen.getByTestId('mypage-withdrawal-days-remaining');
    // mock t() 가 옵션 객체 직렬화 — days 키 포함 여부 검증
    expect(badge.textContent).toMatch(/"days":\d+/);
    expect(screen.getByTestId('mypage-withdrawal-expires-at').textContent).toMatch(
      /2026-07-10/
    );
    expect(screen.getByTestId('mypage-withdrawal-cancel-button')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 mypageApi.cancelWithdrawal 호출 + onCancelled 콜백 + 성공 알림', async () => {
    const onCancelled = jest.fn();
    render(
      <WithdrawalPendingWidget
        withdrawalRequestedAt="2026-06-10T09:00:00"
        withdrawalExpiresAt="2026-07-10T09:00:00"
        onCancelled={onCancelled}
      />
    );

    await userEvent.click(screen.getByTestId('mypage-withdrawal-cancel-button'));

    await waitFor(() => {
      expect(mypageApi.cancelWithdrawal).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onCancelled).toHaveBeenCalled();
    });
    expect(notificationManager.show).toHaveBeenCalledWith(
      'withdrawal.pending.cancelSuccess',
      'success'
    );
  });

  it('취소 API 실패 시 onCancelled 미호출 + 에러 알림', async () => {
    mypageApi.cancelWithdrawal.mockRejectedValueOnce(new Error('네트워크 오류'));
    const onCancelled = jest.fn();
    render(
      <WithdrawalPendingWidget
        withdrawalExpiresAt="2026-07-10T09:00:00"
        onCancelled={onCancelled}
      />
    );

    await userEvent.click(screen.getByTestId('mypage-withdrawal-cancel-button'));

    await waitFor(() => {
      expect(notificationManager.show).toHaveBeenCalledWith('네트워크 오류', 'error');
    });
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
