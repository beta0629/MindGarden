/**
 * 공통 알림 시스템
 * Toast 알림을 위한 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

class NotificationManager {
    constructor() {
        this.listeners = [];
        this.notificationId = 0;
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
    show(message, type = 'success', duration = 3000) {
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
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    /**
     * 오류 알림
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * 경고 알림
     */
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * 정보 알림
     */
    info(message, duration = 3000) {
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
}

// 싱글톤 인스턴스
const notificationManager = new NotificationManager();

export default notificationManager;
