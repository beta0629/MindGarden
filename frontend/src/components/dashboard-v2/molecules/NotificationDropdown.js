/**
 * NotificationDropdown - 알림 센터 드롭다운 (Molecule)
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock } from 'lucide-react';
import { NavIcon, NotificationBadge } from '../atoms';
import StandardizedApi from '../../../utils/standardizedApi';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await StandardizedApi.get('/api/v1/alerts', { 
        page: 0, 
        size: 10 
      });
      
      const items = response?.content || response || [];
      setNotifications(items);
      
      const unread = items.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await StandardizedApi.put(`/api/v1/alerts/${notification.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    if (notification.linkUrl) {
      globalThis.location.href = notification.linkUrl;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await StandardizedApi.put('/api/v1/alerts/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    return Clock;
  };

  return (
    <div className="mg-v2-notification-dropdown" ref={dropdownRef}>
      <div style={{ position: 'relative' }}>
        <NavIcon
          icon={Bell}
          label="알림"
          onClick={() => setIsOpen(!isOpen)}
          className="mg-v2-notification-trigger"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        />
        <NotificationBadge count={unreadCount} />
      </div>

      {isOpen && (
        <>
          <button 
            className="mg-v2-dropdown-overlay" 
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="드롭다운 닫기"
          />
          <div className="mg-v2-dropdown-panel mg-v2-notification-dropdown__panel" role="menu">
            <div className="mg-v2-dropdown-panel__header">
              <span className="mg-v2-dropdown-panel__title">알림</span>
              {unreadCount > 0 && (
                <button
                  className="mg-v2-btn-text mg-v2-btn-sm"
                  onClick={handleMarkAllRead}
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="mg-v2-notification-list">
              {loading && (
                <div className="mg-v2-notification-empty">로딩 중...</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="mg-v2-notification-empty">새로운 알림이 없습니다</div>
              )}
              {!loading && notifications.length > 0 && (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const isUnread = !notification.isRead;
                  return (
                    <button
                      key={notification.id}
                      className={`mg-v2-notification-item ${isUnread ? 'mg-v2-notification-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                      type="button"
                    >
                      {isUnread && (
                        <span className="mg-v2-notification-item__unread-dot" />
                      )}
                      <div className="mg-v2-notification-item__icon">
                        <Icon size={16} />
                      </div>
                      <div className="mg-v2-notification-item__content">
                        <div className="mg-v2-notification-item__header">
                          <span className="mg-v2-notification-item__title">
                            {notification.title}
                          </span>
                          <span className="mg-v2-notification-item__time">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        {notification.message && (
                          <p className="mg-v2-notification-item__message">
                            {notification.message}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mg-v2-dropdown-panel__footer">
                <a href="/notifications" className="mg-v2-dropdown-panel__footer-link">
                  알림 전체 보기
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
