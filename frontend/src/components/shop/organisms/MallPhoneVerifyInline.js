/**
 * MallPhoneVerifyInline — 결제 화면 안 휴대폰 인증 (라우트 이동 없음 · §8 a~g)
 * 상태는 usePhoneVerifyFlow 가 들고, 이 컴포넌트는 표시만 한다(앱은 같은 훅 + 네이티브 뷰로 재사용).
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_LIMITS,
  CLIENT_MALL_PHONE_COPY,
  CLIENT_MALL_TEST_IDS
} from '../../../constants/clientMallConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { formatMallCountdown, formatMallPhoneInput, maskMallPhone } from '../../../utils/clientMall';
import { PHONE_VERIFY_STEP } from '../../../utils/clientMallPhoneVerify';

const CheckIcon = ICONS.CHECK_CIRCLE;
const PUSH_CHANNEL = 'PUSH';
const PHONE_INPUT_ID = 'client-mall-phone-input';
const CODE_INPUT_ID = 'client-mall-phone-code';

/**
 * @param {{ flow: ReturnType<typeof import('../../../hooks/usePhoneVerifyFlow').default> }} props
 */
const MallPhoneVerifyInline = ({ flow }) => {
  const [open, setOpen] = useState(false);
  const { step } = flow;

  if (step === PHONE_VERIFY_STEP.VERIFIED) {
    return (
      <div className="client-mall-phone client-mall-phone--done" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFIED}>
        {CheckIcon ? <CheckIcon size={ICON_SIZES.MD} aria-hidden className="client-mall-phone__check" /> : null}
        <span className="client-mall-phone__done-text">
          {CLIENT_MALL_PHONE_COPY.VERIFIED_PREFIX}
          {maskMallPhone(flow.verifiedDigits)}
        </span>
        <button
          type="button"
          className="client-mall-link-btn"
          onClick={() => {
            setOpen(true);
            flow.changeNumber();
          }}
        >
          {CLIENT_MALL_PHONE_COPY.CHANGE}
        </button>
      </div>
    );
  }

  if (!open && step === PHONE_VERIFY_STEP.INPUT) {
    return (
      <div className="client-mall-phone client-mall-phone--idle" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFY}>
        <span className="client-mall-badge client-mall-badge--warn">{CLIENT_MALL_CHECKOUT_COPY.PHONE_NEEDS_VERIFY}</span>
        <MGButton
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className="client-mall-btn client-mall-btn--ink-line"
          onClick={() => setOpen(true)}
        >
          {CLIENT_MALL_PHONE_COPY.START}
        </MGButton>
      </div>
    );
  }

  const errorText = flow.error?.message || '';
  const sentText = flow.deliveryChannel === PUSH_CHANNEL
    ? CLIENT_MALL_PHONE_COPY.SENT_PUSH
    : `${maskMallPhone(flow.sentTo)}${flow.resent ? CLIENT_MALL_PHONE_COPY.RESENT_SUFFIX : CLIENT_MALL_PHONE_COPY.SENT_SUFFIX}`;

  return (
    <div className="client-mall-phone client-mall-phone--panel" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFY}>
      <p className="client-mall-phone__hint">{CLIENT_MALL_PHONE_COPY.SECTION_HINT}</p>

      {step === PHONE_VERIFY_STEP.INPUT ? (
        <>
          <label className="client-mall-field__label" htmlFor={PHONE_INPUT_ID}>
            {CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL}
          </label>
          <div className="client-mall-phone__row">
            <input
              id={PHONE_INPUT_ID}
              className="client-mall-field__input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder={CLIENT_MALL_PHONE_COPY.PHONE_PLACEHOLDER}
              value={formatMallPhoneInput(flow.phoneDigits)}
              onChange={(e) => flow.setPhoneDigits(e.target.value)}
              disabled={flow.sending}
            />
            <MGButton
              variant="outline"
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line"
              disabled={flow.sending || !flow.phoneDigits}
              loading={flow.sending}
              onClick={flow.send}
              data-testid={CLIENT_MALL_TEST_IDS.PHONE_SEND}
            >
              {CLIENT_MALL_PHONE_COPY.SEND}
            </MGButton>
          </div>
          <p className="client-mall-phone__sub">{CLIENT_MALL_PHONE_COPY.SEND_HINT}</p>
        </>
      ) : null}

      {step === PHONE_VERIFY_STEP.SENT ? (
        <>
          <div className="client-mall-phone__sent">
            <span>{sentText}</span>
            <button type="button" className="client-mall-link-btn" onClick={flow.changeNumber}>
              {CLIENT_MALL_PHONE_COPY.CHANGE_NUMBER}
            </button>
          </div>
          <label className="client-mall-field__label" htmlFor={CODE_INPUT_ID}>
            {CLIENT_MALL_PHONE_COPY.CODE_LABEL}
          </label>
          <div className="client-mall-phone__row">
            <div className="client-mall-phone__code-wrap">
              <input
                id={CODE_INPUT_ID}
                className={[
                  'client-mall-field__input',
                  'client-mall-field__input--code',
                  errorText ? 'client-mall-field__input--error' : ''
                ].filter(Boolean).join(' ')}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CLIENT_MALL_LIMITS.OTP_LENGTH}
                placeholder={CLIENT_MALL_PHONE_COPY.CODE_PLACEHOLDER}
                value={flow.code}
                onChange={(e) => flow.setCode(e.target.value)}
                disabled={flow.confirming}
                aria-invalid={Boolean(errorText)}
                data-testid={CLIENT_MALL_TEST_IDS.PHONE_CODE}
              />
              {flow.remainingSeconds != null ? (
                <span className="client-mall-phone__timer" data-testid={CLIENT_MALL_TEST_IDS.PHONE_TIMER}>
                  {formatMallCountdown(flow.remainingSeconds)}
                  {CLIENT_MALL_PHONE_COPY.TIMER_SUFFIX}
                </span>
              ) : null}
            </div>
            <MGButton
              variant="outline"
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line"
              disabled={flow.confirming || flow.code.length !== CLIENT_MALL_LIMITS.OTP_LENGTH}
              loading={flow.confirming}
              onClick={flow.confirm}
              data-testid={CLIENT_MALL_TEST_IDS.PHONE_CONFIRM}
            >
              {CLIENT_MALL_PHONE_COPY.CONFIRM}
            </MGButton>
          </div>
          <button
            type="button"
            className="client-mall-link-btn"
            disabled={flow.sending || flow.resendWaitSeconds != null}
            onClick={flow.resend}
            data-testid={CLIENT_MALL_TEST_IDS.PHONE_RESEND}
          >
            {CLIENT_MALL_PHONE_COPY.RESEND}
            {flow.resendWaitSeconds != null ? (
              <>
                {CLIENT_MALL_PHONE_COPY.RESEND_WAIT_SEPARATOR}
                {flow.resendWaitSeconds}
                {CLIENT_MALL_PHONE_COPY.RESEND_WAIT_SUFFIX}
              </>
            ) : null}
          </button>
        </>
      ) : null}

      {step === PHONE_VERIFY_STEP.EXPIRED ? (
        <div className="client-mall-phone__state">
          <p className="client-mall-phone__state-title">{CLIENT_MALL_PHONE_COPY.EXPIRED_TITLE}</p>
          <p className="client-mall-phone__sub">{CLIENT_MALL_PHONE_COPY.EXPIRED_BODY}</p>
          <MGButton
            variant="outline"
            preventDoubleClick={false}
            className="client-mall-btn client-mall-btn--ink-line"
            disabled={flow.sending}
            loading={flow.sending}
            onClick={flow.resend}
            data-testid={CLIENT_MALL_TEST_IDS.PHONE_RESEND}
          >
            {CLIENT_MALL_PHONE_COPY.RESEND}
          </MGButton>
        </div>
      ) : null}

      {step === PHONE_VERIFY_STEP.LOCKED ? (
        <div className="client-mall-phone__state client-mall-phone__state--warn" role="alert">
          <p className="client-mall-phone__state-title">{CLIENT_MALL_PHONE_COPY.LOCKED_TITLE}</p>
          <p className="client-mall-phone__sub">{flow.lockedMessage}</p>
        </div>
      ) : null}

      {errorText && step !== PHONE_VERIFY_STEP.LOCKED ? (
        <p className="client-mall-phone__error" role="alert" data-testid={CLIENT_MALL_TEST_IDS.PHONE_ERROR}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
};

MallPhoneVerifyInline.propTypes = {
  flow: PropTypes.shape({
    step: PropTypes.string.isRequired,
    phoneDigits: PropTypes.string,
    verifiedDigits: PropTypes.string,
    code: PropTypes.string,
    sentTo: PropTypes.string,
    resent: PropTypes.bool,
    deliveryChannel: PropTypes.string,
    remainingSeconds: PropTypes.number,
    resendWaitSeconds: PropTypes.number,
    lockedMessage: PropTypes.string,
    error: PropTypes.shape({ kind: PropTypes.string, message: PropTypes.string }),
    sending: PropTypes.bool,
    confirming: PropTypes.bool,
    setPhoneDigits: PropTypes.func.isRequired,
    setCode: PropTypes.func.isRequired,
    send: PropTypes.func.isRequired,
    resend: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    changeNumber: PropTypes.func.isRequired
  }).isRequired
};

export default MallPhoneVerifyInline;
