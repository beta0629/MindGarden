/**
 * 어드민 수동 알림 발송 도구 페이지 (Page Template / Organism 컨테이너).
 *
 * 크롬: SettingsPageShell(quiet header) — 폼·히스토리는 각자 SettingsSectionPanel 을 렌더.
 * Summary strip 생략 (KPI 부재 — consultation-logs twin).
 *
 * @author MindGarden
 * @since 2026-05-23
 * @updated 2026-09-05 — Clinic-OS chrome alignment
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import { SettingsPageShell } from '../settings-shell';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES, RoleUtils } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import ManualNotificationForm from './ManualNotificationForm';
import ManualNotificationBatchHistory from './ManualNotificationBatchHistory';
import '../../../styles/unified-design-tokens.css';
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
        t('manualNotification.page.noAccess'),
        'error'
      );
      navigate('/', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, user, hasAccess, navigate, t]);

  const handleBatchSent = useCallback(() => {
    setHistoryRefreshKey((prev) => prev + 1);
  }, []);

  const pageTitle = t('manualNotification.page.title');

  if (sessionLoading || !hasAccess) {
    return (
      <AdminCommonLayout
        title={pageTitle}
        className="mg-v2-dashboard-layout"
        loading
        loadingText={t('common:messages.loading', { defaultValue: '로딩 중...' })}
      />
    );
  }

  return (
    <AdminCommonLayout title={pageTitle} className="mg-v2-dashboard-layout">
      <div
        className="mg-v2-admin-manual-notification manual-notification--clinic-os"
        data-testid="admin-manual-notification-page"
      >
        <SettingsPageShell title={pageTitle} titleId={PAGE_TITLE_ID}>
          <ManualNotificationForm onBatchSent={handleBatchSent} />
          <ManualNotificationBatchHistory refreshKey={historyRefreshKey} />
        </SettingsPageShell>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminManualNotificationPage;
