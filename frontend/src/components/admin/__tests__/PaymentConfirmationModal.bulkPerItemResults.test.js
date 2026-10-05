/**
 * PaymentConfirmationModal — 일괄 결제 확인·취소 매칭별 결과 표시.
 *
 * - 실제 엔드포인트(/api/v1/admin/mapping/payment/{confirm,cancel})를 StandardizedApi 로 호출
 * - 목록 응답의 결제 대기(PENDING_PAYMENT) 매칭이 선택 대상이 된다
 * - 일부 실패(200)·전부 실패(409 본문)에서 매칭별 결과를 모달에 남기고, 커밋된 매칭은 다시 선택할 수 없다
 *
 * @see frontend/src/components/admin/PaymentConfirmationModal.js
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PaymentConfirmationModal from '../PaymentConfirmationModal';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { PAYMENT_CONFIRMATION_MODAL_CONSTANTS } from '../../../constants/css-variables';
import {
  extractBulkMappingResults,
  extractBulkMappingResultsFromError,
  isPendingPaymentMapping
} from '../../../utils/bulkMappingPaymentResult';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() }
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn(), warning: jest.fn(), info: jest.fn() }
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { changeLanguage: jest.fn() } })
}));

const { API_ENDPOINTS } = PAYMENT_CONFIRMATION_MODAL_CONSTANTS;

const MAPPINGS = [
  { id: 11, status: 'PENDING_PAYMENT', clientName: '가', consultantName: '상담', packagePrice: 100000 },
  { id: 12, status: 'PENDING_PAYMENT', clientName: '나', consultantName: '상담', packagePrice: 100000 },
  { id: 13, status: 'ACTIVE', clientName: '다', consultantName: '상담', packagePrice: 100000 }
];

const renderModal = (props = {}) => {
  const onClose = jest.fn();
  const onPaymentConfirmed = jest.fn();
  render(
    <PaymentConfirmationModal
      isOpen
      onClose={onClose}
      mappings={MAPPINGS}
      onPaymentConfirmed={onPaymentConfirmed}
      canCancelPayment
      {...props}
    />
  );
  return { onClose, onPaymentConfirmed };
};

const confirmButtons = () => screen.getAllByRole('button', { name: 'admin.actions.paymentConfirm' });

describe('bulkMappingPaymentResult utils', () => {
  it('성공 응답(언랩된 data)과 오류 본문(ApiResponse) 모두에서 매칭별 결과를 꺼낸다', () => {
    const results = [{ mappingId: 1, status: 'SUCCEEDED' }, { mappingId: 2, status: 'FAILED', code: 'X' }];
    expect(extractBulkMappingResults({ results }).summary).toEqual({
      total: 2, succeeded: 1, failed: 1, skipped: 0
    });
    const error = Object.assign(new Error('m'), {
      status: 409, response: { data: { success: false, data: { results } } }
    });
    expect(extractBulkMappingResultsFromError(error).results[1]).toMatchObject({ mappingId: 2, code: 'X' });
    expect(extractBulkMappingResults(null)).toBeNull();
    expect(extractBulkMappingResults({ data: {} })).toBeNull();
  });

  it('결제 대기는 PENDING_PAYMENT 매칭 또는 결제 상태 PENDING', () => {
    expect(isPendingPaymentMapping({ status: 'PENDING_PAYMENT' })).toBe(true);
    expect(isPendingPaymentMapping({ status: 'ACTIVE', paymentStatus: 'PENDING' })).toBe(true);
    expect(isPendingPaymentMapping({ status: 'ACTIVE' })).toBe(false);
    expect(isPendingPaymentMapping(null)).toBe(false);
  });
});

describe('PaymentConfirmationModal 일괄 결제 매칭별 결과', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('결제 대기 매칭만 선택되고 실제 확인 엔드포인트로 합계 금액을 보낸다 — 전부 처리면 닫힘', async() => {
    StandardizedApi.post.mockResolvedValue({
      results: [{ mappingId: 11, status: 'SUCCEEDED' }, { mappingId: 12, status: 'SUCCEEDED' }],
      allSucceeded: true
    });
    const { onPaymentConfirmed, onClose } = renderModal();

    expect(screen.queryByText('다')).not.toBeInTheDocument();
    fireEvent.click(confirmButtons()[confirmButtons().length - 1]);

    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalledTimes(1));
    expect(StandardizedApi.post).toHaveBeenCalledWith(API_ENDPOINTS.CONFIRM_PAYMENT,
      expect.objectContaining({ mappingIds: [11, 12], amount: 200000 }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onPaymentConfirmed).toHaveBeenCalled();
    expect(notificationManager.success).toHaveBeenCalled();
  });

  it('일부 실패(200) — 모달 유지, 매칭별 결과 표시, 커밋된 매칭은 선택 불가, 닫을 때 목록 갱신', async() => {
    StandardizedApi.post.mockResolvedValue({
      results: [
        { mappingId: 11, status: 'SUCCEEDED', code: null, message: null },
        { mappingId: 12, status: 'FAILED', code: 'BULK_ITEM_PROCESSING_FAILED', message: '처리하지 못했습니다' }
      ],
      allSucceeded: false
    });
    const { onPaymentConfirmed, onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '결제 취소' }));

    await waitFor(() => expect(screen.getByTestId('bulk-payment-result')).toBeInTheDocument());
    expect(StandardizedApi.post).toHaveBeenCalledWith(API_ENDPOINTS.CANCEL_PAYMENT, { mappingIds: [11, 12] });
    expect(screen.getByTestId('bulk-payment-item-11')).toHaveAttribute('data-status', 'SUCCEEDED');
    expect(screen.getByTestId('bulk-payment-item-12')).toHaveAttribute('data-status', 'FAILED');
    expect(screen.getByTestId('bulk-payment-item-12')).toHaveTextContent('처리하지 못했습니다');
    expect(screen.getByText('처리 1건 · 실패 1건 · 건너뜀 0건')).toBeInTheDocument();
    expect(notificationManager.warning).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'admin.actions.cancel' }));
    expect(onPaymentConfirmed).toHaveBeenCalledTimes(1);
  });

  it('전부 실패(409 본문) — 오류 문구 + 매칭별 결과, 커밋 없으니 닫기는 onClose', async() => {
    const error = Object.assign(new Error('선택한 매칭을 하나도 처리하지 못했습니다.'), {
      status: 409,
      response: {
        data: {
          success: false,
          data: {
            results: [
              { mappingId: 11, status: 'FAILED', code: 'REFUND_LEDGER_NOT_RECORDED', message: '세율 설정 필요' },
              { mappingId: 12, status: 'FAILED', code: 'REFUND_LEDGER_NOT_RECORDED', message: '세율 설정 필요' }
            ]
          }
        }
      }
    });
    StandardizedApi.post.mockRejectedValue(error);
    const { onPaymentConfirmed, onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '결제 취소' }));

    await waitFor(() => expect(screen.getByTestId('bulk-payment-item-11')).toHaveAttribute('data-status', 'FAILED'));
    expect(notificationManager.error).toHaveBeenCalledWith('선택한 매칭을 하나도 처리하지 못했습니다.');

    fireEvent.click(screen.getByRole('button', { name: 'admin.actions.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPaymentConfirmed).not.toHaveBeenCalled();
  });
});
