/**
 * SCT A6 인쇄 카드 — print-a6.html 구조 (105×148mm)
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  formatSctExpiryUntil,
  maskKoreanName
} from '../../../utils/sctInviteDisplay';
import { SCT_DEFAULTS, SCT_TEST_ID, SCT_UI } from '../../../constants/sctOnline';
import mindgardenMark from '../../../assets/mindgarden-mark.svg';
import './sctInviteQr.css';

const A6_QR_SIZE = 460;
const A6_QR_LEVEL = 'M';
const A6_QR_MARGIN = 4;

/**
 * 인쇄용 HTML을 새 창으로 열고 print() 호출.
 *
 * @param {HTMLElement} node
 */
export function openSctA6PrintWindow(node) {
  if (!node || typeof window === 'undefined') return;
  const win = window.open('', '_blank', 'noopener,noreferrer,width=420,height=600');
  if (!win) return;
  const doc = win.document;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');
  doc.open();
  doc.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"/>`
    + `<title>${SCT_UI.QR_PRINT_A6}</title>${styles}`
    + `<style>@page{size:105mm 148mm;margin:0;}html,body{margin:0;padding:0;background:var(--mg-v2-color-surface-card);}</style>`
    + `</head><body>${node.outerHTML}</body></html>`);
  doc.close();
  const trigger = () => {
    try {
      win.focus();
      win.print();
    } catch {
      // ignore
    }
  };
  if (win.document.readyState === 'complete') {
    window.setTimeout(trigger, 250);
  } else {
    win.onload = () => window.setTimeout(trigger, 250);
  }
}

/**
 * @param {{
 *   qrUrl: string,
 *   formTitle: string,
 *   recipientName?: string,
 *   tokenExpiresAt?: string,
 *   linkExpiryDays?: number,
 *   officePhone?: string,
 *   mobilePhone?: string,
 *   autoPrint?: boolean,
 *   onReady?: (node: HTMLElement|null) => void
 * }} props
 */
const SctInviteA6Print = ({
  qrUrl,
  formTitle,
  recipientName = '',
  tokenExpiresAt,
  linkExpiryDays,
  officePhone = '',
  mobilePhone = '',
  autoPrint = false,
  onReady
}) => {
  const rootRef = useRef(null);
  const masked = maskKoreanName(recipientName);
  const expiry = formatSctExpiryUntil(tokenExpiresAt);
  const days = linkExpiryDays != null && Number.isFinite(Number(linkExpiryDays))
    ? Number(linkExpiryDays)
    : SCT_DEFAULTS.LINK_EXPIRY_DAYS;
  const whoLine = [
    masked ? `${masked} 님` : '',
    expiry ? `${expiry} (${days}${SCT_UI.QR_DAYS_SUFFIX} 유효)` : ''
  ].filter(Boolean).join(' · ');

  const contactLine = useMemo(() => {
    const parts = [officePhone, mobilePhone].map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean);
    if (!parts.length) return '';
    return `${SCT_UI.A6_CONTACT_PREFIX} ${parts.join(' · ')}`;
  }, [officePhone, mobilePhone]);

  useEffect(() => {
    onReady?.(rootRef.current);
    if (autoPrint && rootRef.current) {
      openSctA6PrintWindow(rootRef.current);
    }
  }, [autoPrint, onReady, qrUrl]);

  if (!qrUrl) return null;

  return (
    <article
      ref={rootRef}
      className="mg-v2-sct-a6"
      aria-label="A6 질문지 안내 카드"
      data-testid={SCT_TEST_ID.INVITE_A6}
    >
      <header className="mg-v2-sct-a6__top">
        <div className="mg-v2-sct-a6__brand">
          <img src={mindgardenMark} alt="" />
          <b>{SCT_UI.BRAND}</b>
        </div>
        <span className="mg-v2-sct-a6__right">{SCT_UI.A6_HEADER_RIGHT}</span>
      </header>
      <main className="mg-v2-sct-a6__mid">
        <div>
          <h1 className="mg-v2-sct-a6__h"><SafeText>{toDisplayString(formTitle, SCT_UI.TITLE)}</SafeText></h1>
          {whoLine ? <p className="mg-v2-sct-a6__who"><SafeText>{whoLine}</SafeText></p> : null}
        </div>
        <div className="mg-v2-sct-a6__qr-box">
          <QRCodeSVG
            value={qrUrl}
            size={A6_QR_SIZE}
            level={A6_QR_LEVEL}
            marginSize={A6_QR_MARGIN}
          />
          <span className="mg-v2-sct-a6__qr-cap">{SCT_UI.A6_SCAN_CAP}</span>
        </div>
        <div className="mg-v2-sct-a6__steps">
          <div>
            <b>{SCT_UI.A6_STEP1_TITLE}</b>
            {SCT_UI.A6_STEP1_BODY}
          </div>
          <div>
            <b>{SCT_UI.A6_STEP2_TITLE}</b>
            {SCT_UI.A6_STEP2_BODY}
          </div>
          <div>
            <b>{SCT_UI.A6_STEP3_TITLE}</b>
            {SCT_UI.A6_STEP3_BODY}
          </div>
        </div>
      </main>
      <footer className="mg-v2-sct-a6__foot">
        {contactLine ? (
          <div className="mg-v2-sct-a6__tel"><SafeText>{contactLine}</SafeText></div>
        ) : (
          <div className="mg-v2-sct-a6__tel">{SCT_UI.LANDING_CONTACT_EMPTY}</div>
        )}
        <div>{SCT_UI.A6_REISSUE_NOTE}</div>
        <div className="mg-v2-sct-a6__nt">{SCT_UI.LANDING_NOTICE}</div>
      </footer>
    </article>
  );
};

SctInviteA6Print.propTypes = {
  qrUrl: PropTypes.string.isRequired,
  formTitle: PropTypes.string,
  recipientName: PropTypes.string,
  tokenExpiresAt: PropTypes.string,
  linkExpiryDays: PropTypes.number,
  officePhone: PropTypes.string,
  mobilePhone: PropTypes.string,
  autoPrint: PropTypes.bool,
  onReady: PropTypes.func
};

export default SctInviteA6Print;
