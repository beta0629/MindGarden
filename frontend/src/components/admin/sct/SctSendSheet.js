/**
 * SCT 질문지 보내기 시트 — 온라인은 성인·청소년만
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveUserFacingApiErrorMessage } from '../../../utils/userFacingApiErrorMessage';
import { RoleUtils, USER_ROLES } from '../../../constants/roles';
import { useSession } from '../../../contexts/SessionContext';
import { createSctInvitation, fetchSctForms, fetchSctSettings } from '../../../utils/sctApi';
import {
  SCT_CSS,
  SCT_DEFAULTS,
  SCT_FORM_TYPE,
  SCT_FORM_TYPE_LABEL,
  SCT_ONLINE_FORM_TYPES,
  SCT_UI
} from '../../../constants/sctOnline';
import SctInviteQrCard from './SctInviteQrCard';
import './sctAdmin.css';

/**
 * 공개 링크 복사 UI — ADMIN·CONSULTANT만 (STAFF는 SMS 발송만).
 *
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
const canUseSctPublicLinkUi = (user) => (
  RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.CONSULTANT)
);

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   client: { id: number|string, phone?: string, email?: string, name?: string },
 *   hasActiveDraft?: boolean,
 *   onSent?: () => void
 * }} props
 */
const SctSendSheet = ({ isOpen, onClose, client, hasActiveDraft = false, onSent }) => {
  const { user } = useSession();
  const canPublicLink = canUseSctPublicLinkUi(user);
  const [forms, setForms] = useState([]);
  const [formType, setFormType] = useState(SCT_FORM_TYPE.ADULT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(SCT_DEFAULTS.LINK_EXPIRY_DAYS);
  const [centerDefaultDays, setCenterDefaultDays] = useState(SCT_DEFAULTS.LINK_EXPIRY_DAYS);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentInvitation, setSentInvitation] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    setSentInvitation(null);
    let cancelled = false;
    (async() => {
      try {
        const [formList, settings] = await Promise.all([
          fetchSctForms(),
          fetchSctSettings().catch(() => null)
        ]);
        if (cancelled) return;
        const onlineForms = (formList || []).filter(
          (f) => SCT_ONLINE_FORM_TYPES.includes(f.formType)
        );
        setForms(onlineForms);
        const days = settings?.linkExpiryDays ?? SCT_DEFAULTS.LINK_EXPIRY_DAYS;
        setCenterDefaultDays(days);
        setExpiresInDays(days);
        if (onlineForms[0]?.formType) {
          setFormType(onlineForms[0].formType);
        } else {
          setFormType(SCT_FORM_TYPE.ADULT);
        }
      } catch (e) {
        if (!cancelled) {
          setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
        }
      }
    })();
    setPhone(toDisplayString(client?.phone, ''));
    setEmail(toDisplayString(client?.email, ''));
    return () => {
      cancelled = true;
    };
  }, [isOpen, client]);

  const validate = () => {
    if (!formType || !SCT_ONLINE_FORM_TYPES.includes(formType)) {
      return SCT_UI.VALIDATE_REQUIRED;
    }
    if (!phone.trim() && !email.trim()) return SCT_UI.VALIDATE_REQUIRED;
    const days = Number(expiresInDays);
    if (!Number.isFinite(days)
      || days < SCT_DEFAULTS.LINK_EXPIRY_MIN
      || days > SCT_DEFAULTS.LINK_EXPIRY_MAX) {
      return SCT_UI.VALIDATE_EXPIRY;
    }
    return '';
  };

  const handleSend = async() => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await createSctInvitation({
        formType,
        clientId: client?.id != null ? Number(client.id) : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        expiresInDays: Number(expiresInDays),
        recipientName: client?.name || undefined
      });
      notificationManager.success(SCT_UI.SEND_SUCCESS);
      onSent?.();
      const hasQrTarget = Boolean(
        created?.absoluteShortUrl
        || created?.absoluteUrl
        || created?.shortUrl
        || created?.publicUrl
      );
      if (canPublicLink && hasQrTarget) {
        setSentInvitation(created);
      } else {
        onClose();
      }
    } catch (e) {
      setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
    } finally {
      setBusy(false);
    }
  };

  const kindOptions = SCT_ONLINE_FORM_TYPES.map((key) => ({
    value: key,
    label: SCT_FORM_TYPE_LABEL[key],
    fromApi: forms.find((f) => f.formType === key)
  }));

  const showingQr = Boolean(canPublicLink && sentInvitation);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={showingQr ? SCT_UI.QR_SHEET_TITLE_SENT : SCT_UI.SEND}
      size="medium"
      className={SCT_CSS.SEND_SHEET}
      actions={showingQr ? null : (
        <>
          <MGButton type="button" variant="outline" preventDoubleClick={false} onClick={onClose}>
            {SCT_UI.CANCEL}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            preventDoubleClick={false}
            loading={busy}
            onClick={handleSend}
          >
            {SCT_UI.SEND_SMS}
          </MGButton>
        </>
      )}
    >
      <div className={SCT_CSS.SEND_SHEET}>
        {showingQr ? (
          <SctInviteQrCard
            invitation={sentInvitation}
            recipientName={toDisplayString(client?.name, sentInvitation?.recipientName || '')}
            formTitle={
              SCT_FORM_TYPE_LABEL[sentInvitation?.formType || formType]
                ? `${SCT_FORM_TYPE_LABEL[sentInvitation?.formType || formType]} 문장완성 질문지`
                : SCT_UI.TITLE
            }
            isReissued={false}
            onConfirm={onClose}
            onInvitationChange={setSentInvitation}
          />
        ) : (
          <>
            {hasActiveDraft ? (
              <p className="mg-v2-sct-warn" role="status">{SCT_UI.RESEND_WARN}</p>
            ) : null}
            <p className={SCT_CSS.CAPTION} role="note">{SCT_UI.ONLINE_CHILD_HINT}</p>
            {error ? (
              <p className="mg-v2-sct-warn" role="alert"><SafeText>{error}</SafeText></p>
            ) : null}

            <div className="mg-v2-sct-field">
              <label>{SCT_UI.RECEIVER}</label>
              <SafeText>{toDisplayString(client?.name, '내담자')}</SafeText>
            </div>

            <div className="mg-v2-sct-field">
              <label id="sct-form-kind">{SCT_UI.FORM_KIND}</label>
              <div className="mg-v2-sct-kind-grid" role="group" aria-labelledby="sct-form-kind">
                {kindOptions.map((opt) => (
                  <MGButton
                    key={opt.value}
                    type="button"
                    variant="outline"
                    preventDoubleClick={false}
                    aria-pressed={formType === opt.value}
                    onClick={() => setFormType(opt.value)}
                  >
                    {opt.label}
                    {opt.fromApi ? ` · ${SCT_UI.RECOMMENDED}` : ''}
                  </MGButton>
                ))}
              </div>
            </div>

            <div className="mg-v2-sct-field">
              <label htmlFor="sct-send-phone">{SCT_UI.PHONE_SEGMENT}</label>
              <input
                id="sct-send-phone"
                className="mg-v2-sct-send-sheet__input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={Boolean(client?.phone)}
              />
              <p className={SCT_CSS.CAPTION}>{SCT_UI.PHONE_VERIFY_HINT}</p>
            </div>

            <div className="mg-v2-sct-field">
              <label htmlFor="sct-send-email">{SCT_UI.EMAIL_SEGMENT}</label>
              <input
                id="sct-send-email"
                className="mg-v2-sct-send-sheet__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mg-v2-sct-field">
              <label htmlFor="sct-send-expiry">
                {SCT_UI.EXPIRES}
                {' ('}
                {SCT_UI.USE_CENTER_DEFAULT}
                {': '}
                {centerDefaultDays}
                일)
              </label>
              <input
                id="sct-send-expiry"
                className="mg-v2-sct-send-sheet__input"
                type="number"
                min={SCT_DEFAULTS.LINK_EXPIRY_MIN}
                max={SCT_DEFAULTS.LINK_EXPIRY_MAX}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </UnifiedModal>
  );
};

SctSendSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    phone: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string
  }),
  hasActiveDraft: PropTypes.bool,
  onSent: PropTypes.func
};

export default SctSendSheet;
