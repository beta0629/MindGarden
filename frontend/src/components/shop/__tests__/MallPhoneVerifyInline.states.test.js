/**
 * MallPhoneVerifyInline — 인증 상태별 표시 (b 보냄 · d 만료 · e 다시 보냄 · f 잠김)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MallPhoneVerifyInline from '../organisms/MallPhoneVerifyInline';
import { CLIENT_MALL_PHONE_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { PHONE_VERIFY_STEP } from '../../../utils/clientMallPhoneVerify';

jest.mock('../../../utils/notification', () => ({ showSuccess: jest.fn() }));

const flowFor = (patch = {}) => ({
  step: PHONE_VERIFY_STEP.SENT,
  phoneDigits: '01055551234',
  verifiedDigits: '',
  code: '',
  sentTo: '01055551234',
  resent: false,
  deliveryChannel: 'SMS',
  remainingSeconds: 120,
  resendWaitSeconds: null,
  lockedMessage: '',
  error: null,
  sending: false,
  confirming: false,
  setPhoneDigits: jest.fn(),
  setCode: jest.fn(),
  send: jest.fn(),
  resend: jest.fn(),
  confirm: jest.fn(),
  changeNumber: jest.fn(),
  ...patch
});

describe('MallPhoneVerifyInline states', () => {
  test('(b) 보냄 — 「문자가 안 오면…」 · 타이머 · 배지 유지', () => {
    render(<MallPhoneVerifyInline flow={flowFor()} />);
    expect(screen.getByText(CLIENT_MALL_PHONE_COPY.SENT_HELP)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_TIMER)).toHaveTextContent('2:00');
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE)).not.toBeDisabled();
  });

  test('(e) 다시 보냄 — 「새 인증번호만 쓸 수 있어요」', () => {
    render(<MallPhoneVerifyInline flow={flowFor({ resent: true })} />);
    expect(screen.getByText(CLIENT_MALL_PHONE_COPY.RESENT_HELP)).toBeInTheDocument();
  });

  test('(d) 만료 — 주황 안내 · 입력 비활성 · 0:00 · 다시 받기 가능', () => {
    render(<MallPhoneVerifyInline flow={flowFor({ step: PHONE_VERIFY_STEP.EXPIRED, remainingSeconds: 0 })} />);
    expect(screen.getByRole('alert')).toHaveTextContent(CLIENT_MALL_PHONE_COPY.EXPIRED_TITLE);
    expect(screen.getByRole('alert')).toHaveClass('client-mall-phone__state--warn');
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE)).toBeDisabled();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_TIMER)).toHaveTextContent(/^0:00$/);
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_RESEND)).not.toBeDisabled();
  });

  test('(f) 잠김 — 입력·확인·다시 받기 모두 비활성', () => {
    render(
      <MallPhoneVerifyInline
        flow={flowFor({ step: PHONE_VERIFY_STEP.LOCKED, lockedMessage: '10분 뒤에 다시 시도해 주세요.' })}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(CLIENT_MALL_PHONE_COPY.LOCKED_TITLE);
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE)).toBeDisabled();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CONFIRM)).toBeDisabled();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_RESEND)).toBeDisabled();
  });
});
