/**
 * MallPhoneVerifyInline — 결제 화면 안 휴대폰 인증 (라우트 이동 없음 · §8 a~g)
 * 상태는 usePhoneVerifyFlow 가 들고, 이 컴포넌트는 표시만 한다(앱은 같은 훅 + 네이티브 뷰로 재사용).
 * 좁은 웹(<900px)에서는 「휴대폰 인증」 바텀시트(UnifiedModal)로 연다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_LIMITS,
  CLIENT_MALL_NARROW_MEDIA_QUERY,
  CLIENT_MALL_PHONE_COPY,
  CLIENT_MALL_TEST_IDS
} from '../../../constants/clientMallConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import useMediaQuery from '../../../hooks/useMediaQuery';
import { formatMallCountdown, formatMallPhoneInput, maskMallPhone } from '../../../utils/clientMall';
import { PHONE_VERIFY_STEP } from '../../../utils/clientMallPhoneVerify';
import { showSuccess } from '../../../utils/notification';

const CheckIcon = ICONS.CHECK_CIRCLE;
const PUSH_CHANNEL = 'PUSH';
const PHONE_INPUT_ID = 'client-mall-phone-input';
const CODE_INPUT_ID = 'client-mall-phone-code';

/** (a) 인증 전 — 배지 + 「결제 전에 한 번만」 */
const NeedsVerifyBadge = () => (
  <span className="client-mall-phone__needs">
    <span className="client-mall-badge client-mall-badge--warn">{CLIENT_MALL_CHECKOUT_COPY.PHONE_NEEDS_VERIFY}</span>
    <span className="client-mall-phone__needs-hint">{CLIENT_MALL_CHECKOUT_COPY.PHONE_NEEDS_VERIFY_HINT}</span>
  </span>
);

/**
 * 인증 입력 본문 (b 보냄 · c 틀림 · d 만료 · e 다시 보냄 · f 잠김).
 * 시트에서는 버튼이 입력칸 아래 전폭 primary 이고, 잠기면 확인·다시 받기 대신 「닫기」만 남는다.
 *
 * @param {{ flow: object, sheet?: boolean, onClose?: () => void }} props
 */
