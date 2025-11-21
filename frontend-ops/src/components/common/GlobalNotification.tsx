"use client";

import { useEffect, useState } from "react";
import notificationManager, { Notification } from "@/utils/notification";
import "./GlobalNotification.css";

/**
 * 전역 알림 컴포넌트
 * 모든 페이지에서 API 오류 및 알림을 표시합니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
export function GlobalNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.addListener((notification) => {
      setNotifications(prev => [...prev, notification]);

      // 자동 제거
      if (notification.duration > 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="global-notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`global-notification global-notification--${notification.type}`}
          role="alert"
        >
          <div className="global-notification__icon">
            {getIcon(notification.type)}
          </div>
          <div className="global-notification__message">
            {notification.message}
          </div>
          <button
            className="global-notification__close"
            onClick={() => removeNotification(notification.id)}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return 'ℹ';
  }
}

