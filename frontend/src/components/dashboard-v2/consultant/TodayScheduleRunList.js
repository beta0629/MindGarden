/**
 * 오늘 스케줄 run-list — 상태별 상담 시작/완료 액션
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import Icon from '../../ui/Icon/Icon';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import { renderCompactPackageName } from '../../../utils/packagePricing';
import { getConsultantScheduleListRowActions } from '../../../utils/consultantScheduleCardUi';
import { ContentSection } from '../content';
import {
  CONSULTANT_DASHBOARD_HOME_COPY as COPY,
  CONSULTANT_DASHBOARD_TODAY_SCHEDULE_TEST_ID,
  CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL,
  CONSULTANT_SCHEDULE_STATUS_LABELS
} from '../../../constants/consultantDashboardConstants';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../../constants/consultantDashboardRoutes';
import './ConsultantDashboardListSection.css';

/**
 * @param {string|Array|*} raw
 * @returns {string}
 */
function toDateYmd(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    const y = raw[0];
    const m = String(raw[1] ?? 1).padStart(2, '0');
    const d = String(raw[2] ?? 1).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw);
  if (s.includes('T')) {
    return s.split('T')[0];
  }
  return s.slice(0, 10);
}

/**
 * @param {string|Array|*} raw
 * @returns {string}
 */
function toHm(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (Array.isArray(raw)) {
    const h = String(raw[0] || 0).padStart(2, '0');
    const m = String(raw[1] || 0).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(raw);
  const part = s.includes('T') ? s.split('T')[1] : s;
  return part.slice(0, 5);
}

/**
 * @param {string} status
 * @returns {string}
 */
function resolveStatusLabel(status) {
  if (!status) {
    return CONSULTANT_SCHEDULE_STATUS_LABELS.PENDING;
  }
  return CONSULTANT_SCHEDULE_STATUS_LABELS[status] || CONSULTANT_SCHEDULE_STATUS_LABELS.PENDING;
}

const TodayScheduleRunList = ({
  schedules = [],
  loading = false,
  error = '',
  onRetry = null,
  onPrimaryAction = null,
  onRowClick = null,
  actionBusyId = null
}) => {
  const rows = useMemo(() => (
    (Array.isArray(schedules) ? schedules : []).map((schedule, idx) => {
      const scheduleId = schedule.id ?? schedule.scheduleId;
      const dateYmd = toDateYmd(schedule.date ?? schedule.startTime);
      const startHm = toHm(schedule.startTime);
      const endHm = toHm(schedule.endTime);
      const actionMeta = getConsultantScheduleListRowActions({
        status: schedule.status,
        date: dateYmd,
        startTime: startHm,
        endTime: endHm
      });
      return {
        id: scheduleId != null ? String(scheduleId) : `today-${idx}`,
        scheduleId,
        clientName: toDisplayString(schedule.clientName, '내담자'),
        packageLabel: schedule.packageName
          ? renderCompactPackageName(schedule.packageName)
          : '—',
        timeLabel: startHm && endHm ? `${startHm}–${endHm}` : startHm || '—',
        statusLabel: resolveStatusLabel(schedule.status),
        primaryActionLabel: actionMeta.primaryActionLabel,
        primaryActionKind: actionMeta.primaryActionKind,
        raw: schedule
      };
    })
  ), [schedules]);

  const titleNode = (
    <span className="consultant-dashboard-list-section__title">
      <Icon name="CLOCK" size="LG" color="TRANSPARENT" aria-hidden />
      <SafeText tag="span">{COPY.TODAY_SCHEDULE_TITLE}</SafeText>
    </span>
  );

  const viewAllAction = (
    <Link
      to={CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}
      className="consultant-dashboard-list-section__view-all"
    >
      <SafeText tag="span">{CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL}</SafeText>
    </Link>
  );

  let body = null;
  if (loading) {
    body = (
      <div
        className="consultant-dashboard-list-section__skeleton"
        aria-busy="true"
        data-testid="consultant-dashboard-list-skeleton"
      >
        <span className="sr-only">불러오는 중</span>
      </div>
    );
  } else if (error) {
    body = (
      <div className="consultant-dashboard-list-section__error-block" role="alert">
        <p className="consultant-dashboard-list-section__error">
          <SafeText tag="span">{error}</SafeText>
        </p>
        {typeof onRetry === 'function' ? (
          <MGButton
            type="button"
            variant="ghost"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'ghost',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onRetry}
            preventDoubleClick={false}
          >
            다시 시도
          </MGButton>
        ) : null}
      </div>
    );
  } else if (rows.length === 0) {
    body = (
      <p className="consultant-dashboard-list-section__empty">
        <SafeText tag="span">{COPY.TODAY_SCHEDULE_EMPTY}</SafeText>
      </p>
    );
  } else {
    body = (
      <ul className="consultant-today-run-list" aria-label={COPY.TODAY_SCHEDULE_TITLE}>
        {rows.map((row) => {
          const busy = actionBusyId != null && String(actionBusyId) === String(row.scheduleId);
          return (
            <li key={row.id} className="consultant-today-run-list__row">
              <button
                type="button"
                className="consultant-today-run-list__main"
                onClick={() => onRowClick?.(row.raw)}
              >
                <span className="consultant-today-run-list__time">
                  <SafeText tag="span">{row.timeLabel}</SafeText>
                </span>
                <span className="consultant-today-run-list__client">
                  <SafeText tag="span">{row.clientName}</SafeText>
                </span>
                <span className="consultant-today-run-list__meta">
                  <SafeText tag="span">{row.packageLabel}</SafeText>
                  {' · '}
                  <SafeText tag="span">{row.statusLabel}</SafeText>
                </span>
              </button>
              {row.primaryActionLabel ? (
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'sm',
                    loading: busy,
                    className: 'consultant-today-run-list__action'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrimaryAction?.(row.raw, row.primaryActionKind);
                  }}
                  preventDoubleClick
                  aria-label={`${row.clientName} ${row.primaryActionLabel}`}
                >
                  <SafeText tag="span">{row.primaryActionLabel}</SafeText>
                </MGButton>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ContentSection
      title={titleNode}
      actions={viewAllAction}
      className="mg-v2-content-section--full consultant-dashboard-v2__stage"
      dataTestId={CONSULTANT_DASHBOARD_TODAY_SCHEDULE_TEST_ID}
    >
      {body}
    </ContentSection>
  );
};

TodayScheduleRunList.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  onPrimaryAction: PropTypes.func,
  onRowClick: PropTypes.func,
  actionBusyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default TodayScheduleRunList;
