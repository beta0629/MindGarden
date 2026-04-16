/**
 * 시스템 공지 관리 (관리자 전용)
 * 단독 라우트는 /admin/notifications로 리다이렉트됨.
 * SystemNotificationListBlock + SystemNotificationFormModal 재사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect } from 'react';
import { fetchUserPermissions, hasPermission } from '../../utils/permissionUtils';
import { sessionManager } from '../../utils/sessionManager';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SystemNotificationListBlock from './organisms/SystemNotificationListBlock';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const SYSTEM_NOTIFICATION_PAGE_TITLE_ID = 'system-notification-management-title';
const SYSTEM_NOTIFICATION_CONTENT_ARIA_LABEL = '시스템 공지 관리 콘텐츠';

const SystemNotificationManagement = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();
  const hasManagePermission = hasPermission(userPermissions, 'SYSTEM_NOTIFICATION_MANAGE');

  useEffect(() => {
    const load = async() => {
      if (sessionIsLoggedIn && sessionUser) {
        setPermissionsLoading(true);
        try {
          await fetchUserPermissions(setUserPermissions);
        } catch (error) {
          console.error('권한 로드 오류:', error);
        } finally {
          setPermissionsLoading(false);
        }
      } else {
        setPermissionsLoading(false);
      }
    };
    load();
  }, [sessionIsLoggedIn, sessionUser]);

  const shell = (mainContent, headerActions = null) => (
    <AdminCommonLayout title="시스템 공지 관리">
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={SYSTEM_NOTIFICATION_CONTENT_ARIA_LABEL}>
            <ContentHeader
              title="시스템 공지 관리"
              subtitle="공지를 작성·수정·게시·보관할 수 있습니다."
              titleId={SYSTEM_NOTIFICATION_PAGE_TITLE_ID}
              actions={headerActions}
            />
            <main aria-labelledby={SYSTEM_NOTIFICATION_PAGE_TITLE_ID}>
              {mainContent}
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );

  if (!sessionIsLoggedIn || !sessionUser) {
    const msg = (
      <div className="mg-v2-card mg-v2-text-center mg-p-xl">
        <h3>로그인이 필요합니다.</h3>
      </div>
    );
    return shell(msg);
  }

  if (permissionsLoading) {
    return shell(
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text="권한을 확인하는 중..." />
      </div>
    );
  }

  if (!hasManagePermission) {
    const noPerm = (
      <div className="mg-v2-card mg-v2-text-center mg-p-xl">
        <h3>접근 권한이 없습니다.</h3>
        <p className="mg-v2-text-sm mg-v2-color-text-secondary">
          시스템 공지 관리 권한이 필요합니다.
        </p>
      </div>
    );
    return shell(noPerm);
  }

  return shell(
    <SystemNotificationListBlock
      hasManagePermission={hasManagePermission}
      onOpenCreate={hasManagePermission}
    />,
    <MGButton
      type="button"
      variant="primary"
      className={buildErpMgButtonClassName({
        variant: 'primary',
        size: 'md',
        loading: false
      })}
      aria-label="공지 작성"
      onClick={() => globalThis.dispatchEvent(new CustomEvent('admin-notifications-create-notice'))}
      loading={false}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
    >
      공지 작성
    </MGButton>
  );
};

export default SystemNotificationManagement;
