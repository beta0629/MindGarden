/**
 * Notification Widget
 * 알림 목록을 표시하는 범용 위젯
 * SystemNotificationSection을 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const NotificationWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const maxItems = config.maxItems || 5;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url) {
      loadNotifications();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadNotifications, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.notifications && Array.isArray(config.notifications)) {
      setNotifications(config.notifications);
      setUnreadCount(config.notifications.filter(n => !n.isRead).length);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // 실제 API 엔드포인트: /api/system-notifications/active
      const url = dataSource.url || '/api/system-notifications/active';
      const params = { ...dataSource.params };
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        // SystemNotificationController 응답 형식: { data: [...] }
        const notificationList = response.data || [];
        setNotifications(Array.isArray(notificationList) ? notificationList.slice(0, maxItems) : []);
        setUnreadCount(notificationList.filter(n => !n.isRead).length);
      } else if (response) {
        // 다른 응답 형식 지원
        const notificationList = response.notifications || response.data || response || [];
        setNotifications(Array.isArray(notificationList) ? notificationList.slice(0, maxItems) : []);
        setUnreadCount(notificationList.filter(n => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('NotificationWidget 데이터 로드 실패:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationClick = async (notification) => {
    // 읽음 처리
    if (!notification.isRead && notification.id) {
      try {
        // 실제 API 엔드포인트: /api/system-notifications/{notificationId}/read
        await apiGet(`/api/system-notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('알림 읽음 처리 실패:', err);
      }
    }
    
    // 알림 페이지로 이동
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/notifications');
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/notifications');
    }
  };
  
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };
  
  if (loading && notifications.length === 0) {
    return (
      <div className="widget widget-notification">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  const displayNotifications = notifications.slice(0, maxItems);
  
  return (
    <div className="widget widget-notification">
      <div className="widget-header">
        <div className="widget-title">
          <i className="bi bi-bell"></i>
          {config.title || '알림'}
          {unreadCount > 0 && (
            <span className="widget-badge widget-badge-danger">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="widget-view-all" onClick={handleViewAll}>
            {unreadCount > maxItems ? `전체 보기 (+${unreadCount - maxItems})` : '전체 보기'}
          </button>
        )}
      </div>
      <div className="widget-body">
        {displayNotifications.length > 0 ? (
          <div className="notification-list">
            {displayNotifications.map((notification, index) => (
              <div
                key={notification.id || index}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {notification.type === 'system' ? '📢' : '📨'}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-preview">{notification.message || notification.content}</div>
                  <div className="notification-time">{formatTime(notification.createdAt || notification.publishedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <div className="widget-empty-icon">📭</div>
            <div className="widget-empty-text">{config.emptyMessage || '읽지 않은 알림이 없습니다'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationWidget;

