/**
 * 수동 발송 확인 모달 (Organism).
 *
 * 서버가 확정한 최종 인원·제외 인원·조건 미충족 사유·마스킹 미리보기·메시지 미리보기를 보여 주고,
 * 「○명에게 발송」 버튼을 눌러야만 발송 작업을 만든다. 표시 인원은 서버 미리보기 값 그대로다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsButton, SettingsNotice } from '../settings-shell';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';

const MODAL_CLASS = 'mg-manual-notif-confirm';

/**
 * @param {{
 *   isOpen: boolean,
 *   preview: (object|null),
 *   submitting: boolean,
 *   errorMessage: (string|null),
 *   setChanged: boolean,
 *   onClose: function,
 *   onConfirm: function,
 *   onRecheck: function
 * }} props
 */
const ManualNotificationJobConfirmModal = ({
  isOpen,
  preview,
  submitting,
  errorMessage,
  setChanged,
  onClose,
  onConfirm,
  onRecheck
}) => {
  const { t } = useTranslation('admin');
  const finalCount = Number(preview?.finalCount ?? 0);
  const reasons = preview?.ineligibleReasons && typeof preview.ineligibleReasons === 'object'
    ? Object.entries(preview.ineligibleReasons)
    : [];
  const recipients = Array.isArray(preview?.previewRecipients) ? preview.previewRecipients : [];
  const message = preview?.messagePreview || {};

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('manualNotification.job.confirmTitle')}
      subtitle={t('manualNotification.job.confirmSubtitle')}
      size="medium"
      variant="confirm"
      loading={submitting}
      actions={(
        <>
          <SettingsButton type="button" variant="outline" preventDoubleClick onClick={onClose} disabled={submitting}>
            {t('manualNotification.submit.cancel')}
          </SettingsButton>
          {setChanged ? (
            <SettingsButton type="button" variant="primary" preventDoubleClick onClick={onRecheck}>
              {t('manualNotification.job.recheck')}
            </SettingsButton>
          ) : (
            <SettingsButton
              type="button"
              variant="danger"
              preventDoubleClick
              loading={submitting}
              disabled={submitting || finalCount === 0}
              onClick={onConfirm}
              data-testid="manual-notif-job-send"
            >
              {t('manualNotification.job.sendToCount', { count: finalCount })}
            </SettingsButton>
          )}
        </>
      )}
    >
      <div className={MODAL_CLASS}>
        {errorMessage && (
          <SettingsNotice tone="danger" role="alert">
            {toDisplayString(errorMessage, '')}
          </SettingsNotice>
        )}
        <dl className="mg-v2-settings-kv">
          <div>
            <dt>{t('manualNotification.job.finalCount')}</dt>
            <dd data-testid="manual-notif-job-final-count">
              {t('manualNotification.summary.recipientCountValue', { count: finalCount })}
            </dd>
          </div>
          <div>
            <dt>{t('manualNotification.job.excludedCount')}</dt>
            <dd>{t('manualNotification.summary.recipientCountValue', { count: Number(preview?.excludedCount ?? 0) })}</dd>
          </div>
          <div>
            <dt>{t('manualNotification.job.ineligibleCount')}</dt>
            <dd>
              {t('manualNotification.summary.recipientCountValue', { count: Number(preview?.ineligibleCount ?? 0) })}
              {reasons.length > 0 && (
                <span className="mg-v2-settings-muted">
                  {' ('}
                  {reasons.map(([code, count]) => `${t(`manualNotification.job.ineligibleReason.${code}`, {
                    defaultValue: code
                  })} ${toDisplayString(count, '0')}`).join(', ')}
                  {')'}
                </span>
              )}
            </dd>
          </div>
        </dl>

        {recipients.length > 0 && (
          <section className={`${MODAL_CLASS}__section`} aria-label={t('manualNotification.job.previewListTitle', { count: recipients.length })}>
            <h4 className="mg-v2-settings-subheading">
              {t('manualNotification.job.previewListTitle', { count: recipients.length })}
            </h4>
            <ul className={`${MODAL_CLASS}__list`}>
              {recipients.map((r, idx) => (
                <li key={`${r?.userId ?? 'p'}-${idx}`} className={`${MODAL_CLASS}__list-item`}>
                  <span>{toDisplayString(r?.nameMasked, '-')}</span>
                  <span className="mg-v2-settings-muted">{toDisplayString(r?.phoneMasked, '-')}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={`${MODAL_CLASS}__section`} aria-label={t('manualNotification.job.messagePreviewTitle')}>
          <h4 className="mg-v2-settings-subheading">{t('manualNotification.job.messagePreviewTitle')}</h4>
          {message.title && <p className={`${MODAL_CLASS}__message-title`}>{toDisplayString(message.title, '')}</p>}
          {(message.content || message.body) && (
            <pre className={`${MODAL_CLASS}__message`}>{toDisplayString(message.content || message.body, '')}</pre>
          )}
          {message.templateCode && (
            <p className="mg-v2-settings-mono">{toDisplayString(message.templateCode, '')}</p>
          )}
        </section>
      </div>
    </UnifiedModal>
  );
};

export default ManualNotificationJobConfirmModal;
