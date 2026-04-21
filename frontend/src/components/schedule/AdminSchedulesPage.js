import React from 'react';
import UnifiedScheduleComponent from './UnifiedScheduleComponent';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

const ADMIN_SCHEDULES_TITLE_ID = 'admin-schedules-title';

/**
 * 관리자 스케줄 — ACL 하위 B0KlA 셸 + 통합 스케줄 본문
 *
 * @author CoreSolution
 * @since 2026-03-21
 */
const AdminSchedulesPage = ({ userRole, userId }) => (
  <AdminCommonLayout title="스케줄">
    <div className="mg-v2-ad-b0kla mg-v2-admin-schedules-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="관리자 스케줄 본문">
          <ContentHeader
            title="스케줄"
            subtitle="통합 스케줄을 확인하고 관리합니다"
            titleId={ADMIN_SCHEDULES_TITLE_ID}
          />
          <main aria-labelledby={ADMIN_SCHEDULES_TITLE_ID}>
            <UnifiedScheduleComponent
              userRole={userRole}
              userId={userId}
            />
          </main>
        </ContentArea>
      </div>
    </div>
  </AdminCommonLayout>
);

export default AdminSchedulesPage;
