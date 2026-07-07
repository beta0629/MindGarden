/**
 * Client Dashboard — KPI 섹션
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, Heart, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContentSection, ContentKpiRow } from '../../dashboard-v2/content';
import { toSafeNumber } from '../../../utils/safeDisplay';
import {
  CLIENT_DASHBOARD_KPI_SECTION_TEST_ID,
  CLIENT_KPI_SECTION_DESC,
  CLIENT_KPI_SECTION_TITLE
} from './constants';

const KPI_ICON_PROPS = { size: 28, strokeWidth: 2, 'aria-hidden': true };

const ClientDashboardKpiSection = ({
  remainingSessions,
  thisMonthScheduleCount,
  unreadMessageCount,
  onNavigateSessions,
  onNavigateSchedule,
  onNavigateMessages
}) => {
  const { t } = useTranslation();
  const unread = toSafeNumber(unreadMessageCount);

  return (
    <ContentSection
      title={CLIENT_KPI_SECTION_TITLE}
      subtitle={CLIENT_KPI_SECTION_DESC}
      className="client-dashboard__section client-dashboard__section--kpi"
      dataTestId={CLIENT_DASHBOARD_KPI_SECTION_TEST_ID}
      noCard
    >
      <ContentKpiRow
        items={[
          {
            id: 'remainingSessions',
            icon: <Heart {...KPI_ICON_PROPS} />,
            label: t('common:client.ClientDashboard.t_e9792c10'),
            value: toSafeNumber(remainingSessions),
            iconVariant: 'gray',
            onClick: onNavigateSessions
          },
          {
            id: 'thisMonthConsultations',
            icon: <Calendar {...KPI_ICON_PROPS} />,
            label: t('common:client.ClientDashboard.t_4af64dc5'),
            value: toSafeNumber(thisMonthScheduleCount),
            iconVariant: 'blue',
            onClick: onNavigateSchedule
          },
          {
            id: 'unreadMessages',
            icon: <Bell {...KPI_ICON_PROPS} />,
            label: t('common:client.ClientDashboard.t_83cce32e'),
            value: unread,
            iconVariant: 'orange',
            subtitleBadge: unread > 0 ? '새 소식' : null,
            badgeVariant: 'green',
            onClick: onNavigateMessages
          }
        ]}
      />
    </ContentSection>
  );
};

ClientDashboardKpiSection.propTypes = {
  remainingSessions: PropTypes.number,
  thisMonthScheduleCount: PropTypes.number,
  unreadMessageCount: PropTypes.number,
  onNavigateSessions: PropTypes.func.isRequired,
  onNavigateSchedule: PropTypes.func.isRequired,
  onNavigateMessages: PropTypes.func.isRequired
};

export default ClientDashboardKpiSection;
