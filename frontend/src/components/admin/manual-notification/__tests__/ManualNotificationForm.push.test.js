/**
 * 어드민 수동 발송 폼 — 푸시 채널 단위 테스트.
 *
 * - 채널 선택 탭(TabChipRow)에 "푸시 알림" 옵션이 노출되는지
 * - 푸시 선택 시 제목·본문 input/textarea 가 렌더링되는지
 * - 대상 확인 → 확인 모달 「○명에게 발송」 → 발송 작업 생성(payload 검증) → 종료 시 결과 모달
 * - SKIPPED(PUSH_NO_TOKEN) 기록이 결과 모달 스킵 상세 섹션에 표기되는지
 *
 * @author MindGarden
 * @since 2026-05-25
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

// 0. i18n 인스턴스 — manualNotificationApi 가 import 하므로 테스트 환경용 최소 mock.
jest.mock('../../../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

// 1. api 모듈 mock — 발송 작업(preview/create/fetch) 은 jest.fn.
jest.mock('../../../../api/admin/manualNotificationApi', () => {
  const actual = jest.requireActual('../../../../api/admin/manualNotificationApi');
  return {
    __esModule: true,
    ...actual,
    searchRecipients: jest.fn().mockResolvedValue([]),
    fetchCommonCodeTemplates: jest.fn().mockResolvedValue([]),
    fetchLiveTemplates: jest.fn().mockResolvedValue([]),
    fetchManualNotificationConfig: jest.fn().mockResolvedValue({ maxRecipients: 500, previewSize: 5 }),
    previewManualNotificationJob: jest.fn(),
    createManualNotificationJob: jest.fn(),
    fetchManualNotificationJob: jest.fn()
  };
});

import {
  previewManualNotificationJob,
  createManualNotificationJob,
  fetchManualNotificationJob,
  MANUAL_NOTIFICATION_ERROR_CODES
} from '../../../../api/admin/manualNotificationApi';

// 2. UnifiedModal — 자체 모달 금지 정책 준수, 단순 dialog 로 mock.
jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
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
    ...rest
  }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : 'false'}
      {...rest}
    >
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

// 3. 채널 선택은 실제 TabChipRow (MGButton mock 이 data-testid 를 그대로 전달 → tab-chip-row-{채널}).

// 4. RecipientPicker — 테스트 편의 위해 props.value 변경 트리거를 노출하는 mock.
jest.mock('../RecipientPicker', () => ({
  __esModule: true,
  default: ({ value = [], onChange }) => (
    <div data-testid="recipient-picker">
      <button
        type="button"
        data-testid="add-recipient"
        onClick={() => onChange([
          ...value,
          { userId: 101, name: '홍길동', phoneMasked: '010****1234', role: 'CLIENT', hasPhone: true }
        ])}
      >
        add-1
      </button>
      <span data-testid="recipient-count">{value.length}</span>
    </div>
  )
}));

// 5. BatchResultModal — 결과 노출 검증을 위해 실제 구현 사용. SKIPPED 분류는 실제 코드 검증 대상.
// 실제 ko(admin) 문구로 키를 풀어 라벨·placeholder 기반 쿼리가 운영 화면과 같게 동작하도록 한다.
jest.mock('react-i18next', () => {
  const { translateKo } = jest.requireActual('../../../../testUtils/manualNotificationKoTranslate');
  return {
    __esModule: true,
    useTranslation: () => ({ t: translateKo })
  };
});

import ManualNotificationForm from '../ManualNotificationForm';

const setup = (props = {}) => render(<ManualNotificationForm onBatchSent={jest.fn()} {...props} />);

const selectPushChannel = () => {
  fireEvent.click(screen.getByTestId('tab-chip-row-PUSH'));
};

const fillReason = (text = '운영팀 결정 사항 — 2026-05-25') => {
  fireEvent.change(screen.getByPlaceholderText(/발송 사유를 명확히/), { target: { value: text } });
};

describe('ManualNotificationForm — 푸시 채널', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('채널 옵션에 "푸시 알림" 이 포함된다', () => {
    setup();
    expect(screen.getByTestId('tab-chip-row-PUSH')).toHaveTextContent('푸시 알림');
  });

  it('푸시 채널 선택 시 제목/본문 입력 필드가 렌더링된다', () => {
    setup();
    selectPushChannel();
    expect(document.getElementById('mg-manual-notif-push-title')).toBeInTheDocument();
    expect(document.getElementById('mg-manual-notif-push-body')).toBeInTheDocument();
    // SMS 본문 textarea 는 사라져야 한다.
    expect(document.getElementById('mg-manual-notif-sms-content')).not.toBeInTheDocument();
  });

  const fillPushAndSubmit = async(title, body) => {
    setup();
    selectPushChannel();
    fireEvent.click(screen.getByTestId('add-recipient'));
    fireEvent.change(document.getElementById('mg-manual-notif-push-title'), { target: { value: title } });
    fireEvent.change(document.getElementById('mg-manual-notif-push-body'), { target: { value: body } });
    fillReason();
    fireEvent.click(screen.getByText('발송 대상 확인'));
    const confirmDialog = await screen.findByRole('dialog', { name: '발송 확인' });
    fireEvent.click(within(confirmDialog).getByText('1명에게 발송'));
  };

  const mockJobLifecycle = (record) => {
    previewManualNotificationJob.mockResolvedValueOnce({
      finalCount: 1,
      excludedCount: 0,
      ineligibleCount: 0,
      ineligibleReasons: {},
      maxRecipients: 500,
      previewRecipients: [{ userId: 101, nameMasked: '홍*동', phoneMasked: '[push]' }],
      messagePreview: { title: '운영 점검 안내', body: '본문' },
      snapshotToken: 'snap-1'
    });
    createManualNotificationJob.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING', totalCount: 1 });
    const sent = record.status === 'SENT' ? 1 : 0;
    const terminal = {
      jobId: 'job-1',
      channel: 'PUSH',
      status: 'COMPLETED',
      totalCount: 1,
      sentCount: sent,
      failedCount: 0,
      skippedCount: 1 - sent,
      remainingCount: 0
    };
    fetchManualNotificationJob
      .mockResolvedValueOnce(terminal)
      .mockResolvedValueOnce({ ...terminal, records: [record] });
  };

  it('대상 확인 → 「1명에게 발송」 → 발송 작업 생성 → 종료 시 결과 모달 노출', async() => {
    mockJobLifecycle({
      seq: 0, userId: 101, nameMasked: '홍*동', phoneMasked: '[push]', status: 'SENT', providerResultCode: 'OK'
    });

    await fillPushAndSubmit('운영 점검 안내', '내일 새벽 2시 점검 예정입니다.');

    await waitFor(() => expect(createManualNotificationJob).toHaveBeenCalledTimes(1));
    const previewPayload = previewManualNotificationJob.mock.calls[0][0];
    const payload = createManualNotificationJob.mock.calls[0][0];
    expect(payload.channel).toBe('PUSH');
    expect(payload.recipientMode).toBe('SELECTED');
    expect(payload.userIds).toEqual([101]);
    expect(payload.phoneNumbers).toBeUndefined();
    expect(payload.title).toBe('운영 점검 안내');
    expect(payload.body).toBe('내일 새벽 2시 점검 예정입니다.');
    expect(payload.reason).toContain('운영팀 결정');
    expect(payload.snapshotToken).toBe('snap-1');
    expect(payload.idempotencyKey).toEqual(expect.any(String));
    expect({ ...payload, snapshotToken: undefined, idempotencyKey: undefined })
      .toEqual({ ...previewPayload, snapshotToken: undefined, idempotencyKey: undefined });

    await screen.findByRole('dialog', { name: '발송 결과' });
  });

  it('SKIPPED(PUSH_NO_TOKEN) 기록은 결과 모달 "스킵 상세" 섹션에 errorCode 와 함께 표기된다', async() => {
    mockJobLifecycle({
      seq: 0,
      userId: 101,
      nameMasked: '홍*동',
      phoneMasked: '[push]',
      status: 'SKIPPED',
      errorCode: MANUAL_NOTIFICATION_ERROR_CODES.PUSH_NO_TOKEN,
      errorMessage: '푸시 토큰이 없는 사용자'
    });

    await fillPushAndSubmit('공지', '본문');

    const resultDialog = await screen.findByRole('dialog', { name: '발송 결과' });
    expect(within(resultDialog).getByText('스킵 상세')).toBeInTheDocument();
    expect(within(resultDialog).getByText('PUSH_NO_TOKEN')).toBeInTheDocument();
  });
});
