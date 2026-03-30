// import React from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';
import { Bell, Mail } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * 시스템 알림 섹션
/**
 * 읽지 않은 메시지와 시스템 공지를 함께 표시하는 대시보드 컴포넌트
 */
const SystemNotificationSection = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    systemNotifications, 
    loading, 
    unreadCount, 
    unreadSystemCount, 
    markMessageAsRead,
    markSystemNotificationAsRead 
  } = useNotification();

  // 메시지 + 시스템 공지를 합친 읽지 않은 총 개수
  const totalUnreadCount = (unreadCount || 0) + (unreadSystemCount || 0);

  // 읽지 않은 메시지와 공지 통합
  const unreadMessages = (notifications || []).filter(msg => !msg.isRead);
  const unreadSystemNotices = (systemNotifications || []).filter(notice => !notice.isRead);
  
  // 최대 5개만 표시
  const displayItems = [...unreadMessages, ...unreadSystemNotices]
    .sort((a, b) => new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt))
    .slice(0, 5);

  // 전체 보기로 이동
  const handleViewAll = () => {
    navigate('/consultant/messages');
  };

  // 아이템 클릭 핸들러
  const handleItemClick = async (item) => {
    // 시스템 공지인 경우
    if (item.systemNotificationId || item.id?.toString().startsWith('system-')) {
      const notificationId = item.systemNotificationId || item.id.toString().replace('system-', '');
      if (!item.isRead) {
        await markSystemNotificationAsRead(notificationId);
      }
    } 
    // 일반 메시지인 경우
    else if (item.id) {
      if (!item.isRead) {
        await markMessageAsRead(item.id);
      }
    }
    
    // 메시지 페이지로 이동
    navigate('/consultant/messages');
  };

  return (
    <div className="mg-v2-card">
      <div className="mg-v2-card-header">
        <div className="mg-flex mg-justify-between mg-align-center">
          <div className="mg-v2-card-title">
            <Bell size={20} />
            시스템 알림
            {totalUnreadCount > 0 && (
              <span className="mg-v2-badge mg-v2-badge-danger">{totalUnreadCount}</span>
            )}
          </div>
          {totalUnreadCount > 0 && (
            <button
              className="mg-v2-button mg-v2-button--ghost mg-v2-button--sm"
              onClick={handleViewAll}
            >
              {totalUnreadCount > 5 ? `전체 보기 (+${totalUnreadCount - 5})` : '전체 보기'}
            </button>
          )}
        </div>
      </div>

      <div className="mg-v2-card-body">
        {loading ? (
          <div className="mg-loading">로딩중...</div>
        ) : displayItems.length === 0 ? (
          <div className="mg-v2-empty-state">
            <div className="mg-v2-empty-state-icon">📭</div>
            <div className="mg-v2-empty-state-text">읽지 않은 알림이 없습니다.</div>
          </div>
        ) : (
          <div className="mg-v2-space-y-sm">
            {displayItems.map((item, index) => (
              <div
                key={item.id || index}
                className="mg-v2-message-card"
                onClick={() => handleItemClick(item)}
              >
                <div className="mg-v2-message-card-header">
                  <div className="mg-v2-message-card-icon">
                    {item.systemNotificationId || item.id?.toString().startsWith('system-') ? '📢' : '📨'}
                  </div>
                  <div className="mg-v2-message-card-content">
                    <div className="mg-v2-message-card-title">{item.title}</div>
                    {item.isImportant && (
                      <span className="mg-v2-badge mg-v2-badge-warning mg-ml-xs">중요</span>
                    )}
                    {item.isUrgent && (
                      <span className="mg-v2-badge mg-v2-badge-danger mg-ml-xs">긴급</span>
                    )}
                  </div>
                  {!item.isRead && (
                    <div className="mg-v2-message-card-unread-indicator" />
                  )}
                </div>
                <div className="mg-v2-message-card-preview">
                  {typeof item.content === 'string' 
                    ? item.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
                    : item.content}
                </div>
                <div className="mg-v2-message-card-footer">
                  {item.authorName || item.senderName || '시스템'}
                  {item.displayDate && (
                    <span className="mg-v2-text-xs mg-v2-color-text-secondary">
                      {new Date(item.displayDate).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemNotificationSection;

