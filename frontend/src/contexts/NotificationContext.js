import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from './SessionContext';
import { apiGet } from '../utils/ajax';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isLoggedIn } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // 읽지 않은 메시지 개수 로드
  const loadUnreadCount = async () => {
    if (!isLoggedIn || !user?.id) return;

    try {
      const userType = user.role === 'ROLE_CONSULTANT' ? 'CONSULTANT' : 'CLIENT';
      // 캐싱 방지를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();
      const endpoint = `/api/consultation-messages/unread-count?userId=${user.id}&userType=${userType}&_t=${timestamp}`;

      const response = await apiGet(endpoint);
      
      if (response.success) {
        console.log('📊 읽지 않은 메시지 개수 업데이트:', response.unreadCount);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('알림 개수 로드 오류:', error);
    }
  };

  // 알림 목록 로드
  const loadNotifications = async () => {
    if (!isLoggedIn || !user?.id) return;

    try {
      setLoading(true);
      const endpoint = user.role === 'ROLE_CONSULTANT'
        ? `/api/consultation-messages/consultant/${user.id}`
        : `/api/consultation-messages/client/${user.id}`;

      const response = await apiGet(endpoint);
      
      if (response.success) {
        const unreadMessages = (response.data || [])
          .filter(msg => !msg.isRead)
          .slice(0, 5); // 최근 5개만
        
        setNotifications(unreadMessages);
      }
    } catch (error) {
      console.error('알림 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 개수 감소
  const decrementUnreadCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // 메시지 읽음 처리
  const markMessageAsRead = async (messageId) => {
    try {
      console.log('📨 메시지 읽음 처리 시작:', messageId);
      const response = await apiGet(`/api/consultation-messages/${messageId}/read`);
      
      if (response.success) {
        console.log('✅ 메시지 읽음 처리 성공:', messageId);
        // 로컬 상태 업데이트
        setNotifications(prev => prev.filter(n => n.id !== messageId));
        // 서버에서 최신 카운트 다시 로드
        await loadUnreadCount();
      } else {
        console.error('❌ 메시지 읽음 처리 실패:', response.message);
      }
    } catch (error) {
      console.error('❌ 메시지 읽음 처리 오류:', error);
    }
  };

  // 알림 새로고침
  const refreshNotifications = () => {
    loadUnreadCount();
    loadNotifications();
  };

  // 사용자 로그인 시 알림 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadUnreadCount();
      loadNotifications();

      // 30초마다 자동 갱신
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user?.id]);

  const value = {
    unreadCount,
    notifications,
    loading,
    loadUnreadCount,
    loadNotifications,
    decrementUnreadCount,
    markMessageAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

