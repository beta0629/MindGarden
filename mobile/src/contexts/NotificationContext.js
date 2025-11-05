/**
 * 알림 컨텍스트 (웹 버전과 동일한 구조)
 * 읽지 않은 메시지 및 시스템 공지 개수 관리
 * 
 * 웹의 frontend/src/contexts/NotificationContext.js를 참고
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from './SessionContext';
import { apiGet } from '../api/client';
import { MESSAGE_API } from '../api/endpoints';

const NotificationContext = createContext(null);

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
  
  // ref로 저장 (클로저 문제 해결)
  const isLoggedInRef = useRef(isLoggedIn);
  const userRef = useRef(user);
  
  // ref 업데이트
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
    userRef.current = user;
  }, [isLoggedIn, user]);

  // 읽지 않은 메시지 개수 로드
  const loadUnreadMessageCount = useCallback(async () => {
    if (!isLoggedInRef.current || !userRef.current?.id) {
      setUnreadMessageCount(0);
      return;
    }

    try {
      // 역할에 따라 userType 결정
      let userType = 'CLIENT';
      const role = userRef.current.role;
      if (role === 'CONSULTANT' || role === 'ROLE_CONSULTANT') {
        userType = 'CONSULTANT';
      } else if (role === 'CLIENT' || role === 'ROLE_CLIENT') {
        userType = 'CLIENT';
      } else if (role && (role.includes('ADMIN') || role.includes('SUPER'))) {
        userType = 'ADMIN';
      }
      
      const timestamp = new Date().getTime();
      const endpoint = `/api/consultation-messages/unread-count?userId=${userRef.current.id}&userType=${userType}&_t=${timestamp}`;

      const response = await apiGet(endpoint);
      
      if (response?.success) {
        setUnreadMessageCount(response.unreadCount || 0);
      } else {
        setUnreadMessageCount(0);
      }
    } catch (error) {
      // 인증 오류는 조용히 처리
      setUnreadMessageCount(0);
    }
  }, []);

  // 읽지 않은 시스템 공지 개수 로드
  const loadUnreadSystemCount = useCallback(async () => {
    if (!isLoggedInRef.current || !userRef.current?.id) {
      setUnreadSystemCount(0);
      return;
    }

    try {
      const timestamp = new Date().getTime();
      const endpoint = `/api/system-notifications/unread-count?_t=${timestamp}`;

      const response = await apiGet(endpoint);
      
      if (response?.success) {
        setUnreadSystemCount(response.unreadCount || 0);
      } else {
        setUnreadSystemCount(0);
      }
    } catch (error) {
      // 404 오류는 백엔드 엔드포인트가 구현되지 않았을 수 있으므로 조용히 처리
      // 다른 오류도 조용히 처리하여 앱 동작에 영향 없도록 함
      if (error?.response?.status === 404) {
        // 404는 조용히 처리 (엔드포인트가 없을 수 있음)
        setUnreadSystemCount(0);
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        // 인증 오류는 조용히 처리
        setUnreadSystemCount(0);
      } else {
        // 기타 오류는 경고만 출력 (앱 동작에는 영향 없음)
        console.warn('⚠️ 시스템 공지 개수 로드 실패 (기본값 0 사용):', error?.response?.status || error?.message);
        setUnreadSystemCount(0);
      }
    }
  }, []);

  // 통합 읽지 않은 개수 로드
  const loadUnreadCount = useCallback(async () => {
    if (!isLoggedInRef.current || !userRef.current?.id) {
      return;
    }
    await Promise.all([
      loadUnreadMessageCount(),
      loadUnreadSystemCount()
    ]);
  }, [loadUnreadMessageCount, loadUnreadSystemCount]);

  // 통합 unreadCount 계산
  useEffect(() => {
    const totalUnread = unreadMessageCount + unreadSystemCount;
    setUnreadCount(totalUnread);
  }, [unreadMessageCount, unreadSystemCount]);

  // 로그인 상태 변경 시 알림 카운트 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadUnreadCount();
      
      // 주기적으로 알림 카운트 갱신 (30초마다)
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setUnreadMessageCount(0);
      setUnreadSystemCount(0);
    }
  }, [isLoggedIn, user?.id, loadUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        unreadMessageCount,
        unreadSystemCount,
        loadUnreadCount,
        loadUnreadMessageCount,
        loadUnreadSystemCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

