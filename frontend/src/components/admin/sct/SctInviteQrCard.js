/**
 * SCT 발송·재발급 직후 QR 카드 (admin-qr.html)
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  formatSctExpiryUntil,
  maskKoreanName,
  resolveSctInviteQrUrl
} from '../../../utils/sctInviteDisplay';
import {
  reissueSctInviteLink,
  resendSctSms
} from '../../../utils/sctApi';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import {
  SCT_DEFAULTS,
  SCT_FORM_TYPE_LABEL,
  SCT_TEST_ID,
  SCT_UI
} from '../../../constants/sctOnline';
import mindgardenMark from '../../../assets/mindgarden-mark.svg';
import SctInviteA6Print, { openSctA6PrintWindow } from './SctInviteA6Print';
import './sctInviteQr.css';

const QR_SIZE = 156;
const QR_LEVEL = 'M';
const QR_MARGIN = 4;

/**
 * @param {string} formType
 * @returns {string}
 */
const formTitleOf = (formType) => {
  const label = SCT_FORM_TYPE_LABEL[formType] || '';
  return label ? `${label} 문장완성 질문지` : SCT_UI.TITLE;
};

/**
 * @param {{
 *   invitation: object,
 *   recipientName?: string,
 *   formTitle?: string,
 *   officePhone?: string,
 *   mobilePhone?: string,
 *   isReissued?: boolean,
 *   onConfirm?: () => void,
 *   onInvitationChange?: (next: object) => void
 * }} props
 */
