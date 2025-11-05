/**
 * 에러 핸들러 유틸리티
 * 통합 에러 처리 시스템
 */

import NotificationService from '../services/NotificationService'; // NotificationService import

class ErrorHandler {
  // 에러 타입 분류
  static classifyError(error) {
    if (error.response) {
      // API 에러
      switch (error.response.status) {
        case 401:
          return { type: 'UNAUTHORIZED', message: '로그인이 필요합니다.' };
        case 403:
          return { type: 'FORBIDDEN', message: '권한이 없습니다.' };
        case 404:
          return { type: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다.' };
        case 500:
          return { type: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' };
        default:
          return { type: 'API_ERROR', message: error.response.data?.message || '오류가 발생했습니다.' };
      }
    } else if (error.request) {
      // 네트워크 에러
      return { type: 'NETWORK_ERROR', message: '네트워크 연결을 확인해주세요.' };
    } else {
      // 기타 에러
      return { type: 'UNKNOWN_ERROR', message: error.message || '알 수 없는 오류가 발생했습니다.' };
    }
  }
  
  // 에러 처리 및 사용자에게 표시
  static handleError(error, context = {}) {
    const classified = this.classifyError(error);
    
    // 에러 로깅
    console.error(`[${classified.type}] ${context.screen || 'Unknown'}:`, error);
    
    // 사용자에게 알림
    NotificationService.error(classified.message, { title: classified.type }); // Alert.alert 대신 NotificationService 사용
    
    // 특정 에러 타입별 처리
    if (classified.type === 'UNAUTHORIZED') {
      // 로그아웃 처리
      // SessionService.logout(); // TODO: SessionService 구현 후 호출
    }
    
    return classified;
  }
}

export default ErrorHandler;

