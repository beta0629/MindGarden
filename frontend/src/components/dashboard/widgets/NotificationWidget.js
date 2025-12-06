/**
 * Notification Widget - 표준화된 위젯
/**
 * 알림 목록을 표시하는 범용 위젯
/**
 * SystemNotificationSection을 기반으로 범용화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-30
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { apiGet } from '../../../utils/ajax';
import './Widget.css';

const NotificationWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [localNotifications, setLocalNotifications] = useState([]);
  
  const config = widget.config || {};
  const maxItems = config.maxItems || 5;
  
  // 데이터 소스 설정 with transform
  const widgetWithDataSource = useMemo(() => ({
    ...widget,
    config: {
      ...config,
      dataSource: {
        ...config.dataSource,
        transform: (response) => {
          if (response && response.success) {
            const notificationList = response.data || [];
            return Array.isArray(notificationList) ? notificationList.slice(0, maxItems) : [];
          } else if (response) {
            const notificationList = response.notifications || response.data || response || [];
            return Array.isArray(notificationList) ? notificationList.slice(0, maxItems) : [];
          }
          return [];
        }
      }
    }
  }), [widget, config, maxItems]);
  
  // 표준화된 위젯 훅 사용
  const {
    data: notifications,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });
  
  // 로컬 상태 초기화
  useMemo(() => {
    if (notifications && Array.isArray(notifications)) {
      setLocalNotifications(notifications);
    }
  }, [notifications]);
  
  const displayNotifications = localNotifications.length > 0 ? localNotifications : (notifications || []);
  const unreadCount = displayNotifications.filter(n => !n.isRead).length;
  
  const handleNotificationClick = async (notification) => {
    // 읽음 처리
    if (!notification.isRead && notification.id) {
      try {
        // 실제 API 엔드포인트: /api/v1/system-notifications/{notificationId}/read
        await apiGet(`/api/v1/system-notifications/${notification.id}/read`);
        setLocalNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
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
  
  // 헤더 액션 설정
  const headerActions = unreadCount > 0 ? (
    <button className="widget-view-all" onClick={handleViewAll}>
      {unreadCount > maxItems ? `전체 보기 (+${unreadCount - maxItems})` : '전체 보기'}
    </button>
  ) : null;
  
  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
      headerActions={headerActions}
      className="notification-widget"
    >
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
    </BaseWidget>
  );
};

export default NotificationWidget;