const SctInviteQrCard = ({
  invitation,
  recipientName = '',
  formTitle,
  officePhone = '',
  mobilePhone = '',
  isReissued = false,
  onConfirm,
  onInvitationChange
}) => {
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState(false);
  const [current, setCurrent] = useState(invitation);
  const a6HostRef = useRef(null);

  useEffect(() => {
    setCurrent(invitation);
  }, [invitation]);

  const qrUrl = useMemo(() => resolveSctInviteQrUrl(current), [current]);
  const title = formTitle
    || formTitleOf(current?.formType)
    || SCT_UI.TITLE;
  const maskedName = maskKoreanName(
    recipientName || current?.recipientName || ''
  );
  const expiry = formatSctExpiryUntil(current?.tokenExpiresAt);
  const days = current?.linkExpiryDays != null
    && Number.isFinite(Number(current.linkExpiryDays))
    ? Number(current.linkExpiryDays)
    : SCT_DEFAULTS.LINK_EXPIRY_DAYS;
  const expiryRow = expiry
    ? `${expiry} (${days}${SCT_UI.QR_DAYS_SUFFIX})`
    : '—';
  const smsRow = [
    toDisplayString(current?.maskedPhone, ''),
    SCT_UI.QR_SMS_SENT
  ].filter(Boolean).join(' · ');

  const applyInvitation = useCallback((next) => {
    setCurrent(next);
    onInvitationChange?.(next);
  }, [onInvitationChange]);

  const handleCopy = useCallback(async() => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      notificationManager.success(SCT_UI.COPY_LINK_SUCCESS);
    } catch {
      notificationManager.show(SCT_UI.COPY_LINK_FAIL, 'error');
    }
  }, [qrUrl]);

  const handleResend = useCallback(async() => {
    if (!current?.id) return;
    setBusy('resend');
    try {
      const next = await resendSctSms(current.id);
      if (next && typeof next === 'object') {
        applyInvitation({ ...current, ...next });
      }
      notificationManager.success(SCT_UI.SEND_SUCCESS);
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    } finally {
      setBusy('');
    }
  }, [applyInvitation, current]);

  const handleReissue = useCallback(async() => {
    if (!current?.id) return;
    setBusy('reissue');
    try {
      const next = await reissueSctInviteLink(current.id);
      if (next && typeof next === 'object') {
        applyInvitation({ ...current, ...next });
        notificationManager.success(SCT_UI.REISSUE_SUCCESS);
      }
    } catch (e) {
      notificationManager.show(
        resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL),
        'error'
      );
    } finally {
      setBusy('');
    }
  }, [applyInvitation, current]);

  const handlePrint = useCallback(() => {
    const host = a6HostRef.current;
    const sheet = host?.querySelector('.mg-v2-sct-a6');
    if (sheet) {
      openSctA6PrintWindow(sheet);
    }
  }, []);

  if (!qrUrl) {
    return null;
  }

  return (
    <div className="mg-v2-sct-invite-qr" data-testid={SCT_TEST_ID.INVITE_QR}>
      {isReissued ? (
        <div className="mg-v2-sct-invite-qr__banner" role="status">
          <b>{SCT_UI.QR_REISSUED_BANNER_TITLE}</b>
          <span>{SCT_UI.QR_REISSUED_BANNER_BODY}</span>
        </div>
      ) : null}

      <section className="mg-v2-sct-invite-qr__card" aria-label="질문지 QR 안내 카드">
        <div className="mg-v2-sct-invite-qr__head">
          <div className="mg-v2-sct-invite-qr__brand">
            <img src={mindgardenMark} alt="" />
            <b>{SCT_UI.BRAND}</b>
          </div>
          <span className="mg-v2-sct-invite-qr__badge">{SCT_UI.QR_ISSUED_BADGE}</span>
        </div>

        <div className="mg-v2-sct-invite-qr__frame">
          <div>
            <div className="mg-v2-sct-invite-qr__title">
              <SafeText>{title}</SafeText>
            </div>
            {maskedName ? (
              <div className="mg-v2-sct-invite-qr__sub">
                <SafeText>{maskedName}</SafeText>
              </div>
            ) : null}
          </div>
          <div className="mg-v2-sct-invite-qr__img" aria-hidden={false}>
            <QRCodeSVG
              value={qrUrl}
              size={QR_SIZE}
              level={QR_LEVEL}
              marginSize={QR_MARGIN}
            />
          </div>
          <p className="mg-v2-sct-invite-qr__tip">{SCT_UI.QR_SCAN_TIP}</p>
          <dl className="mg-v2-sct-invite-qr__meta">
            <dt>{SCT_UI.QR_META_EXPIRY}</dt>
            <dd><SafeText>{expiryRow}</SafeText></dd>
            <dt>{SCT_UI.QR_META_SMS}</dt>
            <dd><SafeText>{smsRow || SCT_UI.QR_SMS_SENT}</SafeText></dd>
            <dt>{SCT_UI.QR_META_REISSUE}</dt>
            <dd>{SCT_UI.QR_REISSUE_RULE}</dd>
          </dl>
        </div>

        <div className="mg-v2-sct-invite-qr__url">
          <span className="num" data-testid={SCT_TEST_ID.INVITE_QR_URL}>
            <SafeText>{qrUrl}</SafeText>
          </span>
          {copied ? (
            <span className="mg-v2-sct-invite-qr__badge">{SCT_UI.COPY_LINK_SUCCESS}</span>
          ) : null}
        </div>

        <div className="mg-v2-sct-invite-qr__actions">
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            data-testid={SCT_TEST_ID.INVITE_QR_COPY}
            onClick={handleCopy}
          >
            {copied ? SCT_UI.COPY_LINK_SUCCESS : SCT_UI.COPY_LINK}
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            loading={busy === 'resend'}
            disabled={!current?.id || Boolean(busy)}
            onClick={handleResend}
          >
            {SCT_UI.QR_RESEND_SMS}
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            onClick={handlePrint}
          >
            {SCT_UI.QR_PRINT_A6}
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            loading={busy === 'reissue'}
            disabled={!current?.id || Boolean(busy)}
            onClick={handleReissue}
          >
            {SCT_UI.REISSUE_LINK}
          </MGButton>
        </div>
      </section>

      <p className="mg-v2-sct-invite-qr__rule">{SCT_UI.QR_RULE}</p>

      {onConfirm ? (
        <div className="mg-v2-sct-invite-qr__foot">
          <MGButton
            type="button"
            variant="primary"
            preventDoubleClick={false}
            onClick={onConfirm}
          >
            {SCT_UI.QR_CONFIRM}
          </MGButton>
        </div>
      ) : null}

      <div className="mg-v2-sct-invite-qr__a6-host" ref={a6HostRef} aria-hidden="true">
        <SctInviteA6Print
          qrUrl={qrUrl}
          formTitle={title}
          recipientName={recipientName || current?.recipientName || ''}
          tokenExpiresAt={current?.tokenExpiresAt}
          linkExpiryDays={days}
          officePhone={officePhone}
          mobilePhone={mobilePhone}
        />
      </div>
    </div>
  );
};

SctInviteQrCard.propTypes = {
  invitation: PropTypes.object.isRequired,
  recipientName: PropTypes.string,
  formTitle: PropTypes.string,
  officePhone: PropTypes.string,
  mobilePhone: PropTypes.string,
  isReissued: PropTypes.bool,
  onConfirm: PropTypes.func,
  onInvitationChange: PropTypes.func
};

export default SctInviteQrCard;
