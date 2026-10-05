/**
 * 어드민 수동 발송 폼 — 전체 내담자+제외, 확인 모달, 서버 상한({{max}})·폴백, 409 재확인, 진행 폴링 세션 유지.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

jest.mock('../../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../../../../api/admin/manualNotificationApi', () => {
  const actual = jest.requireActual('../../../../api/admin/manualNotificationApi');
  return {
    __esModule: true,
    ...actual,
    searchRecipients: jest.fn().mockResolvedValue([]),
    fetchCommonCodeTemplates: jest.fn().mockResolvedValue([]),
    fetchLiveTemplates: jest.fn().mockResolvedValue([]),
    fetchManualNotificationConfig: jest.fn(),
    previewManualNotificationJob: jest.fn(),
    createManualNotificationJob: jest.fn(),
    fetchManualNotificationJob: jest.fn()
  };
});

import {
  searchRecipients,
  fetchManualNotificationConfig,
  previewManualNotificationJob,
  createManualNotificationJob,
  fetchManualNotificationJob,
  MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS
} from '../../../../api/admin/manualNotificationApi';
import { SESSION_ACTIVITY_PROGRAMMATIC_EVENT } from '../../../../constants/session';

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title }) => (isOpen ? (
    <div role="dialog" aria-label={title}>
      <div data-testid="modal-body">{children}</div>
      <div data-testid="modal-actions">{actions}</div>
    </div>
  ) : null)
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    type = 'button',
    loading,
    loadingText: _ignoredLoadingText, // eslint-disable-line no-unused-vars
    variant: _ignoredVariant, // eslint-disable-line no-unused-vars
    size: _ignoredSize, // eslint-disable-line no-unused-vars
    preventDoubleClick: _ignoredPrevent, // eslint-disable-line no-unused-vars
    ...rest
  }) => (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled || loading} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...',
  mapErpVariantToMg: (variant) => variant,
  mapErpSizeToMg: (size) => size
}));

jest.mock('../RecipientPicker', () => ({
  __esModule: true,
  default: ({ value = [], onChange, maxCount, requirePhone = true }) => (
    <div data-testid="recipient-picker" data-max={maxCount} data-require-phone={String(requirePhone)}>
      <button
        type="button"
        data-testid="add-recipient"
        onClick={() => onChange([
          ...value,
          { userId: 201 + value.length, name: '김내담', phoneMasked: '010****5678', role: 'CLIENT', hasPhone: true }
        ])}
      >
        add
      </button>
    </div>
  )
}));

jest.mock('react-i18next', () => {
  const { translateKo } = jest.requireActual('../../../../testUtils/manualNotificationKoTranslate');
  return {
    __esModule: true,
    useTranslation: () => ({ t: translateKo })
  };
});

import ManualNotificationForm from '../ManualNotificationForm';

const PREVIEW = Object.freeze({
  finalCount: 3,
  excludedCount: 1,
  ineligibleCount: 2,
  ineligibleReasons: { NO_PHONE: 1, NO_MARKETING_CONSENT: 1 },
  maxRecipients: 500,
  previewRecipients: [
    { userId: 1, nameMasked: '김*수', phoneMasked: '010-****-1111' },
    { userId: 2, nameMasked: '이*희', phoneMasked: '010-****-2222' }
  ],
  messagePreview: { content: '안내 문자입니다.' },
  snapshotToken: 'snap-all'
});

const fillSms = () => {
  fireEvent.change(document.getElementById('mg-manual-notif-sms-content'), { target: { value: '안내 문자입니다.' } });
  fireEvent.change(document.getElementById('mg-manual-notif-reason'), { target: { value: '정기 안내 발송 — 운영팀 승인' } });
};

describe('ManualNotificationForm — 발송 작업 흐름', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchManualNotificationConfig.mockResolvedValue({ maxRecipients: 300, previewSize: 5, maxExclusions: 5000 });
  });

  it('수신자 상한 문구는 서버 값으로 {{max}} 를 채운다', async() => {
    render(<ManualNotificationForm />);
    expect(await screen.findByText('수신자 선택 (최대 300명)')).toBeInTheDocument();
    expect(screen.getByTestId('recipient-picker')).toHaveAttribute('data-max', '300');
  });

  it('서버 상한을 못 받으면 폴백 500 을 쓴다', async() => {
    fetchManualNotificationConfig.mockRejectedValueOnce(new Error('network'));
    render(<ManualNotificationForm />);
    await waitFor(() => expect(fetchManualNotificationConfig).toHaveBeenCalled());
    expect(MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS).toBe(500);
    expect(screen.getByText('수신자 선택 (최대 500명)')).toBeInTheDocument();
    expect(screen.getByTestId('recipient-picker')).toHaveAttribute('data-max', '500');
  });

  it('전체 내담자 모드: 제외 id 만 보내고, 확인 모달에 서버 확정 인원·제외·미리보기를 보여 준 뒤 「3명에게 발송」 으로만 작업을 만든다', async() => {
    previewManualNotificationJob.mockResolvedValueOnce(PREVIEW);
    createManualNotificationJob.mockResolvedValueOnce({ jobId: 'job-all', status: 'PENDING', totalCount: 3 });
    fetchManualNotificationJob.mockResolvedValue({ jobId: 'job-all', status: 'RUNNING', totalCount: 3, sentCount: 1, failedCount: 0, remainingCount: 2 });

    render(<ManualNotificationForm />);
    fireEvent.click(screen.getByTestId('tab-chip-row-ALL_CLIENTS'));
    expect(screen.getByTestId('manual-notif-all-mode-hint')).toBeInTheDocument();
    expect(document.getElementById('mg-manual-notif-phone-input')).not.toBeInTheDocument();
    await waitFor(() => expect(searchRecipients).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'CLIENT' })));
    expect(screen.getByTestId('recipient-picker')).toHaveAttribute('data-require-phone', 'false');

    fireEvent.click(screen.getByTestId('add-recipient'));
    fillSms();
    fireEvent.click(screen.getByText('발송 대상 확인'));

    const dialog = await screen.findByRole('dialog', { name: '발송 확인' });
    const preview = previewManualNotificationJob.mock.calls[0][0];
    expect(preview).toEqual(expect.objectContaining({
      channel: 'SMS',
      recipientMode: 'ALL_CLIENTS',
      excludeIds: [201],
      content: '안내 문자입니다.',
      marketing: false
    }));
    expect(preview.userIds).toBeUndefined();
    expect(preview.phoneNumbers).toBeUndefined();
    expect(createManualNotificationJob).not.toHaveBeenCalled();

    expect(within(dialog).getByTestId('manual-notif-job-final-count')).toHaveTextContent('3명');
    expect(within(dialog).getByText('김*수')).toBeInTheDocument();
    expect(within(dialog).getByText('010-****-1111')).toBeInTheDocument();
    expect(within(dialog).getByText(/휴대전화 없음 1/)).toBeInTheDocument();
    expect(within(dialog).getByText('안내 문자입니다.')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByText('3명에게 발송'));
    await waitFor(() => expect(createManualNotificationJob).toHaveBeenCalledTimes(1));
    const created = createManualNotificationJob.mock.calls[0][0];
    expect(created).toEqual(expect.objectContaining({
      recipientMode: 'ALL_CLIENTS',
      excludeIds: [201],
      snapshotToken: 'snap-all',
      idempotencyKey: expect.any(String)
    }));
    await waitFor(() => expect(screen.getByTestId('manual-notif-job-progress'))
      .toHaveTextContent('전체 3명 · 성공 1 · 실패 0 · 남음 2'));
  });

  it('409 RECIPIENT_SET_CHANGED 면 발송하지 않고 「다시 확인」 으로 새 미리보기를 받는다', async() => {
    previewManualNotificationJob
      .mockResolvedValueOnce(PREVIEW)
      .mockResolvedValueOnce({ ...PREVIEW, finalCount: 2, snapshotToken: 'snap-2' });
    const conflict = new Error('확인한 뒤 발송 대상이 바뀌었습니다.');
    conflict.status = 409;
    conflict.response = { data: { errorCode: 'RECIPIENT_SET_CHANGED', message: '발송 대상이 바뀌었습니다. 다시 확인해 주세요.' } };
    createManualNotificationJob.mockRejectedValueOnce(conflict);

    render(<ManualNotificationForm />);
    fireEvent.click(screen.getByTestId('tab-chip-row-ALL_CLIENTS'));
    fillSms();
    fireEvent.click(screen.getByText('발송 대상 확인'));
    let dialog = await screen.findByRole('dialog', { name: '발송 확인' });
    fireEvent.click(within(dialog).getByText('3명에게 발송'));

    expect(await within(dialog).findByText('발송 대상이 바뀌었습니다. 다시 확인해 주세요.')).toBeInTheDocument();
    expect(within(dialog).queryByText('3명에게 발송')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByText('다시 확인'));

    dialog = await screen.findByRole('dialog', { name: '발송 확인' });
    expect(await within(dialog).findByText('2명에게 발송')).toBeInTheDocument();
    expect(previewManualNotificationJob).toHaveBeenCalledTimes(2);
    expect(fetchManualNotificationJob).not.toHaveBeenCalled();
  });

  it('상한 초과(422) 는 서버 메시지(상한 값 포함)를 폼에 보여 준다', async() => {
    const limit = new Error('한 번에 최대 300명까지 발송할 수 있습니다. (발송 대상 301명)');
    limit.status = 422;
    limit.response = { data: { errorCode: 'RECIPIENTS_LIMIT_EXCEEDED', message: '한 번에 최대 300명까지 발송할 수 있습니다. (발송 대상 301명)' } };
    previewManualNotificationJob.mockRejectedValueOnce(limit);

    render(<ManualNotificationForm />);
    fireEvent.click(screen.getByTestId('tab-chip-row-ALL_CLIENTS'));
    fillSms();
    fireEvent.click(screen.getByText('발송 대상 확인'));

    expect(await screen.findByTestId('manual-notif-form-error')).toHaveTextContent('최대 300명');
    expect(screen.queryByRole('dialog', { name: '발송 확인' })).not.toBeInTheDocument();
  });

  it('진행 폴링마다 세션 활동 이벤트를 보내고, 종료되면 수신자별 결과를 받아 결과 모달을 연다', async() => {
    jest.useFakeTimers();
    try {
      const activity = jest.fn();
      window.addEventListener(SESSION_ACTIVITY_PROGRAMMATIC_EVENT, activity);
      previewManualNotificationJob.mockResolvedValueOnce({ ...PREVIEW, finalCount: 1 });
      createManualNotificationJob.mockResolvedValueOnce({ jobId: 'job-poll', status: 'PENDING', totalCount: 1 });
      const running = { jobId: 'job-poll', status: 'RUNNING', totalCount: 1, sentCount: 0, failedCount: 0, remainingCount: 1 };
      const done = { ...running, status: 'COMPLETED', sentCount: 1, remainingCount: 0, channel: 'SMS' };
      fetchManualNotificationJob
        .mockResolvedValueOnce(running)
        .mockResolvedValueOnce(done)
        .mockResolvedValueOnce({
          ...done,
          records: [{ seq: 0, userId: 1, nameMasked: '김*수', phoneMasked: '010-****-1111', status: 'SENT' }]
        });

      render(<ManualNotificationForm />);
      fireEvent.click(screen.getByTestId('tab-chip-row-ALL_CLIENTS'));
      fillSms();
      fireEvent.click(screen.getByText('발송 대상 확인'));
      const dialog = await screen.findByRole('dialog', { name: '발송 확인' });
      fireEvent.click(within(dialog).getByText('1명에게 발송'));

      await waitFor(() => expect(fetchManualNotificationJob).toHaveBeenCalledTimes(1));
      expect(activity).toHaveBeenCalledTimes(1);

      await act(async() => {
        jest.advanceTimersByTime(2000);
      });
      await waitFor(() => expect(fetchManualNotificationJob).toHaveBeenCalledTimes(3));
      expect(activity).toHaveBeenCalledTimes(2);
      expect(fetchManualNotificationJob).toHaveBeenLastCalledWith('job-poll', { includeRecords: true });
      expect(await screen.findByRole('dialog', { name: '발송 결과' })).toBeInTheDocument();
      window.removeEventListener(SESSION_ACTIVITY_PROGRAMMATIC_EVENT, activity);
    } finally {
      jest.useRealTimers();
    }
  });
});
