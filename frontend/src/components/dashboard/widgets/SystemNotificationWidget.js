import React from 'react';
import { useNavigate } from 'react-router-dom';

import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import { useNotification } from '../../../contexts/NotificationContext';
import Badge from '../../common/Badge';
import BaseWidget from './BaseWidget';
import MGButton from '../../common/MGButton';
import './SystemNotificationWidget.css';
const SystemNotificationWidget = ({ widget, user }) => {
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
  
  // 최대 5개만 표시, 날짜순 정렬
  const displayItems = [...unreadMessages, ...unreadSystemNotices]
    .sort((a, b) => new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt))
    .slice(0, 5);

  // 전체 보기로 이동
  const handleViewAll = () => {
    navigate('/consultant/messages');
  };

  // 아이템 클릭 핸들러
  const handleItemClick = async(item) => {
    try {
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
    } catch (error) {
      console.error('읽음 처리 중 오류:', error);
      // 오류가 발생해도 페이지 이동은 진행
      navigate('/consultant/messages');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  // 콘텐츠 텍스트 정리
  const cleanContent = (content) => {
    if (typeof content === 'string') {
      return `${content.replace(/<[^>]*>/g, '').substring(0, 50)}...`;
    }
    return content || '';
  };

  // 위젯 헤더 설정
  const headerConfig = {
    title: (
      <div className="system-notification-header-title">
        
        시스템 알림
        {totalUnreadCount > 0 && (
          <Badge variant="count" count={totalUnreadCount} size="sm" className="system-notification-header-title__count" />
        )}
      </div>
    ),
    actions: totalUnreadCount > 0 && (
      <MGButton
        className="system-notification-view-all-btn"
        variant="outline"
        type="button"
        onClick={handleViewAll}
      >
        {totalUnreadCount > 5 ? `전체 보기 (+${totalUnreadCount - 5})` : '전체 보기'}
      </MGButton>
    )
  };

  // 위젯 콘텐츠
  const renderContent = () => {
    // 빈 상태 (알림 없음)
    if (displayItems.length === 0) {
      return (
        <div className="system-notification-empty">
          <div className="system-notification-empty-icon">📭</div>
          <div className="system-notification-empty-text">
            읽지 않은 알림이 없습니다.
          </div>
        </div>
      );
    }

    return (
      <div className="system-notification-list">
        {displayItems.map((item, index) => (
          <div
            key={item.id || index}
            className="system-notification-item"
            onClick={() => handleItemClick(item)}
          >
            <div className="system-notification-item-header">
              <div className="system-notification-item-icon">
                {item.systemNotificationId || item.id?.toString().startsWith('system-') ? '📢' : '📨'}
              </div>
              <div className="system-notification-item-content">
                <div className="system-notification-item-title">
                  {item.title}
                </div>
                <div className="system-notification-item-badges">
                  {item.isImportant && (
                    <Badge variant="status" statusVariant="warning" label="중요" size="sm" />
                  )}
                  {item.isUrgent && (
                    <Badge variant="status" statusVariant="danger" label="긴급" size="sm" />
                  )}
                </div>
              </div>
              {!item.isRead && (
                <div className="system-notification-item-unread-dot" />
              )}
            </div>
            <div className="system-notification-item-preview">
              {cleanContent(item.content)}
            </div>
            <div className="system-notification-item-footer">
              <span className="system-notification-item-author">
                {item.authorName || item.senderName || '시스템'}
              </span>
              {item.displayDate && (
                <span className="system-notification-item-date">
                  {formatDate(item.displayDate)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={null}
      hasData={displayItems.length > 0 || totalUnreadCount === 0}
      onRefresh={() => window.location.reload()} // NotificationContext 새로고침
      headerConfig={headerConfig}
      className="system-notification-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default SystemNotificationWidget;