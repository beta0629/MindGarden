/**
 * 어드민 수동 알림 발송 도구 페이지 (Page Template / Organism 컨테이너).
 *
 * - 라우트: `ADMIN_ROUTES.MANUAL_NOTIFICATION` (`/admin/manual-notification`)
 * - LNB "설정" 그룹 하위 진입점 (테스트 발송 도구 바로 아래)
 * - 권한: ADMIN/STAFF (HQ_ADMIN/SUPER_ADMIN 등 신규 코드 0 — 제약 준수)
 * - 레이아웃: 상단 `ContentHeader` + 본문 (`ManualNotificationForm`) + 하단 (`ManualNotificationBatchHistory`)
 * - 발송 성공 시 `historyRefreshKey` 증가로 히스토리 자동 재조회
 *   (AdminTestNotificationPage 패턴 차용)
 *
 * 디자인 토큰만 사용. 인라인 스타일 0건. 자체 모달 X.
 *
 * 참조:
 *  - docs/project-management/2026-05-23/MANUAL_NOTIFICATION_DESIGN_HANDOFF.md
 *  - frontend/src/components/admin/system/AdminTestNotificationPage.js
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../../dashboard-v2/content';
import UnifiedLoading from '../../common/UnifiedLoading';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import ManualNotificationForm from './ManualNotificationForm';
import ManualNotificationBatchHistory from './ManualNotificationBatchHistory';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './AdminManualNotificationPage.css';

const ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-manual-notification-title';

const AdminManualNotificationPage = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const hasAccess = RoleUtils.hasAnyRole(user, ALLOWED_ROLES);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasAccess) {
      notificationManager.show(
        t('manualNotification.page.noAccess', '이 페이지에 접근할 권한이 없습니다.'),
        'error'
      );
      navigate('/', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, user, hasAccess, navigate, t]);

  const handleBatchSent = useCallback(() => {
    setHistoryRefreshKey((prev) => prev + 1);
  }, []);

  const pageTitle = t('manualNotification.page.title', '수동 알림 발송');
  const pageSubtitle = t('manualNotification.page.subtitle');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
        <UnifiedLoading text="로딩 중..." />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
      <div
        className="mg-v2-ad-b0kla mg-v2-admin-manual-notification"
        data-testid="admin-manual-notification-page"
      >
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <ContentHeader
              titleId={PAGE_TITLE_ID}
              title={pageTitle}
              subtitle={pageSubtitle}
            />

            <section
              className="mg-admin-manual-notif-page__panel"
              aria-labelledby={PAGE_TITLE_ID}
            >
              <div className="mg-admin-manual-notif-page__form-area">
                <ManualNotificationForm onBatchSent={handleBatchSent} />
              </div>
              <div className="mg-admin-manual-notif-page__history-area">
                <ManualNotificationBatchHistory refreshKey={historyRefreshKey} />
              </div>
            </section>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminManualNotificationPage;
