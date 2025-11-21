/**
 * 공통 알림 시스템
 * Toast 알림을 위한 유틸리티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration: number;
  timestamp: number;
}

type NotificationListener = (notification: Notification) => void;

class NotificationManager {
  private listeners: NotificationListener[] = [];
  private notificationId = 0;

  /**
   * 알림 리스너 등록
   */
  addListener(callback: NotificationListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * 알림 표시
   */
  show(message: string, type: NotificationType = 'success', duration: number = 3000): number {
    const notification: Notification = {
      id: ++this.notificationId,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('알림 리스너 오류:', error);
      }
    });

    return notification.id;
  }

  /**
   * 성공 알림
   */
  success(message: string, duration: number = 3000): number {
    return this.show(message, 'success', duration);
  }

  /**
   * 오류 알림
   */
  error(message: string, duration: number = 5000): number {
    return this.show(message, 'error', duration);
  }

  /**
   * 경고 알림
   */
  warning(message: string, duration: number = 4000): number {
    return this.show(message, 'warning', duration);
  }

  /**
   * 정보 알림
   */
  info(message: string, duration: number = 3000): number {
    return this.show(message, 'info', duration);
  }
}

// 싱글톤 인스턴스
const notificationManager = new NotificationManager();

export default notificationManager;
export type { Notification, NotificationType, NotificationListener };

