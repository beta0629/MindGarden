/**
 * Client Dashboard — 다음 액션·일정 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { ContentSection } from '../../dashboard-v2/content';
import { buildErpMgButtonClassName } from '../../erp/common/erpMgButtonProps';
import {
  CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID,
  CLIENT_NEXT_SECTION_DESC,
  CLIENT_NEXT_SECTION_TITLE,
  CLIENT_SCHEDULE_DETAIL_HINT,
  CLIENT_SCHEDULE_EMPTY_BODY,
  CLIENT_SCHEDULE_VIEW_LABEL
} from './constants';
import { formatScheduleCardDateTime } from './scheduleUtils';

const outlineBtnClass = buildErpMgButtonClassName({ variant: 'outline', loading: false });
const primaryBtnClass = buildErpMgButtonClassName({ variant: 'primary', loading: false });

const ClientDashboardUpcomingSection = ({ schedules, onNavigateSchedule }) => {
  const { t } = useTranslation();
  const cards = [schedules[0], schedules[1]].filter(Boolean);

  return (
    <ContentSection
      title={CLIENT_NEXT_SECTION_TITLE}
      subtitle={CLIENT_NEXT_SECTION_DESC}
      className="client-dashboard__section client-dashboard__section--upcoming"
      dataTestId={CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID}
      noCard
    >
      {cards.length > 0 ? (
        <ul className="client-dashboard__card-stack">
          {cards.map((schedule, idx) => (
            <li key={`${schedule.date}-${schedule.startTime}-${idx}`}>
              <article
                className="mg-v2-card-container client-dashboard__action-card"
                aria-labelledby={`client-dashboard-action-${idx}`}
              >
                <div className="client-dashboard__action-body">
                  <div className="client-dashboard__action-top">
                    <span
                      className={
                        idx === 0
                          ? 'mg-v2-status-badge mg-v2-badge--warning'
                          : 'mg-v2-status-badge mg-v2-badge--neutral'
                      }
                    >
                      {idx === 0 ? '다음 일정' : t('common:client.ClientDashboard.t_7ba9542c')}
                    </span>
                    <time className="client-dashboard__time" dateTime={schedule.date}>
                      {formatScheduleCardDateTime(schedule)}
                    </time>
                  </div>
                  <h3 id={`client-dashboard-action-${idx}`} className="client-dashboard__card-title">
                    <SafeText>{schedule.title || t('common:client.ClientDashboard.t_4968e29c')}</SafeText>
                  </h3>
                  <p className="client-dashboard__card-text">{CLIENT_SCHEDULE_DETAIL_HINT}</p>
                </div>
                <div className="mg-v2-card-actions client-dashboard__card-actions">
                  <MGButton
                    variant="primary"
                    className={primaryBtnClass}
                    onClick={onNavigateSchedule}
                    preventDoubleClick={false}
                  >
                    {CLIENT_SCHEDULE_VIEW_LABEL}
                  </MGButton>
                  {idx === 0 ? (
                    <MGButton
                      variant="outline"
                      className={outlineBtnClass}
                      onClick={onNavigateSchedule}
                      preventDoubleClick={false}
                    >
                      자세히
                    </MGButton>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="client-dashboard__schedule-empty">
          <p>{CLIENT_SCHEDULE_EMPTY_BODY}</p>
          <MGButton
            variant="primary"
            className={`${primaryBtnClass} client-dashboard__schedule-empty-cta`}
            onClick={onNavigateSchedule}
            preventDoubleClick={false}
          >
            {CLIENT_SCHEDULE_VIEW_LABEL}
          </MGButton>
        </div>
      )}
    </ContentSection>
  );
};

ClientDashboardUpcomingSection.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.object),
  onNavigateSchedule: PropTypes.func.isRequired
};

export default ClientDashboardUpcomingSection;
