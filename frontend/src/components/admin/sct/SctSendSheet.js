/**
 * SCT 질문지 보내기 시트
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
import { createSctInvitation, fetchSctForms, fetchSctSettings } from '../../../utils/sctApi';
import {
  SCT_CSS,
  SCT_DEFAULTS,
  SCT_FORM_TYPE,
  SCT_FORM_TYPE_LABEL,
  SCT_UI
} from '../../../constants/sctOnline';
import './sctAdmin.css';

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
  const [forms, setForms] = useState([]);
  const [formType, setFormType] = useState(SCT_FORM_TYPE.ADULT);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(SCT_DEFAULTS.LINK_EXPIRY_DAYS);
  const [centerDefaultDays, setCenterDefaultDays] = useState(SCT_DEFAULTS.LINK_EXPIRY_DAYS);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    (async() => {
      try {
        const [formList, settings] = await Promise.all([
          fetchSctForms(),
          fetchSctSettings().catch(() => null)
        ]);
        if (cancelled) return;
        setForms(formList);
        const days = settings?.linkExpiryDays ?? SCT_DEFAULTS.LINK_EXPIRY_DAYS;
        setCenterDefaultDays(days);
        setExpiresInDays(days);
        if (formList[0]?.formType) {
          setFormType(formList[0].formType);
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
    if (!formType) return SCT_UI.VALIDATE_REQUIRED;
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
      await createSctInvitation({
        formType,
        clientId: client?.id != null ? Number(client.id) : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        expiresInDays: Number(expiresInDays),
        requiresGuardian: formType === SCT_FORM_TYPE.CHILD
      });
      notificationManager.success(SCT_UI.SEND_SUCCESS);
      onSent?.();
      onClose();
    } catch (e) {
      setError(resolveUserFacingApiErrorMessage(e, SCT_UI.LOAD_FAIL));
    } finally {
      setBusy(false);
    }
  };

  const kindOptions = Object.keys(SCT_FORM_TYPE_LABEL).map((key) => ({
    value: key,
    label: SCT_FORM_TYPE_LABEL[key],
    fromApi: forms.find((f) => f.formType === key)
  }));

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={SCT_UI.SEND}
      size="medium"
      className={SCT_CSS.SEND_SHEET}
      actions={(
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
        {hasActiveDraft ? (
          <p className="mg-v2-sct-warn" role="status">{SCT_UI.RESEND_WARN}</p>
        ) : null}
        {formType === SCT_FORM_TYPE.CHILD ? (
          <p className="mg-v2-sct-warn" role="note">{SCT_UI.CHILD_GUARD_HINT}</p>
        ) : null}
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
            type="number"
            min={SCT_DEFAULTS.LINK_EXPIRY_MIN}
            max={SCT_DEFAULTS.LINK_EXPIRY_MAX}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
          />
        </div>
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
