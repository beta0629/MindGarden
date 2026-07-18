/**
 * MatchingScheduleCompactRow — 사이드바 Compact 밀도 단일 행 (32~36px)
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import SafeText from '../../../../common/SafeText';
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { renderCompactPackageName } from '../../../../../utils/packagePricing';
import {
  MAPPING_SCHEDULE_STATUS_KIND,
  resolveMappingScheduleStatus
} from '../utils/mappingScheduleStatusDisplay';
import {
  MAPPING_DESYNC_BADGE_VARIANT,
  MAPPING_DESYNC_KIND,
  resolveMappingScheduleDesync
} from '../utils/mappingScheduleDesync';
import './MatchingScheduleCompactRow.css';

const STATUS_ACCENT_CLASS = {
  ACTIVE: 'integrated-schedule__compact-row--accent-active',
  PENDING_PAYMENT: 'integrated-schedule__compact-row--accent-warning',
  PAYMENT_CONFIRMED: 'integrated-schedule__compact-row--accent-info',
  DEPOSIT_PENDING: 'integrated-schedule__compact-row--accent-warning',
  INACTIVE: 'integrated-schedule__compact-row--accent-muted',
  TERMINATED: 'integrated-schedule__compact-row--accent-muted',
  SESSIONS_EXHAUSTED: 'integrated-schedule__compact-row--accent-muted',
  SUSPENDED: 'integrated-schedule__compact-row--accent-muted'
};

const resolveAccentClass = (status) => {
  const key = toDisplayString(status, '');
  return STATUS_ACCENT_CLASS[key] || 'integrated-schedule__compact-row--accent-default';
};

const buildPartiesLabel = (consultantName, clientName, clientHonorific) => {
  const consultant = toDisplayString(consultantName, 'N/A');
  const client = toDisplayString(clientName, 'N/A');
  return `${consultant} → ${client} ${clientHonorific}`;
};

const MatchingScheduleCompactRow = ({
  mapping,
  onOpenPeek,
  isActive
}) => {
  const { t } = useTranslation('admin');
  const clientHonorific = t('labels.client');
  const partiesLabel = buildPartiesLabel(
    mapping?.consultantName,
    mapping?.clientName,
    clientHonorific
  );
  const remainingSessions = mapping?.remainingSessions;
  const pendingSessions = mapping?.pendingSessionExtension?.additionalSessions;
  let secondaryLabel = remainingSessions != null
    ? t('integratedSchedule.sidebar.compactRemainingSessions', { count: remainingSessions })
    : toDisplayString(mapping?.status, '');
  if (mapping?.pendingSessionExtension) {
    const pendingSuffix = pendingSessions != null ? ` +${pendingSessions}회기` : '';
    secondaryLabel = `회기추가 입금대기${pendingSuffix}`;
  }

  const scheduleStatus = resolveMappingScheduleStatus(mapping);
  const scheduleStatusLabel = toDisplayString(scheduleStatus.label, '');
  const desync = resolveMappingScheduleDesync(mapping);
  const desyncBadgeLabel = toDisplayString(desync.badgeLabel, '');
  const desyncTooltip = toDisplayString(desync.tooltip, '');
  const showDesyncText = desync.isDesync && Boolean(desyncBadgeLabel);
  const showSessionsInProgressHint =
    desync.kind === MAPPING_DESYNC_KIND.SESSIONS_IN_PROGRESS;

  const statusSegment = showDesyncText
    ? desyncBadgeLabel
    : scheduleStatusLabel;
  const secondaryTitle = [
    secondaryLabel,
    statusSegment,
    showSessionsInProgressHint ? desyncTooltip : '',
    showDesyncText ? desyncTooltip : ''
  ].filter(Boolean).join(' | ');

  const handleClick = () => {
    if (onOpenPeek) {
      onOpenPeek(mapping);
    }
  };

  const handleKeyDown = (event) => {
    if (!onOpenPeek) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenPeek(mapping);
    }
  };

  const accentClass = resolveAccentClass(mapping?.status);
  let scheduleStatusClass =
    scheduleStatus.kind === MAPPING_SCHEDULE_STATUS_KIND.REGISTERED
      ? 'integrated-schedule__compact-schedule-status--registered'
      : 'integrated-schedule__compact-schedule-status--muted';
  if (showDesyncText) {
    scheduleStatusClass =
      desync.badgeVariant === MAPPING_DESYNC_BADGE_VARIANT.ERROR
        ? 'integrated-schedule__compact-schedule-status--desync-error'
        : 'integrated-schedule__compact-schedule-status--desync-warning';
  }

  let ariaLabel;
  if (onOpenPeek) {
    ariaLabel = `${partiesLabel} 상세 보기`;
    if (desyncTooltip) {
      ariaLabel = `${ariaLabel} — ${desyncTooltip}`;
    }
  }

  return (
    <div
      className={`integrated-schedule__compact-row ${accentClass}${
        isActive ? ' integrated-schedule__compact-row--active' : ''
      }${onOpenPeek ? ' integrated-schedule__compact-row--interactive' : ''}`}
      role={onOpenPeek ? 'button' : undefined}
      tabIndex={onOpenPeek ? 0 : undefined}
      onClick={onOpenPeek ? handleClick : undefined}
      onKeyDown={onOpenPeek ? handleKeyDown : undefined}
      aria-label={ariaLabel}
      title={partiesLabel}
    >
      <span className="integrated-schedule__compact-row-accent" aria-hidden="true" />
      <span className="integrated-schedule__compact-row-primary" title={partiesLabel}>
        <SafeText className="integrated-schedule__compact-row-consultant" fallback="N/A">
          {mapping?.consultantName}
        </SafeText>
        <span className="integrated-schedule__compact-row-arrow" aria-hidden="true">→</span>
        <SafeText className="integrated-schedule__compact-row-client" fallback="N/A">
          {mapping?.clientName}
        </SafeText>
      </span>
      {mapping?.packageName && (
        <span
          className="integrated-schedule__compact-row-package"
          title={toDisplayString(mapping.packageName)}
        >
          {renderCompactPackageName(mapping.packageName)}
        </span>
      )}
      <span className="integrated-schedule__compact-row-secondary" title={secondaryTitle}>
        <SafeText>{secondaryLabel}</SafeText>
        {statusSegment ? (
          <>
            <span className="integrated-schedule__compact-row-sep" aria-hidden="true">|</span>
            <SafeText
              className={`integrated-schedule__compact-schedule-status ${scheduleStatusClass}`}
            >
              {statusSegment}
            </SafeText>
          </>
        ) : null}
      </span>
    </div>
  );
};

MatchingScheduleCompactRow.propTypes = {
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    consultantName: PropTypes.string,
    clientName: PropTypes.string,
    packageName: PropTypes.string,
    status: PropTypes.string,
    remainingSessions: PropTypes.number,
    pendingSessionExtension: PropTypes.object,
    hasConsultationSchedule: PropTypes.bool,
    nextConsultationDate: PropTypes.string,
    paymentTiming: PropTypes.string
  }),
  onOpenPeek: PropTypes.func,
  isActive: PropTypes.bool
};

MatchingScheduleCompactRow.defaultProps = {
  mapping: null,
  onOpenPeek: null,
  isActive: false
};

export default MatchingScheduleCompactRow;
