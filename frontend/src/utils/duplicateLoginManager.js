/**
 * 중복 로그인 관리 유틸리티
/**
 * 중복 로그인 감지 및 알림 처리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-09
 */

import ajax from './ajax';
import notificationManager from './notification';

class DuplicateLoginManager {
    constructor() {
        this.checkInterval = null;
        this.isChecking = false;
        this.checkIntervalMs = 60000; // 60초마다 체크 (운영 환경 최적화)
        this.lastCheckTime = null;
    }

/**
     * 중복 로그인 체크 시작
     */
    startChecking() {
        if (this.checkInterval) {
            console.warn('중복 로그인 체크가 이미 실행 중입니다.');
            return;
        }

        console.log('🔍 중복 로그인 체크 시작');
        
        // 로그인 직후에는 즉시 체크하지 않고, 60초 후부터 체크 시작
        setTimeout(() => {
            this.checkDuplicateLogin();
        }, 60000); // 60초 대기
        
        // 주기적으로 체크
        this.checkInterval = setInterval(() => {
            this.checkDuplicateLogin();
        }, this.checkIntervalMs);
    }

/**
     * 중복 로그인 체크 중지
     */
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('🛑 중복 로그인 체크 중지');
        }
        this.isChecking = false;
    }

/**
     * 강제로 모든 체크 중지 (개발 환경용)
     */
    forceStop() {
        this.stopChecking();
        this.isChecking = false;
        console.log('🛑 강제 중복 로그인 체크 중지');
    }

/**
     * 중복 로그인 체크 실행
     */
    async checkDuplicateLogin() {
        if (this.isChecking) {
            return;
        }

        try {
            this.isChecking = true;
            this.lastCheckTime = new Date();

            // ajax.get은 ApiResponse 래퍼에서 data를 추출해서 반환
            // 따라서 response는 { hasDuplicateLogin: boolean, message: string } 형태
            const response = await ajax.get('/api/v1/auth/check-duplicate-login');
            
            if (response && typeof response === 'object') {
                if (response.hasDuplicateLogin === true) {
                    console.warn('⚠️ 중복 로그인 감지됨:', response.message);
                    this.handleDuplicateLogin();
                } else {
                    console.debug('✅ 중복 로그인 없음');
                }
            } else {
                console.warn('중복 로그인 체크 실패: 응답 형식 오류', response);
                // 체크 실패 시 다음 체크까지 대기 시간을 늘림 (서버 부하 방지)
                if (this.checkInterval) {
                    clearInterval(this.checkInterval);
                    this.checkInterval = setInterval(() => {
                        this.checkDuplicateLogin();
                    }, this.checkIntervalMs * 2); // 2배로 늘림
                }
            }

        } catch (error) {
            console.error('❌ 중복 로그인 체크 에러:', error);
            // 에러 발생 시 체크 주기를 늘림
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = setInterval(() => {
                    this.checkDuplicateLogin();
                }, this.checkIntervalMs * 3); // 3배로 늘림
            }
        } finally {
            this.isChecking = false;
        }
    }

/**
     * 중복 로그인 처리
     */
    handleDuplicateLogin() {
        // 전역 이벤트로 중복 로그인 알림 표시 요청
        window.dispatchEvent(new CustomEvent('duplicateLoginDetected', {
            detail: { message: '다른 곳에서 로그인되어 현재 세션이 종료됩니다.' }
        }));

        // 5초 후 자동 로그아웃
        setTimeout(() => {
            this.forceLogout();
        }, 5000);
    }

/**
     * 강제 로그아웃
     */
    forceLogout() {
        console.log('🔓 강제 로그아웃 실행');
        
        // 로컬 스토리지 정리
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        sessionStorage.clear();
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login?reason=duplicate-login';
    }

/**
     * 세션 상태 확인
     */
    async checkSessionStatus() {
        try {
            const response = await ajax.get('/api/v1/auth/session-info');
            return response;
        } catch (error) {
            console.error('세션 상태 확인 실패:', error);
            return null;
        }
    }

/**
     * 사용자 세션 강제 종료 (관리자용)
     */
    async forceLogoutUser(email) {
        try {
            const response = await ajax.post('/api/v1/auth/force-logout', { email });
            
            if (response.success) {
                notificationManager.success(`${email} 사용자의 세션이 강제 종료되었습니다.`);
            } else {
                notificationManager.error(response.message || '강제 로그아웃에 실패했습니다.');
            }
            
            return response;
        } catch (error) {
            console.error('강제 로그아웃 실패:', error);
            notificationManager.error('네트워크 오류가 발생했습니다.');
            return { success: false, message: '네트워크 오류' };
        }
    }

/**
     * 중복 로그인 체크 상태 반환
     */
    getStatus() {
        return {
            isChecking: this.isChecking,
            lastCheckTime: this.lastCheckTime,
            checkIntervalMs: this.checkIntervalMs
        };
    }
}

// 싱글톤 인스턴스 생성
const duplicateLoginManager = new DuplicateLoginManager();

export default duplicateLoginManager;
