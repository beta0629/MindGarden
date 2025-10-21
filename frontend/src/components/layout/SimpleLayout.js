import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import UnifiedHeader from '../common/UnifiedHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNotification } from '../../contexts/NotificationContext';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/main.css';
import './SimpleLayout.css';

// 역할별 알림 페이지 경로 상수
const NOTIFICATION_ROUTES = {
  CONSULTANT: '/notifications',
  CLIENT: '/notifications',
  ADMIN: '/admin/messages',
  BRANCH_ADMIN: '/admin/messages',
  BRANCH_SUPER_ADMIN: '/admin/messages',
  HQ_ADMIN: '/admin/messages',
  SUPER_ADMIN: '/admin/messages'
};

/**
 * 간단한 레이아웃 컴포넌트
 * 복잡한 로직 없이 기본적인 레이아웃만 제공
 * 공통 로딩 상태 지원 + 알림 기능
 */
const SimpleLayout = ({ 
  children, 
  title, 
  loading = false, 
  loadingText = "페이지를 불러오는 중...",
  loadingVariant = "default",
  extraActions = null
}) => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { unreadCount } = useNotification();

  // 알림 아이콘 클릭 핸들러
  const handleNotificationClick = () => {
    if (!user?.role) return;
    
    const route = NOTIFICATION_ROUTES[user.role];
    if (route) {
      navigate(route);
    } else {
      console.warn(`알림 경로가 정의되지 않은 역할: ${user.role}`);
    }
  };

  // 알림 아이콘 컴포넌트
  const notificationAction = user && (
    <div className="notification-wrapper">
      <button 
        className="notification-button"
        onClick={handleNotificationClick}
        aria-label="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="simple-layout">
      <UnifiedHeader 
        title={title || 'MindGarden'}
        logoType="text"
        showUserMenu={true}
        showHamburger={true}
        variant="default"
        sticky={true}
        extraActions={extraActions}
        notificationAction={notificationAction}
      />
      
      <main className="simple-main">
        <div className="simple-container">
          {title && (
            <div className="page-header">
              <h1 className="page-title">{title}</h1>
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <UnifiedLoading 
                text={loadingText}
                size="large"
                variant={loadingVariant}
                type="page"
              />
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default SimpleLayout;
