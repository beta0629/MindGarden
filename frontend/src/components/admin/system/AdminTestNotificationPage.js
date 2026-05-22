/**
 * 어드민 알림 테스트 발송 전용 페이지 (Page Organism).
 *
 * - 라우트: `ADMIN_ROUTES.TEST_NOTIFICATION` (`/admin/test-notification`)
 * - 메인 LNB "설정" 그룹 하위 진입점.
 * - 좌측 발송 폼(2fr) + 우측 발송 이력(1fr) 2단 그리드, 모바일에서는 단일 컬럼.
 * - 권한: ADMIN/STAFF만 진입 허용 (그 외 역할 추가 금지).
 * - 발송 성공 시 `historyRefreshKey` 증가로 우측 이력 자동 재조회 (SystemTools.js 패턴 차용).
 *
 * 참조:
 *  - docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_DESIGN_HANDOFF.md §2
 *  - frontend/src/components/admin/system/SystemTools.js (좌·우 그리드 패턴)
 *  - frontend/src/components/admin/AdminKakaoAlimtalkSettingsPage.js (페이지 헤더/권한 가드 패턴)
 *
 * @author MindGarden
 * @since 2026-05-22
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
import TestNotificationForm from './TestNotificationForm';
import TestNotificationHistory from './TestNotificationHistory';
import '../../../styles/unified-design-tokens.css';
import '../AdminDashboard/AdminDashboardB0KlA.css';
import './AdminTestNotificationPage.css';

const ADMIN_TEST_NOTIFICATION_ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
const PAGE_TITLE_ID = 'admin-test-notification-title';

const AdminTestNotificationPage = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const hasAccess = RoleUtils.hasAnyRole(user, ADMIN_TEST_NOTIFICATION_ALLOWED_ROLES);

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
        t('testNotification.page.noAccess', '이 페이지에 접근할 권한이 없습니다.'),
        'error'
      );
      navigate('/', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, user, hasAccess, navigate, t]);

  const handleSentSuccess = useCallback(() => {
    setHistoryRefreshKey((prev) => prev + 1);
  }, []);

  const pageTitle = t('testNotification.page.title', '알림 테스트 발송');
  const pageSubtitle = t(
    'testNotification.page.subtitle',
    '어드민이 본인·DB 사용자에게 SMS·카카오 알림톡을 테스트 발송하여 운영 사고를 재현·예방합니다.'
  );

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
        className="mg-v2-ad-b0kla mg-v2-admin-test-notification"
        data-testid="admin-test-notification-page"
      >
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <ContentHeader
              titleId={PAGE_TITLE_ID}
              title={pageTitle}
              subtitle={pageSubtitle}
            />

            <section
              className="mg-admin-test-notif-page__panel"
              aria-labelledby={PAGE_TITLE_ID}
            >
              <div className="mg-admin-test-notif-page__grid">
                <div className="mg-admin-test-notif-page__form">
                  <TestNotificationForm onSentSuccess={handleSentSuccess} />
                </div>
                <div className="mg-admin-test-notif-page__history">
                  <TestNotificationHistory refreshKey={historyRefreshKey} />
                </div>
              </div>
            </section>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminTestNotificationPage;