const PhoneVerifyPanel = ({ flow, sheet = false, onClose = null }) => {
  const { step } = flow;
  const errorText = flow.error?.message || '';
  const expired = step === PHONE_VERIFY_STEP.EXPIRED;
  const locked = step === PHONE_VERIFY_STEP.LOCKED;
  const lockedSheet = sheet && locked;
  const actionVariant = sheet ? 'primary' : 'outline';
  const actionClassName = sheet
    ? 'client-mall-btn client-mall-btn--primary'
    : 'client-mall-btn client-mall-btn--ink-line';
  const codeStep = step === PHONE_VERIFY_STEP.SENT || expired || locked;
  const codeDisabled = expired || locked || flow.confirming;
  const sentText = flow.deliveryChannel === PUSH_CHANNEL
    ? CLIENT_MALL_PHONE_COPY.SENT_PUSH
    : `${maskMallPhone(flow.sentTo)}${flow.resent ? CLIENT_MALL_PHONE_COPY.RESENT_SUFFIX : CLIENT_MALL_PHONE_COPY.SENT_SUFFIX}`;
  const timerSeconds = expired ? 0 : flow.remainingSeconds;

  return (
    <div className="client-mall-phone__panel-body">
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
              variant={actionVariant}
              preventDoubleClick={false}
              className={actionClassName}
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

      {codeStep ? (
        <>
          {flow.sentTo ? (
            <div className="client-mall-phone__sent">
              <span>{sentText}</span>
              <button
                type="button"
                className="client-mall-link-btn"
                onClick={flow.changeNumber}
                disabled={locked}
              >
                {CLIENT_MALL_PHONE_COPY.CHANGE_NUMBER}
              </button>
            </div>
          ) : null}
          {expired || locked ? (
            <div className="client-mall-phone__state client-mall-phone__state--warn" role="alert">
              <p className="client-mall-phone__state-title">
                {expired ? CLIENT_MALL_PHONE_COPY.EXPIRED_TITLE : CLIENT_MALL_PHONE_COPY.LOCKED_TITLE}
              </p>
              <p className="client-mall-phone__sub">
                {expired ? CLIENT_MALL_PHONE_COPY.EXPIRED_BODY : flow.lockedMessage}
              </p>
            </div>
          ) : null}
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
                disabled={codeDisabled}
                aria-invalid={Boolean(errorText)}
                data-testid={CLIENT_MALL_TEST_IDS.PHONE_CODE}
              />
              {timerSeconds != null && !locked ? (
                <span
                  className={[
                    'client-mall-phone__timer',
                    expired ? 'client-mall-phone__timer--expired' : ''
                  ].filter(Boolean).join(' ')}
                  data-testid={CLIENT_MALL_TEST_IDS.PHONE_TIMER}
                >
                  {formatMallCountdown(timerSeconds)}
                  {expired ? null : CLIENT_MALL_PHONE_COPY.TIMER_SUFFIX}
                </span>
              ) : null}
            </div>
            {lockedSheet ? null : (
              <MGButton
                variant={actionVariant}
                preventDoubleClick={false}
                className={actionClassName}
                disabled={codeDisabled || flow.code.length !== CLIENT_MALL_LIMITS.OTP_LENGTH}
                loading={flow.confirming}
                onClick={flow.confirm}
                data-testid={CLIENT_MALL_TEST_IDS.PHONE_CONFIRM}
              >
                {CLIENT_MALL_PHONE_COPY.CONFIRM}
              </MGButton>
            )}
          </div>
          {step === PHONE_VERIFY_STEP.SENT ? (
            <p className="client-mall-phone__sub" data-testid="client-mall-phone-sent-help">
              {flow.resent ? CLIENT_MALL_PHONE_COPY.RESENT_HELP : CLIENT_MALL_PHONE_COPY.SENT_HELP}
            </p>
          ) : null}
          {lockedSheet ? (
            <MGButton
              variant="outline"
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line client-mall-phone__close"
              onClick={onClose}
              data-testid={CLIENT_MALL_TEST_IDS.PHONE_LOCKED_CLOSE}
            >
              {CLIENT_MALL_PHONE_COPY.CLOSE}
            </MGButton>
          ) : (
            <button
              type="button"
              className="client-mall-link-btn"
              disabled={locked || flow.sending || (!expired && flow.resendWaitSeconds != null)}
              onClick={flow.resend}
              data-testid={CLIENT_MALL_TEST_IDS.PHONE_RESEND}
            >
              {CLIENT_MALL_PHONE_COPY.RESEND}
              {!expired && !locked && flow.resendWaitSeconds != null ? (
                <>
                  {CLIENT_MALL_PHONE_COPY.RESEND_WAIT_SEPARATOR}
                  {flow.resendWaitSeconds}
                  {CLIENT_MALL_PHONE_COPY.RESEND_WAIT_SUFFIX}
                </>
              ) : null}
            </button>
          )}
        </>
      ) : null}

      {errorText && !locked ? (
        <p className="client-mall-phone__error" role="alert" data-testid={CLIENT_MALL_TEST_IDS.PHONE_ERROR}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
};

PhoneVerifyPanel.propTypes = {
  flow: PropTypes.object.isRequired,
  sheet: PropTypes.bool,
  onClose: PropTypes.func
};

/**
 * @param {{ flow: ReturnType<typeof import('../../../hooks/usePhoneVerifyFlow').default> }} props
 */
const MallPhoneVerifyInline = ({ flow }) => {
  const [open, setOpen] = useState(false);
  const isNarrow = useMediaQuery(CLIENT_MALL_NARROW_MEDIA_QUERY);
  const { step } = flow;
  const verified = step === PHONE_VERIFY_STEP.VERIFIED;
  const prevVerifiedRef = useRef(verified);

  useEffect(() => {
    if (verified && !prevVerifiedRef.current) {
      setOpen(false);
      showSuccess(CLIENT_MALL_PHONE_COPY.VERIFIED_TOAST);
    }
    prevVerifiedRef.current = verified;
  }, [verified]);

  if (verified) {
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

  const startButton = (
    <MGButton
      variant="outline"
      size="small"
      preventDoubleClick={false}
      className="client-mall-btn client-mall-btn--ink-line"
      onClick={() => setOpen(true)}
      data-testid={CLIENT_MALL_TEST_IDS.PHONE_OPEN}
    >
      {CLIENT_MALL_PHONE_COPY.START}
    </MGButton>
  );

  if (isNarrow) {
    const closeSheet = () => setOpen(false);
    return (
      <div className="client-mall-phone client-mall-phone--idle" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFY}>
        <NeedsVerifyBadge />
        {startButton}
        <UnifiedModal
          isOpen={open}
          onClose={closeSheet}
          title={CLIENT_MALL_PHONE_COPY.SHEET_TITLE}
          subtitle={step === PHONE_VERIFY_STEP.SENT ? CLIENT_MALL_PHONE_COPY.SHEET_SENT_SUBTITLE : CLIENT_MALL_PHONE_COPY.SECTION_HINT}
          className="client-mall-sheet"
        >
          <div className="client-mall client-mall-phone client-mall-phone--sheet" data-testid={CLIENT_MALL_TEST_IDS.PHONE_SHEET}>
            <PhoneVerifyPanel flow={flow} sheet onClose={closeSheet} />
          </div>
        </UnifiedModal>
      </div>
    );
  }

  if (!open && step === PHONE_VERIFY_STEP.INPUT) {
    return (
      <div className="client-mall-phone client-mall-phone--idle" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFY}>
        <NeedsVerifyBadge />
        {startButton}
      </div>
    );
  }

  return (
    <div className="client-mall-phone client-mall-phone--panel" data-testid={CLIENT_MALL_TEST_IDS.PHONE_VERIFY}>
      <NeedsVerifyBadge />
      <PhoneVerifyPanel flow={flow} />
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
