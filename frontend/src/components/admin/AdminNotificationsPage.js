/**
 * 알림·메시지 관리 통합 페이지
 * 탭: 시스템 공지 | 메시지. AdminCommonLayout + ContentHeader + 탭별 블록.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import SystemNotificationManagement from './SystemNotificationManagement';
import AdminMessages from './AdminMessages';
import { fetchUserPermissions } from '../../utils/permissionUtils';
import '../../styles/unified-design-tokens.css';
import './AdminNotificationsPage.css';

const TAB_SYSTEM = 'system';
const TAB_MESSAGES = 'messages';

const AdminNotificationsPage = () => {
  const [activeTab, setActiveTab] = useState(TAB_SYSTEM);
  const [userPermissions, setUserPermissions] = useState([]);

  const hasNotifyPermission = userPermissions.includes('SYSTEM_NOTIFICATION_MANAGE');

  useEffect(() => {
    fetchUserPermissions(setUserPermissions).catch(() => {});
  }, []);

  const subtitle = '시스템 공지와 메시지를 한 화면에서 관리합니다.';

  const headerActions =
    activeTab === TAB_SYSTEM && hasNotifyPermission ? (
      <button
        type="button"
        className="mg-v2-button mg-v2-button--primary"
        aria-label="공지 작성"
        onClick={() => globalThis.dispatchEvent(new CustomEvent('admin-notifications-create-notice'))}
      >
        공지 작성
      </button>
    ) : null;

  return (
    <AdminCommonLayout title="알림·메시지 관리">
      <div className="mg-v2-dashboard-layout">
        <ContentHeader
          title="알림·메시지 관리"
          subtitle={subtitle}
          actions={headerActions}
        />

        <nav
          className="mg-v2-ad-b0kla__tabs"
          role="tablist"
          aria-label="알림·메시지 관리 탭"
        >
          <button
            type="button"
            role="tab"
            id="admin-tab-system"
            aria-selected={activeTab === TAB_SYSTEM}
            aria-controls="admin-panel-system"
            className={`mg-v2-ad-b0kla__tab ${
              activeTab === TAB_SYSTEM ? 'mg-v2-ad-b0kla__tab--active' : ''
            }`}
            onClick={() => setActiveTab(TAB_SYSTEM)}
          >
            시스템 공지
          </button>
          <button
            type="button"
            role="tab"
            id="admin-tab-messages"
            aria-selected={activeTab === TAB_MESSAGES}
            aria-controls="admin-panel-messages"
            className={`mg-v2-ad-b0kla__tab ${
              activeTab === TAB_MESSAGES ? 'mg-v2-ad-b0kla__tab--active' : ''
            }`}
            onClick={() => setActiveTab(TAB_MESSAGES)}
          >
            메시지
          </button>
        </nav>

        <section
          id="admin-panel-system"
          role="tabpanel"
          aria-labelledby="admin-tab-system"
          className="mg-v2-ad-b0kla__section"
          aria-label="시스템 공지 목록"
          hidden={activeTab !== TAB_SYSTEM}
        >
          <SystemNotificationManagement contentOnly />
        </section>

        <section
          id="admin-panel-messages"
          role="tabpanel"
          aria-labelledby="admin-tab-messages"
          className="mg-v2-ad-b0kla__section"
          aria-label="메시지 목록"
          hidden={activeTab !== TAB_MESSAGES}
        >
          <AdminMessages contentOnly />
        </section>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminNotificationsPage;
