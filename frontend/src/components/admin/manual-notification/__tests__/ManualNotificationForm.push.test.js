/**
 * 어드민 수동 발송 폼 — 푸시 채널(2026-05-25) 단위 테스트.
 *
 * - 채널 선택 라디오에 "푸시 알림" 옵션이 노출되는지
 * - 푸시 선택 시 제목·본문 input/textarea 가 렌더링되는지
 * - 5명 이하는 즉시 발송 → `sendPushBatch` 호출 + 결과 모달 노출
 * - SKIPPED(PUSH_NO_TOKEN) 행이 결과 모달 스킵 상세 섹션에 표기되는지
 *
 * @author MindGarden
 * @since 2026-05-25
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

// 1. api 모듈을 통째로 mock — sendPushBatch / sendSmsBatch / sendAlimtalkBatch 모두 jest.fn 으로.
jest.mock('../../../../api/admin/manualNotificationApi', () => {
  const actual = jest.requireActual('../../../../api/admin/manualNotificationApi');
  return {
    __esModule: true,
    ...actual,
    searchRecipients: jest.fn().mockResolvedValue([]),
    fetchCommonCodeTemplates: jest.fn().mockResolvedValue([]),
    fetchLiveTemplates: jest.fn().mockResolvedValue([]),
    sendSmsBatch: jest.fn(),
    sendAlimtalkBatch: jest.fn(),
    sendPushBatch: jest.fn()
  };
});

import {
  sendPushBatch,
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
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

// 3. BadgeSelect — 라벨로 채널을 선택할 수 있도록 button 으로 mock.
jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, 'aria-label': ariaLabel }) => (
    <div role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={String(value) === String(opt.value)}
          onClick={() => onChange(opt.value)}
          data-testid={`channel-${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

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
jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts, opts) => {
      const hasDefault = typeof defOrOpts === 'string';
      const variables = hasDefault ? (opts || {}) : (defOrOpts || {});
      const fallback = hasDefault
        ? defOrOpts
        : (variables.defaultValue || key);
      return Object.entries(variables).reduce(
        (acc, [name, value]) => acc.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
        fallback
      );
    }
  })
}));

import ManualNotificationForm from '../ManualNotificationForm';

const setup = (props = {}) => render(<ManualNotificationForm onBatchSent={jest.fn()} {...props} />);

const selectPushChannel = () => {
  fireEvent.click(screen.getByTestId('channel-PUSH'));
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
    expect(screen.getByTestId('channel-PUSH')).toHaveTextContent('푸시 알림');
  });

  it('푸시 채널 선택 시 제목/본문 입력 필드가 렌더링된다', () => {
    setup();
    selectPushChannel();
    expect(document.getElementById('mg-manual-notif-push-title')).toBeInTheDocument();
    expect(document.getElementById('mg-manual-notif-push-body')).toBeInTheDocument();
    // SMS 본문 textarea 는 사라져야 한다.
    expect(document.getElementById('mg-manual-notif-sms-content')).not.toBeInTheDocument();
  });

  it('5명 이하 + 모든 필수 필드 입력 시 즉시 sendPushBatch 호출 + 결과 모달 노출', async() => {
    sendPushBatch.mockResolvedValueOnce({
      batchId: 'batch-1',
      channel: 'PUSH',
      startedAt: '2026-05-25T22:00:00',
      totalCount: 1,
      successCount: 1,
      failureCount: 0,
      results: [
        {
          userId: 101,
          name: '홍길동',
          phoneMasked: '[push]',
          success: true,
          errorCode: null,
          errorMessage: null,
          solapiGroupId: null,
          solapiMessageId: 'rcpt-101',
          logId: 8001
        }
      ]
    });

    setup();
    selectPushChannel();
    fireEvent.click(screen.getByTestId('add-recipient'));

    fireEvent.change(document.getElementById('mg-manual-notif-push-title'), {
      target: { value: '운영 점검 안내' }
    });
    fireEvent.change(document.getElementById('mg-manual-notif-push-body'), {
      target: { value: '내일 새벽 2시 점검 예정입니다.' }
    });
    fillReason();

    fireEvent.click(screen.getByText('발송하기'));

    await waitFor(() => expect(sendPushBatch).toHaveBeenCalledTimes(1));

    const payload = sendPushBatch.mock.calls[0][0];
    expect(payload.userIds).toEqual([101]);
    expect(payload.title).toBe('운영 점검 안내');
    expect(payload.body).toBe('내일 새벽 2시 점검 예정입니다.');
    expect(payload.reason).toContain('운영팀 결정');

    // 결과 모달이 노출되어야 한다(UnifiedModal mock 의 dialog 노출).
    await waitFor(() =>
      expect(screen.getAllByRole('dialog').some((d) => d.getAttribute('aria-label') === '발송 결과'))
        .toBe(true)
    );
  });

  it('SKIPPED(PUSH_NO_TOKEN) 결과는 결과 모달 "스킵 상세" 섹션에 errorCode/사유와 함께 표기된다', async() => {
    sendPushBatch.mockResolvedValueOnce({
      batchId: 'batch-2',
      channel: 'PUSH',
      startedAt: '2026-05-25T22:05:00',
      totalCount: 1,
      successCount: 0,
      failureCount: 1,
      results: [
        {
          userId: 101,
          name: '홍길동',
          phoneMasked: '[push]',
          success: false,
          errorCode: MANUAL_NOTIFICATION_ERROR_CODES.PUSH_NO_TOKEN,
          errorMessage: '푸시 토큰이 없는 사용자',
          solapiGroupId: null,
          solapiMessageId: null,
          logId: 8002
        }
      ]
    });

    setup();
    selectPushChannel();
    fireEvent.click(screen.getByTestId('add-recipient'));
    fireEvent.change(document.getElementById('mg-manual-notif-push-title'), { target: { value: '공지' } });
    fireEvent.change(document.getElementById('mg-manual-notif-push-body'), { target: { value: '본문' } });
    fillReason();
    fireEvent.click(screen.getByText('발송하기'));

    await waitFor(() => expect(sendPushBatch).toHaveBeenCalledTimes(1));

    const resultDialog = await screen.findByRole('dialog', { name: '발송 결과' });
    expect(within(resultDialog).getByText('스킵 상세')).toBeInTheDocument();
    expect(within(resultDialog).getByText('PUSH_NO_TOKEN')).toBeInTheDocument();
  });
});
