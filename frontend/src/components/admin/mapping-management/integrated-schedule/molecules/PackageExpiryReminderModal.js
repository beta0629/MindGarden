/**
 * PackageExpiryReminderModal — 상담 시작 전 회기권 패키지 만료 임박 (관리자)
 *
 * 특이사항 알림({@code ScheduleNotesReminderModal})과 제목·섹션을 분리한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../../../common/modals/UnifiedModal';
import MGButton from '../../../../common/MGButton';
import SafeText from '../../../../common/SafeText';
import RemainingSessionsBadge from '../../../../common/RemainingSessionsBadge';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import {
  PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL,
  PACKAGE_EXPIRY_REMINDER_LAST_SESSION_HINT,
  PACKAGE_EXPIRY_REMINDER_LEAD,
  PACKAGE_EXPIRY_REMINDER_LOW_SESSIONS_HINT,
  PACKAGE_EXPIRY_REMINDER_MIN_REMAINING_SESSIONS,
  PACKAGE_EXPIRY_REMINDER_SECTION_TITLE,
  PACKAGE_EXPIRY_REMINDER_TITLE
} from '../constants/packageExpiryReminderConstants';
import './PackageExpiryReminderModal.css';

const PackageExpiryReminderModal = ({
  isOpen,
  onClose,
  clientName,
  consultantName,
  startTimeLabel,
  remainingSessions,
  totalSessions
}) => {
  const subtitleParts = [
    clientName ? String(clientName).trim() : '',
    startTimeLabel ? String(startTimeLabel).trim() : ''
  ].filter(Boolean);

  const remainingCount = Number(remainingSessions);
  const hint = remainingCount === PACKAGE_EXPIRY_REMINDER_MIN_REMAINING_SESSIONS
    ? PACKAGE_EXPIRY_REMINDER_LAST_SESSION_HINT
    : PACKAGE_EXPIRY_REMINDER_LOW_SESSIONS_HINT;

  const totalCount = Number(totalSessions);
  const remainingSummary = Number.isFinite(totalCount) && totalCount > 0
    ? `잔여 ${toDisplayString(remainingCount, '0')}회 / 전체 ${toDisplayString(totalCount, '0')}회`
    : `잔여 ${toDisplayString(remainingCount, '0')}회`;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={PACKAGE_EXPIRY_REMINDER_TITLE}
      size="medium"
      className="mg-v2-ad-b0kla package-expiry-reminder-modal"
      backdropClick
      showCloseButton
      actions={(
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'package-expiry-reminder-modal__confirm-btn'
          })}
          onClick={onClose}
          aria-label={PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          {PACKAGE_EXPIRY_REMINDER_CONFIRM_LABEL}
        </MGButton>
      )}
    >
      <div className="package-expiry-reminder-modal__intro">
        <p className="package-expiry-reminder-modal__lead">
          <SafeText>
            {toDisplayString(PACKAGE_EXPIRY_REMINDER_LEAD, '')}
          </SafeText>
        </p>
        {subtitleParts.length > 0 ? (
          <p className="package-expiry-reminder-modal__session">
            <SafeText>
              {toDisplayString(subtitleParts.join(' · '), '')}
            </SafeText>
            {consultantName ? (
              <span className="package-expiry-reminder-modal__consultant">
                <SafeText>{toDisplayString(`상담사 ${consultantName}`, '')}</SafeText>
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      <section className="package-expiry-reminder-modal__section mg-v2-ad-modal__section">
        <h2 className="section-title package-expiry-reminder-modal__section-title">
          {PACKAGE_EXPIRY_REMINDER_SECTION_TITLE}
        </h2>
        <p className="package-expiry-reminder-modal__summary">
          <RemainingSessionsBadge remainingSessions={
            Number.isFinite(remainingCount) ? remainingCount : 0
          }
          />
          <SafeText>{toDisplayString(remainingSummary, '')}</SafeText>
        </p>
        <p className="package-expiry-reminder-modal__hint">
          <SafeText>{toDisplayString(hint, '')}</SafeText>
        </p>
      </section>
    </UnifiedModal>
  );
};

PackageExpiryReminderModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  clientName: PropTypes.string,
  consultantName: PropTypes.string,
  startTimeLabel: PropTypes.string,
  remainingSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  totalSessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

PackageExpiryReminderModal.defaultProps = {
  isOpen: false,
  clientName: '',
  consultantName: '',
  startTimeLabel: '',
  remainingSessions: 0,
  totalSessions: 0
};

export default PackageExpiryReminderModal;
