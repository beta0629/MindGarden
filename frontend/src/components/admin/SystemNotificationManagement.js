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
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import SystemNotificationListBlock from './organisms/SystemNotificationListBlock';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';

const SystemNotificationManagement = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();
  const hasManagePermission = hasPermission(userPermissions, 'SYSTEM_NOTIFICATION_MANAGE');

  useEffect(() => {
    const load = async () => {
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

  if (!sessionIsLoggedIn || !sessionUser) {
    const msg = (
      <div className="mg-v2-card mg-v2-text-center mg-p-xl">
        <h3>로그인이 필요합니다.</h3>
      </div>
    );
    return (
      <AdminCommonLayout title="시스템 공지 관리">
        {msg}
      </AdminCommonLayout>
    );
  }

  if (permissionsLoading) {
    return (
      <AdminCommonLayout title="시스템 공지 관리" loading loadingText="권한을 확인하는 중...">
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text="권한을 확인하는 중..." />
        </div>
      </AdminCommonLayout>
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
    return <AdminCommonLayout title="시스템 공지 관리">{noPerm}</AdminCommonLayout>;
  }

  return (
    <AdminCommonLayout title="시스템 공지 관리">
      <main className="mg-v2-dashboard-layout">
        <ContentHeader
          title="시스템 공지 관리"
          subtitle="공지를 작성·수정·게시·보관할 수 있습니다."
          actions={
            <MGButton
              type="button"
              variant="primary"
              className="mg-v2-button mg-v2-button--primary"
              aria-label="공지 작성"
              onClick={() => globalThis.dispatchEvent(new CustomEvent('admin-notifications-create-notice'))}
            >
              공지 작성
            </MGButton>
          }
        />
        <SystemNotificationListBlock
          hasManagePermission={hasManagePermission}
          onOpenCreate={hasManagePermission}
        />
      </main>
    </AdminCommonLayout>
  );
};

export default SystemNotificationManagement;
