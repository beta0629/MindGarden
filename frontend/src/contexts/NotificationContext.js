import React, { createContext, useContext, useState, useEffect } from 'react';
import { CONSTANTS } from '../constants/magicNumbers';
import { useSession } from './SessionContext';
import { apiGet } from '../utils/ajax';

const NotificationContext = createContext();

const PUBLIC_PATHS = [
  '/',
  '/landing',
  '/login',
  '/register',
  '/tablet/register',
  '/forgot-password',
  '/reset-password',
  '/filter-search',
  '/design-system',
  '/design-system-v2'
];

const PUBLIC_PREFIXES = [
  '/login/',
  '/register/',
  '/tablet/register/',
  '/auth/oauth2/'
];

const isPublicRoute = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const path = window.location.pathname || '';
  if (PUBLIC_PATHS.includes(path)) {
    return true;
  }
  return PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix));
};

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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadSystemCount, setUnreadSystemCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // isLoggedIn과 user를 ref로 저장 (클로저 문제 해결)
  const isLoggedInRef = React.useRef(isLoggedIn);
  const userRef = React.useRef(user);
  
  // ref 업데이트
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
    userRef.current = user;
  }, [isLoggedIn, user]);

  // 읽지 않은 메시지 개수 로드
  const loadUnreadMessageCount = async () => {
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      console.log('📨 메시지 개수 로드 스킵 - 로그인 정보 없음');
      setUnreadMessageCount(0);
      return;
    }

    try {
      // 역할에 따라 userType 결정
      let userType = 'CLIENT'; // 기본값
      if (user.role === 'CONSULTANT' || user.role === 'ROLE_CONSULTANT') {
        userType = 'CONSULTANT';
      } else if (user.role === 'CLIENT' || user.role === 'ROLE_CLIENT') {
        userType = 'CLIENT';
      } else if (user.role && (user.role.includes('ADMIN') || user.role.includes('SUPER'))) {
        // 관리자는 자신이 수신자인 메시지만 카운트
        userType = 'ADMIN';
      }
      
      // 캐싱 방지를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();
      const endpoint = `/api/v1/consultation-messages/unread-count?userId=${user.id}&userType=${userType}&_t=${timestamp}`;

      console.log('📨 메시지 개수 API 호출:', endpoint);
      const response = await apiGet(endpoint);
      
      if (response && response.success) {
        console.log('📊 읽지 않은 메시지 개수 업데이트:', response.unreadCount);
        setUnreadMessageCount(response.unreadCount || 0);
      } else {
        setUnreadMessageCount(0);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      if (error.status === CONSTANTS.HTTP_STATUS.UNAUTHORIZED || error.status === CONSTANTS.HTTP_STATUS.FORBIDDEN) {
        console.log('📨 메시지 개수 로드 실패 - 인증 필요');
      } else {
        console.error('📨 메시지 개수 로드 오류:', error);
      }
      setUnreadMessageCount(0);
    }
  };

  // 읽지 않은 시스템 공지 개수 로드
  const loadUnreadSystemCount = async () => {
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      console.log('📢 시스템 공지 개수 로드 스킵 - 로그인 정보 없음');
      setUnreadSystemCount(0);
      return;
    }

    try {
      const timestamp = new Date().getTime();
      const endpoint = `/api/v1/system-notifications/unread-count?_t=${timestamp}`;

      const response = await apiGet(endpoint);
      
      if (response && response.success) {
        console.log('📢 읽지 않은 공지 개수 업데이트:', response.unreadCount);
        setUnreadSystemCount(response.unreadCount || 0);
      } else {
        setUnreadSystemCount(0);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      if (error.status === CONSTANTS.HTTP_STATUS.UNAUTHORIZED || error.status === CONSTANTS.HTTP_STATUS.FORBIDDEN) {
        console.log('📢 시스템 공지 개수 로드 실패 - 인증 필요');
      } else {
        console.error('📢 공지 개수 로드 오류:', error);
      }
      setUnreadSystemCount(0);
    }
  };

  // 통합 읽지 않은 개수 로드
  const loadUnreadCount = async () => {
    // 로그인하지 않으면 스킵
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      console.log('📊 통합 읽지 않은 개수 로드 스킵 - 로그인 정보 없음');
      return;
    }
    await Promise.all([
      loadUnreadMessageCount(),
      loadUnreadSystemCount()
    ]);
  };

  // 메시지 목록 로드
  const loadNotifications = async () => {
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const endpoint = user.role === 'ROLE_CONSULTANT'
        ? `/api/v1/consultation-messages/consultant/${user.id}`
        : `/api/v1/consultation-messages/client/${user.id}`;

      const response = await apiGet(endpoint);
      
      if (response && response.success) {
        const unreadMessages = (response.data || [])
          .filter(msg => !msg.isRead)
          .slice(0, CONSTANTS.NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS); // 최근 MAX_NOTIFICATIONS개만
        
        setNotifications(unreadMessages);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      if (error.status !== CONSTANTS.HTTP_STATUS.UNAUTHORIZED && error.status !== CONSTANTS.HTTP_STATUS.FORBIDDEN) {
        console.error('메시지 목록 로드 오류:', error);
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 시스템 공지 목록 로드
  const loadSystemNotifications = async () => {
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      console.log('📢 시스템 공지 목록 로드 스킵 - 로그인 정보 없음');
      setSystemNotifications([]);
      return;
    }

    try {
      const endpoint = `/api/v1/system-notifications?page=0&size=${CONSTANTS.NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS}`;
      
      const response = await apiGet(endpoint);
      
      if (response && response.success) {
        console.log('📢 공지 목록 업데이트:', response.data?.length || 0, '개');
        setSystemNotifications(response.data || []);
      } else {
        setSystemNotifications([]);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      if (error.status === CONSTANTS.HTTP_STATUS.UNAUTHORIZED || error.status === CONSTANTS.HTTP_STATUS.FORBIDDEN) {
        console.log('📢 시스템 공지 목록 로드 실패 - 인증 필요');
      } else {
        console.error('📢 공지 목록 로드 오류:', error);
      }
      setSystemNotifications([]);
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
      const response = await apiGet(`/api/v1/consultation-messages/${messageId}/read`);
      
      if (response.success) {
        console.log('✅ 메시지 읽음 처리 성공:', messageId);
        // 로컬 상태 업데이트
        setNotifications(prev => prev.filter(n => n.id !== messageId));
        // 서버에서 최신 카운트 다시 로드
        await loadUnreadMessageCount();
      } else {
        console.error('❌ 메시지 읽음 처리 실패:', response.message);
      }
    } catch (error) {
      console.error('❌ 메시지 읽음 처리 오류:', error);
    }
  };

  // 시스템 공지 읽음 처리
  const markSystemNotificationAsRead = async (notificationId) => {
    try {
      console.log('📢 공지 읽음 처리 시작:', notificationId);
      const response = await apiGet(`/api/v1/system-notifications/${notificationId}/read`);
      
      if (response.success) {
        console.log('✅ 공지 읽음 처리 성공:', notificationId);
        // 로컬 상태 업데이트
        setSystemNotifications(prev => prev.filter(n => n.id !== notificationId));
        // 서버에서 최신 카운트 다시 로드
        await loadUnreadSystemCount();
      } else {
        console.error('❌ 공지 읽음 처리 실패:', response.message);
      }
    } catch (error) {
      console.error('❌ 공지 읽음 처리 오류:', error);
    }
  };

  // 알림 새로고침
  const refreshNotifications = () => {
    // 로그인하지 않으면 스킵
    if (!isLoggedIn || !user?.id || isPublicRoute()) {
      console.log('📨 알림 새로고침 스킵 - 로그인 정보 없음');
      return;
    }
    loadUnreadCount();
    loadNotifications();
    loadSystemNotifications();
  };

  // 사용자 로그인 시 알림 로드
  useEffect(() => {
    // 로그인 상태가 없으면 아무것도 하지 않음
    if (!isLoggedIn || !user?.id) {
      console.log('📨 NotificationContext: 로그인하지 않음 - 알림 로드 스킵');
      // 알림 카운트 초기화
      setUnreadCount(0);
      setUnreadMessageCount(0);
      setUnreadSystemCount(0);
      setNotifications([]);
      setSystemNotifications([]);
      return;
    }

    if (isPublicRoute()) {
      console.log('📨 NotificationContext: 공개 페이지 - 알림 로드 스킵');
      setUnreadCount(0);
      setUnreadMessageCount(0);
      setUnreadSystemCount(0);
      setNotifications([]);
      setSystemNotifications([]);
      return;
    }

    console.log('📨 NotificationContext: 알림 로드 시작 - 사용자 ID:', user.id);
    loadUnreadCount();
    loadNotifications();
    loadSystemNotifications();

    // CONSTANTS.BUSINESS_CONSTANTS.DEFAULT_CONSULTATION_DURATION초마다 자동 갱신 (로그인 상태에서만)
    const interval = setInterval(() => {
      // 재확인: 로그인 상태가 유지되는지 확인 (ref 사용)
      if (isLoggedInRef.current && userRef.current?.id) {
        console.log('⏰ 주기적 알림 갱신 - loadUnreadCount 호출');
        loadUnreadCount();
      }
    }, CONSTANTS.TIME_CONSTANTS.POLLING_INTERVAL);

    // 커스텀 이벤트 리스너 등록 (메시지 읽음 처리 시 카운트 갱신)
    const handleMessageRead = () => {
      if (isLoggedInRef.current && userRef.current?.id) {
        console.log('📨 메시지 읽음 이벤트 감지 - 카운트 갱신');
        loadUnreadMessageCount();
      }
    };

    const handleNotificationRead = () => {
      if (isLoggedInRef.current && userRef.current?.id) {
        console.log('📢 공지 읽음 이벤트 감지 - 카운트 갱신');
        loadUnreadSystemCount();
      }
    };

    window.addEventListener('message-read', handleMessageRead);
    window.addEventListener('notification-read', handleNotificationRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message-read', handleMessageRead);
      window.removeEventListener('notification-read', handleNotificationRead);
    };
  }, [isLoggedIn, user?.id]); // isLoggedIn, user?.id 의존성 추가

  // 통합 unreadCount 계산
  useEffect(() => {
    const totalUnread = unreadMessageCount + unreadSystemCount;
    console.log('📊 통합 알림 개수 계산:', {
      unreadMessageCount,
      unreadSystemCount,
      totalUnread
    });
    setUnreadCount(totalUnread);
  }, [unreadMessageCount, unreadSystemCount]);

  const value = {
    unreadCount,
    unreadMessageCount,
    unreadSystemCount,
    notifications,
    systemNotifications,
    loading,
    loadUnreadCount,
    loadUnreadMessageCount,
    loadUnreadSystemCount,
    loadNotifications,
    loadSystemNotifications,
    decrementUnreadCount,
    markMessageAsRead,
    markSystemNotificationAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

