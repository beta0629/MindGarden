/**
 * 푸시 알림 서비스
 * Firebase Cloud Messaging을 사용한 푸시 알림 관리
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { getFirebaseConfig, getDeviceInfo } from '../config/environments';
import { STRINGS } from '../constants/strings';
import Toast from 'react-native-toast-message';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.notificationListeners = [];
  }

  /**
   * FCM 토큰 요청 및 저장
   */
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('푸시 알림 권한 승인됨');
        return true;
      } else {
        console.log('푸시 알림 권한 거부됨');
        return false;
      }
    } catch (error) {
      console.error('푸시 알림 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken() {
    try {
      // 기존 토큰 확인
      const existingToken = await AsyncStorage.getItem('fcm_token');

      if (existingToken) {
        this.fcmToken = existingToken;
        return existingToken;
      }

      // 새 토큰 생성
      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        this.fcmToken = fcmToken;
        await AsyncStorage.setItem('fcm_token', fcmToken);
        console.log('FCM 토큰 생성됨:', fcmToken);
        return fcmToken;
      }

      return null;
    } catch (error) {
      console.error('FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * FCM 토큰 서버에 등록
   */
  async registerTokenToServer(userId) {
    try {
      if (!this.fcmToken || !userId) {
        console.warn('FCM 토큰 또는 사용자 ID가 없습니다.');
        return false;
      }

      const response = await fetch('/api/mobile/push-token/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token: this.fcmToken,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('FCM 토큰 서버 등록 성공');
        return true;
      } else {
        console.error('FCM 토큰 서버 등록 실패');
        return false;
      }
    } catch (error) {
      console.error('FCM 토큰 서버 등록 중 오류:', error);
      return false;
    }
  }

  /**
   * FCM 토큰 서버에서 제거
   */
  async unregisterTokenFromServer(userId) {
    try {
      if (!this.fcmToken || !userId) {
        return false;
      }

      const response = await fetch('/api/mobile/push-token/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token: this.fcmToken,
        }),
      });

      if (response.ok) {
        console.log('FCM 토큰 서버 제거 성공');
        return true;
      } else {
        console.error('FCM 토큰 서버 제거 실패');
        return false;
      }
    } catch (error) {
      console.error('FCM 토큰 서버 제거 중 오류:', error);
      return false;
    }
  }

  /**
   * 포그라운드 메시지 리스너 설정
   */
  setupForegroundListener() {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('포그라운드 메시지 수신:', remoteMessage);

      // 로컬 알림 표시
      this.showLocalNotification(remoteMessage);
    });

    return unsubscribe;
  }

  /**
   * 백그라운드 메시지 리스너 설정
   */
  setupBackgroundListener() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('백그라운드 메시지 수신:', remoteMessage);

      // 백그라운드에서는 자동으로 알림이 표시되므로 추가 처리 불필요
      // 필요한 경우 데이터 저장 등의 작업 수행
    });
  }

  /**
   * 알림 클릭 리스너 설정
   */
  setupNotificationOpenedListener(navigation) {
    // 앱이 종료된 상태에서 알림 클릭
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('종료 상태에서 알림 클릭:', remoteMessage);
          this.handleNotificationClick(remoteMessage, navigation);
        }
      });

    // 앱이 백그라운드 상태에서 알림 클릭
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('백그라운드에서 알림 클릭:', remoteMessage);
      this.handleNotificationClick(remoteMessage, navigation);
    });

    return unsubscribe;
  }

  /**
   * 로컬 알림 표시
   */
  async showLocalNotification(remoteMessage) {
    const { title, body, data } = remoteMessage.notification || {};

    if (Platform.OS === 'ios') {
      // iOS에서는 Alert로 표시
      Alert.alert(
        title || STRINGS.NOTIFICATION.DEFAULT_TITLE,
        body || STRINGS.NOTIFICATION.DEFAULT_BODY,
        [
          {
            text: STRINGS.COMMON.CONFIRM,
            onPress: () => {
              // 알림 클릭 처리
              this.handleNotificationAction(data);
            },
          },
        ]
      );
    } else {
      // Android에서는 시스템 알림 사용
      // React Native Firebase에서 자동으로 표시되므로 추가 작업 불필요
    }

    // 알림 히스토리에 저장
    await this.saveNotificationToHistory(remoteMessage);
  }

  /**
   * 알림 클릭 처리
   */
  handleNotificationClick(remoteMessage, navigation) {
    const { data } = remoteMessage;

    if (!data) return;

    try {
      const notificationData = typeof data === 'string' ? JSON.parse(data) : data;

      switch (notificationData.type) {
        case 'MESSAGE':
          navigation.navigate('Messages');
          break;
        case 'SCHEDULE':
          navigation.navigate('Schedule');
          break;
        case 'PAYMENT':
          navigation.navigate('Payment');
          break;
        case 'SYSTEM':
          // 시스템 알림은 대시보드로 이동
          navigation.navigate('Dashboard');
          break;
        default:
          navigation.navigate('Dashboard');
      }
    } catch (error) {
      console.error('알림 데이터 파싱 오류:', error);
      navigation.navigate('Dashboard');
    }
  }

  /**
   * 알림 액션 처리
   */
  handleNotificationAction(data) {
    // 알림에 따른 액션 처리
    console.log('알림 액션:', data);
  }

  /**
   * 알림 히스토리에 저장
   */
  async saveNotificationToHistory(remoteMessage) {
    try {
      const history = await AsyncStorage.getItem('notification_history');
      const historyArray = history ? JSON.parse(history) : [];

      const notificationItem = {
        id: Date.now().toString(),
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        timestamp: new Date().toISOString(),
        read: false,
      };

      historyArray.unshift(notificationItem);

      // 최대 100개까지 저장
      if (historyArray.length > 100) {
        historyArray.splice(100);
      }

      await AsyncStorage.setItem('notification_history', JSON.stringify(historyArray));
    } catch (error) {
      console.error('알림 히스토리 저장 실패:', error);
    }
  }

  /**
   * 알림 히스토리 가져오기
   */
  async getNotificationHistory() {
    try {
      const history = await AsyncStorage.getItem('notification_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('알림 히스토리 가져오기 실패:', error);
      return [];
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(notificationId) {
    try {
      const history = await this.getNotificationHistory();
      const updatedHistory = history.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );

      await AsyncStorage.setItem('notification_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  }

  /**
   * 알림 설정 가져오기
   */
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      return settings ? JSON.parse(settings) : {
        messageNotifications: true,
        scheduleNotifications: true,
        paymentNotifications: true,
        systemNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
    } catch (error) {
      console.error('알림 설정 가져오기 실패:', error);
      return {
        messageNotifications: true,
        scheduleNotifications: true,
        paymentNotifications: true,
        systemNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
    }
  }

  /**
   * 알림 설정 저장
   */
  async saveNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
      console.log('알림 설정 저장됨:', settings);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
    }
  }

  /**
   * FCM 토큰 갱신 시 처리
   */
  setupTokenRefreshListener(userId) {
    const unsubscribe = messaging().onTokenRefresh(async (fcmToken) => {
      console.log('FCM 토큰 갱신됨:', fcmToken);

      this.fcmToken = fcmToken;
      await AsyncStorage.setItem('fcm_token', fcmToken);

      // 서버에 새 토큰 등록
      if (userId) {
        await this.registerTokenToServer(userId);
      }
    });

    return unsubscribe;
  }

  /**
   * 서비스 초기화
   */
  async initialize(userId, navigation) {
    try {
      // 권한 요청
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.warn('푸시 알림 권한이 없습니다.');
        return false;
      }

      // FCM 토큰 가져오기
      await this.getFCMToken();

      // 서버에 토큰 등록
      if (userId) {
        await this.registerTokenToServer(userId);
      }

      // 리스너 설정
      const foregroundUnsubscribe = this.setupForegroundListener();
      const backgroundUnsubscribe = this.setupBackgroundListener();
      const notificationOpenedUnsubscribe = this.setupNotificationOpenedListener(navigation);
      const tokenRefreshUnsubscribe = this.setupTokenRefreshListener(userId);

      // 리스너 저장
      this.notificationListeners = [
        foregroundUnsubscribe,
        backgroundUnsubscribe,
        notificationOpenedUnsubscribe,
        tokenRefreshUnsubscribe,
      ];

      console.log('푸시 알림 서비스 초기화 완료');
      return true;
    } catch (error) {
      console.error('푸시 알림 서비스 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 서비스 정리
   */
  async cleanup(userId) {
    try {
      // 서버에서 토큰 제거
      if (userId) {
        await this.unregisterTokenFromServer(userId);
      }

      // 리스너 정리
      this.notificationListeners.forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      this.notificationListeners = [];

      // 로컬 데이터 정리
      await AsyncStorage.removeItem('fcm_token');

      console.log('푸시 알림 서비스 정리 완료');
    } catch (error) {
      console.error('푸시 알림 서비스 정리 실패:', error);
    }
  }

  /**
   * 테스트 알림 전송 (개발용)
   */
  async sendTestNotification() {
    try {
      const testMessage = {
        notification: {
          title: '테스트 알림',
          body: '푸시 알림이 정상적으로 작동합니다.',
        },
        data: {
          type: 'SYSTEM',
        },
      };

      await messaging().sendMessage(testMessage);
      console.log('테스트 알림 전송됨');
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
    }
  }

  /**
   * 싱글톤 인스턴스
   */
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  static show(message, type = 'info', options = {}) {
    const defaultTitle = NotificationService.getTitle(type);
    Toast.show({
      type: type, // 'success' | 'error' | 'info' | 'warning'
      text1: options.title || defaultTitle,
      text2: message,
      position: options.position || 'top',
      visibilityTime: options.duration || 3000,
      ...options,
    });
  }

  static getTitle(type) {
    switch (type) {
      case 'success':
        return STRINGS.COMMON.SUCCESS;
      case 'error':
        return STRINGS.COMMON.ERROR;
      case 'info':
        return STRINGS.COMMON.INFO;
      case 'warning':
        return STRINGS.COMMON.WARNING;
      default:
        return STRINGS.COMMON.INFO;
    }
  }

  static success(message, options) {
    this.show(message, 'success', options);
  }

  static error(message, options) {
    this.show(message, 'error', options);
  }

  static info(message, options) {
    this.show(message, 'info', options);
  }

  static warning(message, options) {
    this.show(message, 'warning', options);
  }
}

// 싱글톤 내보내기 (기존)
// const notificationService = new NotificationService();
// export default notificationService;

// 클래스 자체를 내보내기로 변경
export default NotificationService;