/**
 * SCT 초대 QR 카드 — short URL 표시·복사
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SctInviteQrCard from '../SctInviteQrCard';
import { SCT_TEST_ID, SCT_UI } from '../../../../constants/sctOnline';

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <svg data-testid="mock-qr" data-value={value} />
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, preventDoubleClick, loading, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  )
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn() }
}));

jest.mock('../../../../utils/sctApi', () => ({
  resendSctSms: jest.fn(),
  reissueSctInviteLink: jest.fn()
}));

describe('SctInviteQrCard', () => {
  const invitation = {
    id: 7,
    formType: 'ADULT',
    recipientName: '예시자',
    absoluteShortUrl: 'https://mindgarden.example/s/k9P2mX',
    absoluteUrl: 'https://mindgarden.example/public/sct/long-token',
    publicUrl: '/public/sct/long-token',
    tokenExpiresAt: '2026-12-09T23:59:00',
    linkExpiryDays: 14,
    maskedPhone: '010-****-0000',
    smsDispatchResult: 'SENT'
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) }
    });
  });

  test('shows absoluteShortUrl and copies it', async() => {
    render(
      <SctInviteQrCard
        invitation={invitation}
        recipientName="예시자"
      />
    );
    expect(screen.getByTestId(SCT_TEST_ID.INVITE_QR)).toBeInTheDocument();
    expect(screen.getByTestId(SCT_TEST_ID.INVITE_QR_URL)).toHaveTextContent(
      'https://mindgarden.example/s/k9P2mX'
    );
    const qrs = screen.getAllByTestId('mock-qr');
    expect(qrs.length).toBeGreaterThanOrEqual(1);
    qrs.forEach((el) => {
      expect(el).toHaveAttribute('data-value', 'https://mindgarden.example/s/k9P2mX');
    });
    expect(screen.getByText('예*자')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(SCT_TEST_ID.INVITE_QR_COPY));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://mindgarden.example/s/k9P2mX'
      );
    });
  });

  test('reissued banner', () => {
    render(
      <SctInviteQrCard
        invitation={invitation}
        isReissued
      />
    );
    expect(screen.getByText(SCT_UI.QR_REISSUED_BANNER_TITLE)).toBeInTheDocument();
  });
});
