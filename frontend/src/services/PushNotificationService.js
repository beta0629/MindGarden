/**
 * PushNotificationService — FCM 토큰 관리 및 푸시 알림 프론트엔드 래퍼
 *
 * 기존 /mobile/src/services/NotificationService.js 구조를 참고하되,
 * 웹(PWA) 환경에 맞게 재구현. 테넌트 인식, 알림 클릭 라우팅,
 * 로컬 알림 히스토리 저장 기능 포함.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import StandardizedApi from '../utils/standardizedApi';

const FCM_TOKEN_KEY = 'mg_fcm_token';
const NOTIFICATION_HISTORY_KEY = 'mg_notification_history';
const NOTIFICATION_SETTINGS_KEY = 'mg_notification_settings';
const MAX_HISTORY_SIZE = 200;
const TOKEN_REGISTER_ENDPOINT = '/api/v1/mobile/push-token/register';
const TOKEN_UNREGISTER_ENDPOINT = '/api/v1/mobile/push-token/unregister';

class PushNotificationService {
  constructor() {
    this.fcmToken = null;
    this.messaging = null;
    this.listeners = [];
    this.isInitialized = false;
  }

  /**
   * Firebase Messaging 초기화
   * firebase가 글로벌에 로드되어 있어야 한다.
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[PushNotificationService] 브라우저가 알림을 지원하지 않습니다.');
        return false;
      }

      if (window.firebase && window.firebase.messaging) {
        this.messaging = window.firebase.messaging();
        this.isInitialized = true;
        return true;
      }

      console.warn('[PushNotificationService] Firebase Messaging이 로드되지 않았습니다.');
      return false;
    } catch (error) {
      console.error('[PushNotificationService] 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 알림 권한 요청
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    try {
      if (!('Notification' in window)) return false;

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[PushNotificationService] 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * FCM 토큰 획득 (캐시 우선)
   * @returns {Promise<string|null>}
   */
  async getToken() {
    try {
      const cached = localStorage.getItem(FCM_TOKEN_KEY);
      if (cached) {
        this.fcmToken = cached;
        return cached;
      }

      if (!this.messaging) {
        await this.initialize();
      }

      if (this.messaging) {
        const token = await this.messaging.getToken();
        if (token) {
          this.fcmToken = token;
          localStorage.setItem(FCM_TOKEN_KEY, token);
          return token;
        }
      }

      return null;
    } catch (error) {
      console.error('[PushNotificationService] 토큰 획득 실패:', error);
      return null;
    }
  }

  /**
   * FCM 토큰을 서버에 등록 (테넌트 인식)
   * @param {string} userId
   * @param {string} tenantId — StandardizedApi가 자동 주입하지만 명시적으로도 보낸다
   * @returns {Promise<boolean>}
   */
  async registerToken(userId, tenantId) {
    try {
      const token = this.fcmToken || await this.getToken();
      if (!token || !userId) {
        console.warn('[PushNotificationService] 토큰 또는 사용자 ID 없음');
        return false;
      }

      const deviceInfo = this.getDeviceInfo();

      await StandardizedApi.post(TOKEN_REGISTER_ENDPOINT, {
        userId,
        tenantId,
        token,
        platform: 'WEB',
        deviceInfo,
      });

      return true;
    } catch (error) {
      console.error('[PushNotificationService] 토큰 서버 등록 실패:', error);
      return false;
    }
  }

  /**
   * FCM 토큰 서버에서 제거
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async unregisterToken(userId) {
    try {
      const token = this.fcmToken;
      if (!token || !userId) return false;

      await StandardizedApi.post(TOKEN_UNREGISTER_ENDPOINT, {
        userId,
        token,
      });

      localStorage.removeItem(FCM_TOKEN_KEY);
      this.fcmToken = null;
      return true;
    } catch (error) {
      console.error('[PushNotificationService] 토큰 해제 실패:', error);
      return false;
    }
  }

  /**
   * 포그라운드 메시지 리스너 설정
   * @param {Function} callback — 메시지 수신 시 호출
   * @returns {Function|null} 해제 함수
   */
  setupForegroundListener(callback) {
    if (!this.messaging) return null;

    try {
      const unsubscribe = this.messaging.onMessage((payload) => {
        const notification = this.parsePayload(payload);
        this.saveToHistory(notification);

        if (callback) {
          callback(notification);
        }

        this.showBrowserNotification(notification);
      });

      this.listeners.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('[PushNotificationService] 포그라운드 리스너 설정 실패:', error);
      return null;
    }
  }

  /**
   * 알림 클릭 시 해당 화면으로 라우팅
   * @param {object} notification
   * @param {Function} navigate — react-router navigate 함수
   */
  handleNotificationClick(notification, navigate) {
    if (!notification || !navigate) return;

    const { type, data } = notification;
    const routeMap = {
      SCHEDULE: '/consultant/renewal/schedule',
      BOOKING: '/client/booking',
      PAYMENT: '/client/payment-history',
      MESSAGE: '/messages',
      WELLNESS: '/client/wellness-hub',
      SYSTEM: '/notifications',
    };

    const targetRoute = routeMap[type] || '/notifications';

    if (data?.targetRoute) {
      navigate(data.targetRoute);
    } else {
      navigate(targetRoute);
    }
  }

  /**
   * 로컬 알림 히스토리 저장
   * @param {object} notification
   */
  saveToHistory(notification) {
    try {
      const history = this.getHistory();
      history.unshift({
        ...notification,
        receivedAt: new Date().toISOString(),
        isRead: false,
      });

      if (history.length > MAX_HISTORY_SIZE) {
        history.length = MAX_HISTORY_SIZE;
      }

      localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('[PushNotificationService] 히스토리 저장 실패:', error);
    }
  }

  /**
   * 로컬 알림 히스토리 조회
   * @returns {Array}
   */
  getHistory() {
    try {
      const stored = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 히스토리에서 특정 알림 읽음 처리
   * @param {string} notifId
   */
  markHistoryAsRead(notifId) {
    try {
      const history = this.getHistory();
      const updated = history.map((n) =>
        n.id === notifId ? { ...n, isRead: true } : n
      );
      localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[PushNotificationService] 읽음 처리 실패:', error);
    }
  }

  /**
   * 알림 설정에 따라 표시 여부 확인
   * @param {string} type
   * @returns {boolean}
   */
  isNotificationEnabled(type) {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (!stored) return true;

      const settings = JSON.parse(stored);
      const typeMap = {
        SCHEDULE: 'schedule',
        BOOKING: 'schedule',
        PAYMENT: 'payment',
        MESSAGE: 'message',
        WELLNESS: 'wellness',
        SYSTEM: 'system',
      };

      const category = typeMap[type] || 'system';
      return settings[category]?.enabled !== false;
    } catch {
      return true;
    }
  }

  /**
   * 브라우저 네이티브 알림 표시
   * @param {object} notification
   */
  showBrowserNotification(notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!this.isNotificationEnabled(notification.type)) return;

    try {
      const n = new Notification(notification.title || '마인드가든', {
        body: notification.body || '',
        icon: '/favicon.ico',
        tag: notification.id || `mg-${Date.now()}`,
        data: notification,
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (error) {
      console.error('[PushNotificationService] 브라우저 알림 표시 실패:', error);
    }
  }

  /**
   * FCM payload 파싱
   * @param {object} payload
   * @returns {object}
   */
  parsePayload(payload) {
    const { notification = {}, data = {} } = payload || {};
    return {
      id: data.notificationId || `notif-${Date.now()}`,
      title: notification.title || data.title || '',
      body: notification.body || data.body || '',
      type: (data.type || data.notificationType || 'SYSTEM').toUpperCase(),
      data,
    };
  }

  /**
   * 디바이스 정보 수집
   * @returns {object}
   */
  getDeviceInfo() {
    const ua = navigator.userAgent || '';
    return {
      userAgent: ua,
      platform: navigator.platform || '',
      language: navigator.language || 'ko-KR',
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
    };
  }

  /**
   * 모든 리스너 정리
   */
  cleanup() {
    this.listeners.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    this.listeners = [];
  }
}

const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
