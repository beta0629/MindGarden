/**
 * WithdrawalPendingBanner 회귀 테스트 (전역 배너).
 *
 * 검증 범위:
 *  - sessionUser 없음 (비로그인) → null
 *  - sessionUser 있음 + lifecycleState != WITHDRAWAL_PENDING → null
 *  - sessionUser 있음 + lifecycleState = WITHDRAWAL_PENDING → 배너 + 링크 노출
 *  - status API envelope 응답 호환
 *  - status API 실패 → 사일런트 (비노출)
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionContext } from '../../../contexts/SessionContext';
import WithdrawalPendingBanner from '../WithdrawalPendingBanner';
import mypageApi from '../../../utils/mypageApi';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) =>
      opts && typeof opts === 'object' ? `${key}::${JSON.stringify(opts)}` : key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

jest.mock('../../../utils/mypageApi', () => ({
  __esModule: true,
  default: {
    getWithdrawalStatus: jest.fn(),
    cancelWithdrawal: jest.fn(),
    requestWithdrawal: jest.fn()
  }
}));

const buildSessionValue = (overrides = {}) => ({
  user: null,
  sessionInfo: null,
  isLoading: false,
  isLoggedIn: false,
  ...overrides
});

const renderWithSession = (sessionValue) =>
  render(
    <MemoryRouter>
      <SessionContext.Provider value={sessionValue}>
        <WithdrawalPendingBanner />
      </SessionContext.Provider>
    </MemoryRouter>
  );

describe('WithdrawalPendingBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('비로그인 (sessionUser=null) 이면 배너 미노출 + API 미호출', async () => {
    renderWithSession(buildSessionValue({ user: null }));
    await waitFor(() => {
      expect(mypageApi.getWithdrawalStatus).not.toHaveBeenCalled();
    });
    expect(screen.queryByTestId('withdrawal-pending-banner')).not.toBeInTheDocument();
  });

  it('lifecycleState=ACTIVE 인 경우 배너 미노출', async () => {
    mypageApi.getWithdrawalStatus.mockResolvedValue({
      lifecycleState: 'ACTIVE',
      cancellable: false,
      withdrawalExpiresAt: null
    });
    renderWithSession(buildSessionValue({ user: { id: 1, role: 'CLIENT' } }));

    await waitFor(() => {
      expect(mypageApi.getWithdrawalStatus).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('withdrawal-pending-banner')).not.toBeInTheDocument();
  });

  it('lifecycleState=WITHDRAWAL_PENDING 이면 배너 + 마이페이지 보안 탭 링크 노출', async () => {
    mypageApi.getWithdrawalStatus.mockResolvedValue({
      lifecycleState: 'WITHDRAWAL_PENDING',
      cancellable: true,
      withdrawalRequestedAt: '2026-06-10T00:00:00',
      withdrawalExpiresAt: '2026-07-10T00:00:00'
    });
    renderWithSession(buildSessionValue({ user: { id: 42, role: 'CLIENT' } }));

    const banner = await screen.findByTestId('withdrawal-pending-banner');
    expect(banner).toBeInTheDocument();
    const link = screen.getByTestId('withdrawal-pending-banner-link');
    expect(link).toHaveAttribute('href', '/mypage?tab=security');
  });

  it('envelope 응답 형태 ({success, data:{lifecycleState}}) 도 정상 파싱', async () => {
    mypageApi.getWithdrawalStatus.mockResolvedValue({
      success: true,
      data: {
        lifecycleState: 'WITHDRAWAL_PENDING',
        cancellable: true,
        withdrawalExpiresAt: '2026-07-10T00:00:00'
      }
    });
    renderWithSession(buildSessionValue({ user: { id: 99, role: 'CLIENT' } }));

    const banner = await screen.findByTestId('withdrawal-pending-banner');
    expect(banner).toBeInTheDocument();
  });

  it('status API 실패 시 사일런트 — 배너 미노출', async () => {
    mypageApi.getWithdrawalStatus.mockRejectedValue(new Error('500'));
    renderWithSession(buildSessionValue({ user: { id: 7, role: 'CLIENT' } }));

    await waitFor(() => {
      expect(mypageApi.getWithdrawalStatus).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('withdrawal-pending-banner')).not.toBeInTheDocument();
  });
});
