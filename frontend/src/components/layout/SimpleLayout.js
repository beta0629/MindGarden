import React from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '../common/UnifiedHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import NotificationBadge from '../dashboard-v2/atoms/NotificationBadge';
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
/**
 * 복잡한 로직 없이 기본적인 레이아웃만 제공
/**
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

  // Header notification — MGButton: text + badge only (no lucide/svg)
  const notificationAction = user && (
    <div className="notification-wrapper">
      <MGButton
        className={buildErpMgButtonClassName({
          variant: 'outline',
          size: 'md',
          loading: false,
          className: 'notification-button'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={handleNotificationClick}
        aria-label="알림"
        variant="outline"
        preventDoubleClick={false}
      >
        <span className="notification-button__label">{'\uC54C\uB9BC'}</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            <NotificationBadge count={unreadCount} />
          </span>
        )}
      </MGButton>
    </div>
  );

  return (
    <div className="simple-layout">
      <UnifiedHeader 
        title={title} // 빈 값이면 브랜딩 정보에서 자동으로 가져옴
        showUserMenu={true}
        showHamburger={true}
        variant="default"
        sticky={true}
        extraActions={extraActions}
        notificationAction={notificationAction}
        useBrandingInfo={true} // 브랜딩 정보 사용 활성화
      />
      
      <main className="simple-main">
        <div className="simple-container">
          {title && (
            <header className="page-header">
              <h1 className="page-title">{title}</h1>
            </header>
          )}
          
          {loading ? (
            <div className="loading-container" role="status" aria-live="polite">
              <UnifiedLoading type="inline" text={loadingText} />
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
