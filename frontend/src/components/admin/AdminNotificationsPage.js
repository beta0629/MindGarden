/**
 * 알림·메시지 관리 통합 페이지
 * AdminCommonLayout + ContentHeader + 탭(시스템 공지 | 메시지) + 탭별 블록.
 * contentOnly 임베드 제거, SystemNotificationListBlock·AdminMessageListBlock 사용.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import SystemNotificationListBlock from './organisms/SystemNotificationListBlock';
import AdminMessageListBlock from './organisms/AdminMessageListBlock';
import { fetchUserPermissions, hasPermission } from '../../utils/permissionUtils';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminNotificationsPage.css';

const TAB_SYSTEM = 'system';
const TAB_MESSAGES = 'messages';

const AdminNotificationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === TAB_MESSAGES ? TAB_MESSAGES : TAB_SYSTEM
  );
  const [userPermissions, setUserPermissions] = useState([]);

  const hasNotifyPermission = hasPermission(userPermissions, 'SYSTEM_NOTIFICATION_MANAGE');

  useEffect(() => {
    fetchUserPermissions(setUserPermissions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = tabParam === TAB_MESSAGES ? TAB_MESSAGES : TAB_SYSTEM;
    setActiveTab(t);
  }, [tabParam]);

  const setTab = useCallback(
    (tab) => {
      setActiveTab(tab);
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setTab(TAB_SYSTEM);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setTab(TAB_MESSAGES);
    }
  };

  const subtitle = '공지 작성과 메시지 조회를 한 화면에서 관리합니다.';

  const headerActions =
    activeTab === TAB_SYSTEM && hasNotifyPermission ? (
      <MGButton
        variant="primary"
        aria-label="공지 작성"
        onClick={() => globalThis.dispatchEvent(new CustomEvent('admin-notifications-create-notice'))}
        preventDoubleClick={false}
      >
        공지 작성
      </MGButton>
    ) : null;

  return (
    <AdminCommonLayout title="알림·메시지 관리">
      <main
        className="mg-v2-dashboard-layout"
        aria-labelledby="admin-notifications-page-title"
      >
        <div className="mg-v2-ad-b0kla mg-v2-admin-notifications-page">
          <div className="mg-v2-ad-b0kla__container">
            <ContentArea ariaLabel="알림·메시지 관리 콘텐츠">
              <ContentHeader
                title="알림·메시지 관리"
                subtitle={subtitle}
                actions={headerActions}
                titleId="admin-notifications-page-title"
              />

              <div
                className="mg-v2-ad-b0kla__tabs"
                role="tablist"
                aria-label="알림·메시지 탭"
              >
                <MGButton
                  type="button"
                  variant="outline"
                  role="tab"
                  id="admin-tab-system"
                  aria-selected={activeTab === TAB_SYSTEM}
                  aria-controls="admin-panel-system"
                  className={`mg-v2-ad-b0kla__tab ${
                    activeTab === TAB_SYSTEM ? 'mg-v2-ad-b0kla__tab--active' : ''
                  }`}
                  onClick={() => setTab(TAB_SYSTEM)}
                  onKeyDown={handleTabKeyDown}
                  preventDoubleClick={false}
                >
                  시스템 공지
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  role="tab"
                  id="admin-tab-messages"
                  aria-selected={activeTab === TAB_MESSAGES}
                  aria-controls="admin-panel-messages"
                  className={`mg-v2-ad-b0kla__tab ${
                    activeTab === TAB_MESSAGES ? 'mg-v2-ad-b0kla__tab--active' : ''
                  }`}
                  onClick={() => setTab(TAB_MESSAGES)}
                  onKeyDown={handleTabKeyDown}
                  preventDoubleClick={false}
                >
                  메시지
                </MGButton>
              </div>

              <section
                id="admin-panel-system"
                role="tabpanel"
                aria-labelledby="admin-tab-system"
                className="mg-v2-ad-b0kla__section-wrapper"
                aria-label="시스템 공지 목록"
                hidden={activeTab !== TAB_SYSTEM}
              >
                <SystemNotificationListBlock
                  hasManagePermission={hasNotifyPermission}
                  onOpenCreate={hasNotifyPermission}
                />
              </section>

              <section
                id="admin-panel-messages"
                role="tabpanel"
                aria-labelledby="admin-tab-messages"
                className="mg-v2-ad-b0kla__section-wrapper"
                aria-label="메시지 목록"
                hidden={activeTab !== TAB_MESSAGES}
              >
                <AdminMessageListBlock />
              </section>
            </ContentArea>
          </div>
        </div>
      </main>
    </AdminCommonLayout>
  );
};

export default AdminNotificationsPage;
