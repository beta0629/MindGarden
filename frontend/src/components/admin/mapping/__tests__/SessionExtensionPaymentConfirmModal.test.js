import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SessionExtensionPaymentConfirmModal from '../SessionExtensionPaymentConfirmModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions }) => isOpen ? (
    <div role="dialog" aria-label={title}>
      {children}
      {actions}
    </div>
  ) : null
}));

jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ value, onChange, options }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}));

jest.mock('../../../common/ActionBar', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading }) => (
    <button type="button" onClick={onClick} disabled={disabled || loading}>{children}</button>
  )
}));

describe('SessionExtensionPaymentConfirmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('회기추가 API를 한 번만 호출하고 성공 후 재조회 콜백을 실행한다', async() => {
    let resolveRequest;
    StandardizedApi.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const onConfirmed = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
      <SessionExtensionPaymentConfirmModal
        isOpen
        request={{
          sourceId: 30,
          clientName: '내담자',
          consultantName: '상담사',
          amount: 120000,
          additionalSessions: 3
        }}
        onClose={onClose}
        onConfirmed={onConfirmed}
        onCancelRequest={jest.fn()}
      />
    );

    expect(screen.getByText('담당 상담사')).toBeInTheDocument();
    expect(screen.getByText('상담사')).toBeInTheDocument();
    expect(screen.getByText('+3회기')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: '입금 확인 및 회기 합산' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.post).toHaveBeenCalledWith(
      '/api/v1/admin/session-extensions/requests/30/confirm-payment',
      expect.objectContaining({ paymentMethod: 'BANK_TRANSFER' })
    );

    resolveRequest({ success: true });

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(notificationManager.success).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('API 오류 시 성공 문구와 재조회 콜백을 실행하지 않는다', async() => {
    StandardizedApi.post.mockRejectedValue(new Error('확인 실패'));
    const onConfirmed = jest.fn();

    render(
      <SessionExtensionPaymentConfirmModal
        isOpen
        request={{
          sourceId: 31,
          clientName: '내담자',
          consultantName: '상담사',
          amount: 100000,
          additionalSessions: 2
        }}
        onClose={jest.fn()}
        onConfirmed={onConfirmed}
        onCancelRequest={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '입금 확인 및 회기 합산' }));

    await waitFor(() => expect(notificationManager.error).toHaveBeenCalled());
    expect(notificationManager.success).not.toHaveBeenCalled();
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
