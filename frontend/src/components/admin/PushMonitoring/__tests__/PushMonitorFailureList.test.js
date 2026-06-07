/**
 * PushMonitorFailureList — 단위 테스트.
 *
 * 검증 매트릭스:
 *  - F1: 빈 entries 시 EmptyState 노출
 *  - F2: 행 렌더 + retryable=false 인 항목의 재발송 버튼 disabled
 *  - F3: retryable 항목 재발송 클릭 시 UnifiedModal confirm 노출 → 확인 시 onResend 호출
 *  - F4: 모달 cancel 클릭 시 onResend 호출 없음 + 모달 닫힘
 *  - F5: PII 가드 — 백엔드 마스킹된 값 그대로 노출(추가 마스킹/평문 X)
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import PushMonitorFailureList from '../molecules/PushMonitorFailureList';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const buildEntry = (overrides = {}) => ({
  id: 1,
  source: 'BATCH',
  occurredAt: '2026-06-07T12:34:00',
  channel: 'ALIMTALK',
  templateCode: 'TPL_RESERVATION_CONFIRM',
  recipientPhoneMasked: '010-****-1234',
  errorCategory: 'EXTERNAL_FAILURE',
  errorCode: 'SEND_FAILED',
  errorMessage: 'Solapi 5xx',
  retryable: true,
  ...overrides
});

describe('PushMonitorFailureList', () => {
  test('F1: 빈 entries 시 EmptyState 노출', () => {
    render(<PushMonitorFailureList entries={[]} totalCount={0} onResend={jest.fn()} />);
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_EMPTY_TITLE)).toBeInTheDocument();
  });

  test('F2: retryable=false 행의 재발송 버튼은 disabled', () => {
    const entries = [
      buildEntry({ id: 11, retryable: true, templateCode: 'TPL_A' }),
      buildEntry({ id: 12, retryable: false, templateCode: 'TPL_B' })
    ];
    render(<PushMonitorFailureList entries={entries} totalCount={2} onResend={jest.fn()} />);
    const rows = screen.getAllByTestId('push-monitor-failure-row');
    expect(rows.length).toBe(2);
    const retryableButton = within(rows[0]).getByRole('button', {
      name: new RegExp(`TPL_A.*${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`)
    });
    const terminalButton = within(rows[1]).getByRole('button', {
      name: new RegExp(`TPL_B.*${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`)
    });
    expect(retryableButton).not.toBeDisabled();
    expect(terminalButton).toBeDisabled();
  });

  test('F3: 재발송 클릭 → 모달 confirm → onResend 호출', () => {
    const onResend = jest.fn();
    const entry = buildEntry({ id: 21, source: 'ADMIN_TEST', retryable: true });
    render(<PushMonitorFailureList entries={[entry]} totalCount={1} onResend={onResend} />);

    const button = screen.getByRole('button', {
      name: new RegExp(`${entry.templateCode}.*${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`)
    });
    act(() => {
      fireEvent.click(button);
    });

    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_TITLE)).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', {
      name: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CONFIRM
    });
    act(() => {
      fireEvent.click(confirmButton);
    });
    expect(onResend).toHaveBeenCalledWith(expect.objectContaining({ id: 21, source: 'ADMIN_TEST' }));
  });

  test('F4: 모달 cancel → onResend 호출 없음 + 모달 닫힘', () => {
    const onResend = jest.fn();
    const entry = buildEntry({ id: 31, retryable: true });
    render(<PushMonitorFailureList entries={[entry]} totalCount={1} onResend={onResend} />);

    const button = screen.getByRole('button', {
      name: new RegExp(`${entry.templateCode}.*${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_FAILURES_ACTION_RESEND}`)
    });
    act(() => {
      fireEvent.click(button);
    });
    const cancelButton = screen.getByRole('button', {
      name: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_CANCEL
    });
    act(() => {
      fireEvent.click(cancelButton);
    });
    expect(onResend).not.toHaveBeenCalled();
    expect(screen.queryByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_MODAL_TITLE)).not.toBeInTheDocument();
  });

  test('F5: 마스킹된 recipient 그대로 노출 (재마스킹/평문 가드)', () => {
    const entry = buildEntry({ id: 41, recipientPhoneMasked: '010-****-9876' });
    render(<PushMonitorFailureList entries={[entry]} totalCount={1} onResend={jest.fn()} />);
    expect(screen.getByText('010-****-9876')).toBeInTheDocument();
  });
});
