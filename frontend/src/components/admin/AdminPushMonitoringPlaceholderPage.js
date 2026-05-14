/**
 * 푸시 설정 모니터링 — BW-1 API 연결 전 플레이스홀더
 * @author CoreSolution
 * @since 2026-05-14
 */

import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import EmptyState from '../common/EmptyState';
import SafeText from '../common/SafeText';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../constants/adminWebScaffold';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-push-monitoring-title';

const AdminPushMonitoringPlaceholderPage = () => {
  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}>
      <div className="mg-v2-ad-b0kla" data-testid="admin-push-monitoring-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />
            <ContentSection title={ADMIN_WEB_SCAFFOLD_COPY.SECTION_PUSH_INFO}>
              <EmptyState
                title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_EMPTY_TITLE}
                description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_PLACEHOLDER_BODY}
              />
              <p className="mg-v2-content-section__subtitle">
                <SafeText tag="span">{ADMIN_WEB_SCAFFOLD_COPY.PUSH_FOOTER_NOTE}</SafeText>
              </p>
            </ContentSection>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminPushMonitoringPlaceholderPage;
