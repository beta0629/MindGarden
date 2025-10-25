import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import MessageCard from '../common/MessageCard';

/**
 * 시스템 알림 섹션
 * 읽지 않은 메시지를 표시하는 대시보드 컴포넌트
 */
const SystemNotificationSection = () => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markMessageAsRead } = useNotification();

  // 메시지 페이지로 이동
  const handleViewAll = () => {
    navigate('/consultant/messages');
  };

  const handleMessageClick = async (message) => {
    // 메시지 읽음 처리
    if (!message.isRead) {
      await markMessageAsRead(message.id);
    }
    // 메시지 페이지로 이동
    navigate('/consultant/messages');
  };

  // 최대 5개만 표시
  const displayNotifications = notifications.slice(0, 5);

  return (
    <div className="mg-card">
      <div className="mg-card-header">
        <div className="mg-flex mg-justify-between mg-align-center">
          <h3 className="mg-h4 mg-mb-0 mg-flex mg-align-center mg-gap-sm">
            <Mail size={20} />
            시스템 알림
            {unreadCount > 0 && (
              <span className="mg-badge mg-badge-danger">{unreadCount}</span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              className="mg-button mg-button-ghost mg-button-small"
              onClick={handleViewAll}
            >
              {unreadCount > 5 ? `전체 보기 (+${unreadCount - 5})` : '전체 보기'}
            </button>
          )}
        </div>
      </div>

      <div className="mg-card-body">
        {loading ? (
          <div className="mg-loading-container">
            <div className="mg-spinner"></div>
            <p>알림을 불러오는 중...</p>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="mg-empty-state">
            <div className="mg-empty-state__icon">📭</div>
            <p className="mg-empty-state__text">읽지 않은 메시지가 없습니다.</p>
          </div>
        ) : (
          <div className="mg-space-y-sm">
            {displayNotifications.map((notification) => (
              <MessageCard
                key={notification.id}
                message={notification}
                onClick={handleMessageClick}
                compact={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemNotificationSection;

