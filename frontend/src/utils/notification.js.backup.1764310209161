/**
 * 공통 알림 시스템
 * Toast 알림을 위한 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

import { apiGet } from './ajax';
import { cachedApiCall, CACHE_CONFIG } from './apiCache';

class NotificationManager {
    constructor() {
        this.listeners = [];
        this.notificationId = 0;
        this.notificationTypes = [];
        this.loadNotificationTypes();
    }

    /**
     * 알림 유형 코드 로드 (캐시 적용)
     */
    async loadNotificationTypes() {
        try {
            const response = await cachedApiCall(
                '/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE',
                {},
                CACHE_CONFIG.COMMON_CODES.ttl
            );
            // ApiResponse 래퍼 처리: response.data.codes 또는 response.codes
            let codes = [];
            if (response && response.data && response.data.codes) {
                codes = response.data.codes;
            } else if (response && response.codes) {
                codes = response.codes;
            } else if (Array.isArray(response)) {
                codes = response;
            }
            
            if (codes && codes.length > 0) {
                this.notificationTypes = codes.map(code => ({
                    code: code.codeValue,
                    name: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.codeDescription
                }));
            }
        } catch (error) {
            console.error('알림 유형 코드 로드 실패:', error);
            // 실패 시 기본값 설정 (통일된 색상 체계)
            this.notificationTypes = [
                { code: 'SUCCESS', name: '성공', icon: '✅', color: '#10B981', description: '성공 알림' },     // 녹색
                { code: 'ERROR', name: '오류', icon: '❌', color: '#EF4444', description: '오류 알림' },       // 빨강
                { code: 'WARNING', name: '경고', icon: '⚠️', color: '#F59E0B', description: '경고 알림' },     // 주황
                { code: 'INFO', name: '정보', icon: 'ℹ️', color: '#3B82F6', description: '정보 알림' }        // 파랑
            ];
        }
    }

    /**
     * 알림 리스너 등록
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    /**
     * 알림 표시
     */
    show(message, type = 'success', duration = 1000) { // 기본 duration을 3초에서 1초로 단축
        console.log('notificationManager.show 호출됨:', { message, type, duration });
        console.log('현재 리스너 수:', this.listeners.length);
        
        const notification = {
            id: ++this.notificationId,
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.listeners.forEach((listener, index) => {
            try {
                console.log(`리스너 ${index} 호출 중:`, notification);
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
    success(message, duration = 1000) { // 기본 duration을 3초에서 1초로 단축
        return this.show(message, 'success', duration);
    }

    /**
     * 오류 알림
     */
    error(message, duration = 2000) { // 기본 duration을 5초에서 2초로 단축
        return this.show(message, 'error', duration);
    }

    /**
     * 경고 알림
     */
    warning(message, duration = 1500) { // 기본 duration을 4초에서 1.5초로 단축
        return this.show(message, 'warning', duration);
    }

    /**
     * 정보 알림
     */
    info(message, duration = 1000) { // 기본 duration을 3초에서 1초로 단축
        return this.show(message, 'info', duration);
    }

    /**
     * API 오류 처리
     */
    handleApiError(error, defaultMessage = '오류가 발생했습니다.') {
        let message = defaultMessage;
        
        if (error.response) {
            // 서버 응답이 있는 경우
            const { data } = error.response;
            if (data && data.message) {
                message = data.message;
            } else if (data && data.error) {
                message = data.error;
            }
        } else if (error.message) {
            // 네트워크 오류 등
            message = error.message;
        }

        this.error(message);
        return message;
    }

    /**
     * API 성공 처리
     */
    handleApiSuccess(response, defaultMessage = '성공했습니다.') {
        let message = defaultMessage;
        
        if (response && response.message) {
            message = response.message;
        }

        this.success(message);
        return message;
    }

    /**
     * 확인 다이얼로그 (Promise 기반)
     * @param {string} message - 확인 메시지
     * @param {function} callback - 콜백 함수 (true/false 전달)
     */
    confirm(message, callback) {
        const result = window.confirm(message);
        if (callback) {
            callback(result);
        }
        return result;
    }

    /**
     * 알림 다이얼로그
     * @param {string} message - 알림 메시지
     * @param {function} callback - 콜백 함수
     */
    alert(message, callback) {
        window.alert(message);
        if (callback) {
            callback();
        }
    }
}

// 싱글톤 인스턴스
const notificationManager = new NotificationManager();

// 편의 함수들
export const showNotification = (message, type = 'success', duration = 3000) => {
    return notificationManager.show(message, type, duration);
};

export const showSuccess = (message, duration = 3000) => {
    return notificationManager.success(message, duration);
};

export const showError = (message, duration = 5000) => {
    return notificationManager.error(message, duration);
};

export const showWarning = (message, duration = 4000) => {
    return notificationManager.warning(message, duration);
};

export const showInfo = (message, duration = 3000) => {
    return notificationManager.info(message, duration);
};

export default notificationManager;
