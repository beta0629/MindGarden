/**
 * WithdrawalRequestModal 회귀 테스트.
 *
 * 검증 범위:
 *  - 디자이너 §B 시안 — 비밀번호/사유/공동 본문 옵션/동의 체크 필드
 *  - 폼 유효성 — 비밀번호 미입력, 사유 미선택, 동의 미체크 시 제출 버튼 비활성
 *  - Q12-b — deleteCommunityBody 체크박스 ↔ API 페이로드 정합
 *  - 성공/실패 — mypageApi.requestWithdrawal mock + notification + onSuccess + onClose
 *  - UnifiedModal SSOT — `role="dialog"` 단일 인스턴스 가드
 *
 * react-i18next 는 테스트 환경에서 t(key)=key 로 mock 하여 시드 키 결합도 0.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawalRequestModal from '../WithdrawalRequestModal';
import mypageApi from '../../../../utils/mypageApi';
import notificationManager from '../../../../utils/notification';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
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

describe('WithdrawalRequestModal', () => {
  const noop = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    mypageApi.requestWithdrawal.mockResolvedValue({
      success: true,
      data: { lifecycleState: 'WITHDRAWAL_PENDING' }
    });
  });

  const renderOpen = (props = {}) =>
    render(
      <WithdrawalRequestModal
        isOpen
        onClose={noop}
        onSuccess={noop}
        {...props}
      />
    );

  const fillValid = async (dialog) => {
    await userEvent.type(
      within(dialog).getByTestId('mypage-withdrawal-password-input'),
      'Secret1!'
    );
    await userEvent.click(
      within(dialog).getByTestId('mypage-withdrawal-reason-LOW_USAGE')
    );
    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-agreement'));
  };

  it('UnifiedModal 단일 dialog 로 렌더링되고 모든 핵심 필드가 노출된다', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // 시드 키 가시성으로 노출 검증 (i18n key=mock 그대로)
    expect(within(dialog).getByText('withdrawal.modal.title')).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('mypage-withdrawal-password-input')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('mypage-withdrawal-reason-fieldset')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('mypage-withdrawal-delete-community-body')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('mypage-withdrawal-agreement')
    ).toBeInTheDocument();
    // W3 안내 + Q3 30일 유예 메시지 노출 (시드 키 기준)
    expect(
      within(dialog).getByText('withdrawal.modal.warningDesc')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('withdrawal.modal.emailTombstoneDesc')
    ).toBeInTheDocument();
  });

  it('초기 상태에서 제출 버튼은 비활성화 (비밀번호·사유·동의 모두 충족 필요)', () => {
    renderOpen();
    const submit = screen.getByTestId('mypage-withdrawal-submit');
    expect(submit).toBeDisabled();
  });

  it('비밀번호 + 사유 + 동의를 모두 채우면 제출 버튼 활성화', async () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    await fillValid(dialog);
    await waitFor(() => {
      expect(within(dialog).getByTestId('mypage-withdrawal-submit')).not.toBeDisabled();
    });
  });

  it('OTHER 선택 시 기타 사유 입력란이 추가로 노출되며 비어있으면 제출 비활성', async () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    await userEvent.type(
      within(dialog).getByTestId('mypage-withdrawal-password-input'),
      'Secret1!'
    );
    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-reason-OTHER'));
    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-agreement'));

    const otherTextarea = within(dialog).getByTestId('mypage-withdrawal-other-reason');
    expect(otherTextarea).toBeInTheDocument();
    expect(within(dialog).getByTestId('mypage-withdrawal-submit')).toBeDisabled();

    await userEvent.type(otherTextarea, '본인 사유입니다');
    await waitFor(() => {
      expect(within(dialog).getByTestId('mypage-withdrawal-submit')).not.toBeDisabled();
    });
  });

  it('Q12-b: deleteCommunityBody 체크박스 ON → API 페이로드에 true 전달', async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    renderOpen({ onSuccess, onClose });
    const dialog = screen.getByRole('dialog');
    await fillValid(dialog);
    await userEvent.click(
      within(dialog).getByTestId('mypage-withdrawal-delete-community-body')
    );

    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-submit'));

    await waitFor(() => {
      expect(mypageApi.requestWithdrawal).toHaveBeenCalledTimes(1);
    });
    const [password, reason, deleteBody] = mypageApi.requestWithdrawal.mock.calls[0];
    expect(password).toBe('Secret1!');
    // t(key)=key mock → reason 코드 매핑된 시드 키 전송
    expect(reason).toBe('withdrawal.modal.reason.LOW_USAGE');
    expect(deleteBody).toBe(true);
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('Q12-b 기본: 체크박스 OFF → API 페이로드에 false 전달', async () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    await fillValid(dialog);

    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-submit'));

    await waitFor(() => {
      expect(mypageApi.requestWithdrawal).toHaveBeenCalledTimes(1);
    });
    expect(mypageApi.requestWithdrawal.mock.calls[0][2]).toBe(false);
  });

  it('API 실패 시 에러 alert + notificationManager.error 표시', async () => {
    mypageApi.requestWithdrawal.mockRejectedValueOnce(new Error('서버 통신 실패'));
    renderOpen();
    const dialog = screen.getByRole('dialog');
    await fillValid(dialog);

    await userEvent.click(within(dialog).getByTestId('mypage-withdrawal-submit'));

    await waitFor(() => {
      expect(
        within(dialog).getByTestId('mypage-withdrawal-error')
      ).toBeInTheDocument();
    });
    expect(
      within(dialog).getByTestId('mypage-withdrawal-error').textContent
    ).toContain('서버 통신 실패');
    expect(notificationManager.show).toHaveBeenCalledWith('서버 통신 실패', 'error');
  });

  it('취소 버튼 클릭 시 onClose 호출되며 API 호출 없음', async () => {
    const onClose = jest.fn();
    renderOpen({ onClose });
    const dialog = screen.getByRole('dialog');
    await userEvent.click(
      within(dialog).getByText('withdrawal.modal.cancelButton')
    );
    expect(onClose).toHaveBeenCalled();
    expect(mypageApi.requestWithdrawal).not.toHaveBeenCalled();
  });

  it('isOpen=false 면 null 반환 (모달 미렌더)', () => {
    const { container } = render(
      <WithdrawalRequestModal isOpen={false} onClose={noop} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UnifiedModal 인스턴스가 한 개만 존재 (커스텀 모달 0개)', () => {
    renderOpen();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});
