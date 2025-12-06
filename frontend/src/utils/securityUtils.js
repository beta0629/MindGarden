/**
 * 보안 모니터링 비즈니스 로직 유틸리티
/**
 * UI와 분리된 순수한 보안 관련 비즈니스 로직 관리
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import { WIDGET_CONSTANTS } from '../constants/widgetConstants';

// ===== 보안 데이터 처리기 =====
export const SecurityDataProcessor = {
/**
   * 보안 상태 API 응답 변환
   */
  transformSecurityStatusResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || {};
      
      return {
        securityScore: Number(data.securityScore) || 100,
        threatLevel: data.threatLevel || WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.LOW,
        activeThreats: Number(data.activeThreats) || 0,
        status: data.status || WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.SECURE,
        lastUpdate: new Date(data.lastUpdate) || new Date(),
        error: null
      };
    } catch (error) {
      console.error('보안 상태 데이터 변환 실패:', error);
      return {
        securityScore: 0,
        threatLevel: WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.CRITICAL,
        activeThreats: 0,
        status: WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS.ALERT,
        lastUpdate: new Date(),
        error: error.message
      };
    }
  },

/**
   * 차단된 IP 목록 응답 변환
   */
  transformBlockedIPsResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || [];
      return {
        blockedIPs: Array.isArray(data) ? data : [],
        count: Array.isArray(data) ? data.length : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('차단된 IP 데이터 변환 실패:', error);
      return {
        blockedIPs: [],
        count: 0,
        lastUpdated: new Date(),
        error: error.message
      };
    }
  },

/**
   * 보안 이벤트 통계 응답 변환
   */
  transformSecurityEventsResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || {};
      const securityEvents = data.securityEvents || {};
      
      // 이벤트를 배열로 변환하고 상위 5개만 선택
      const eventEntries = Object.entries(securityEvents)
        .map(([eventType, count]) => ({
          eventType: SecurityDataProcessor.formatEventType(eventType),
          count: Number(count) || 0,
          severity: SecurityDataProcessor.getEventSeverity(eventType)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        recentEvents: eventEntries,
        totalEvents: eventEntries.reduce((sum, event) => sum + event.count, 0),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('보안 이벤트 데이터 변환 실패:', error);
      return {
        recentEvents: [],
        totalEvents: 0,
        lastUpdated: new Date(),
        error: error.message
      };
    }
  },

/**
   * 이벤트 타입 포맷팅
   */
  formatEventType: (eventType) => {
    return eventType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  },

/**
   * 이벤트 심각도 결정
   */
  getEventSeverity: (eventType) => {
    const criticalEvents = ['SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT', 'BRUTE_FORCE_ATTACK'];
    const highEvents = ['UNAUTHORIZED_ACCESS_ATTEMPT', 'PRIVILEGE_ESCALATION_ATTEMPT'];
    const warningEvents = ['MULTIPLE_LOGIN_FAILURES', 'SUSPICIOUS_ACTIVITY'];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  }
};

// ===== 보안 분석기 =====
export const SecurityAnalyzer = {
/**
   * 보안 점수에 따른 등급 계산
   */
  calculateSecurityGrade: (score) => {
    const thresholds = WIDGET_CONSTANTS.SECURITY_WIDGET.SCORE_THRESHOLDS;
    
    if (score >= thresholds.EXCELLENT) return 'excellent';
    if (score >= thresholds.GOOD) return 'good';
    if (score >= thresholds.AVERAGE) return 'average';
    return 'poor';
  },

/**
   * 위협 수준에 따른 색상 클래스 결정
   */
  getThreatLevelColorClass: (threatLevel) => {
    const levels = WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS;
    
    switch (threatLevel) {
      case levels.LOW: return 'success';
      case levels.MEDIUM: return 'warning';
      case levels.HIGH: return 'error';
      case levels.CRITICAL: return 'critical';
      default: return 'info';
    }
  },

/**
   * 보안 상태에 따른 아이콘 타입 결정
   */
  getStatusIconType: (status) => {
    const statuses = WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS;
    
    switch (status) {
      case statuses.SECURE: return 'shield';
      case statuses.MONITORING: return 'eye';
      case statuses.WARNING: return 'warning';
      case statuses.ALERT: return 'ban';
      default: return 'shield';
    }
  },

/**
   * 보안 상태에 따른 CSS 클래스 결정
   */
  getStatusCssClass: (status) => {
    const statuses = WIDGET_CONSTANTS.SECURITY_WIDGET.SECURITY_STATUS;
    
    switch (status) {
      case statuses.SECURE: return 'status-secure';
      case statuses.MONITORING: return 'status-monitoring';
      case statuses.WARNING: return 'status-warning';
      case statuses.ALERT: return 'status-alert';
      default: return 'status-secure';
    }
  },

/**
   * 전체 보안 건강도 분석
   */
  analyzeSecurityHealth: (securityData) => {
    const { securityScore, threatLevel, activeThreats, blockedIPs } = securityData;
    
    let healthScore = securityScore;
    
    // 위협 수준에 따른 점수 조정
    const threatPenalty = {
      [WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.LOW]: 0,
      [WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.MEDIUM]: 10,
      [WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.HIGH]: 25,
      [WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.CRITICAL]: 40
    };
    
    healthScore -= threatPenalty[threatLevel] || 0;
    
    // 활성 위협에 따른 점수 조정
    healthScore -= Math.min(activeThreats * 5, 30);
    
    // 차단된 IP에 따른 점수 조정 (많은 차단은 좋은 방어를 의미하므로 약간만 차감)
    healthScore -= Math.min(blockedIPs * 0.5, 10);
    
    const finalScore = Math.max(healthScore, 0);
    
    return {
      healthScore: finalScore,
      grade: SecurityAnalyzer.calculateSecurityGrade(finalScore),
      recommendations: SecurityAnalyzer.generateRecommendations(securityData),
      riskLevel: SecurityAnalyzer.calculateRiskLevel(securityData)
    };
  },

/**
   * 위험 수준 계산
   */
  calculateRiskLevel: (securityData) => {
    const { threatLevel, activeThreats, securityScore } = securityData;
    
    if (threatLevel === WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.CRITICAL || 
        activeThreats > 10 || securityScore < 30) {
      return 'critical';
    }
    
    if (threatLevel === WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.HIGH || 
        activeThreats > 5 || securityScore < 50) {
      return 'high';
    }
    
    if (threatLevel === WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.MEDIUM || 
        activeThreats > 2 || securityScore < 75) {
      return 'medium';
    }
    
    return 'low';
  },

/**
   * 보안 권장사항 생성
   */
  generateRecommendations: (securityData) => {
    const recommendations = [];
    const { securityScore, threatLevel, activeThreats, blockedIPs } = securityData;
    
    if (securityScore < 50) {
      recommendations.push('보안 점수가 낮습니다. 즉시 보안 강화 조치를 취하세요.');
    }
    
    if (threatLevel === WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS.CRITICAL) {
      recommendations.push('긴급 위협이 감지되었습니다. 보안팀에 즉시 연락하세요.');
    }
    
    if (activeThreats > 5) {
      recommendations.push('활성 위협이 많습니다. 방화벽 규칙을 점검하세요.');
    }
    
    if (blockedIPs > 100) {
      recommendations.push('차단된 IP가 많습니다. 공격 패턴을 분석하세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('현재 보안 상태가 양호합니다. 지속적인 모니터링을 유지하세요.');
    }
    
    return recommendations;
  }
};

// ===== 보안 데이터 매니저 =====
export const SecurityDataManager = {
/**
   * 보안 데이터 캐시
   */
  cache: new Map(),
  
/**
   * 캐시된 데이터 조회
   */
  getCachedData: (key, maxAge = 10000) => { // 10초 캐시
    const cached = SecurityDataManager.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  },
  
/**
   * 데이터 캐시 저장
   */
  setCachedData: (key, data) => {
    SecurityDataManager.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
/**
   * 캐시 클리어
   */
  clearCache: () => {
    SecurityDataManager.cache.clear();
  },
  
/**
   * 보안 히스토리 관리
   */
  securityHistory: [],
  
/**
   * 보안 히스토리 추가
   */
  addToHistory: (securityData, maxLength = 50) => {
    SecurityDataManager.securityHistory.push({
      ...securityData,
      timestamp: Date.now()
    });
    
    // 최대 길이 유지
    if (SecurityDataManager.securityHistory.length > maxLength) {
      SecurityDataManager.securityHistory = 
        SecurityDataManager.securityHistory.slice(-maxLength);
    }
  },
  
/**
   * 보안 트렌드 분석
   */
  analyzeSecurityTrend: (metric, timeWindow = 10) => {
    const recentData = SecurityDataManager.securityHistory
      .slice(-timeWindow)
      .map(data => data[metric] || 0);
    
    if (recentData.length < 2) return 'stable';
    
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 15) return 'improving';
    if (changePercent < -15) return 'deteriorating';
    return 'stable';
  }
};

// ===== 보안 알림 매니저 =====
export const SecurityAlertManager = {
/**
   * 보안 알림 필요 여부 확인
   */
  shouldAlert: (securityData, previousData) => {
    if (!previousData) return false;
    
    const alerts = [];
    
    // 보안 점수 급락 확인
    if (securityData.securityScore < previousData.securityScore - 20) {
      alerts.push({
        type: 'score_drop',
        message: '보안 점수가 급격히 하락했습니다.',
        severity: 'high'
      });
    }
    
    // 위협 수준 상승 확인
    const threatLevels = Object.values(WIDGET_CONSTANTS.SECURITY_WIDGET.THREAT_LEVELS);
    const currentIndex = threatLevels.indexOf(securityData.threatLevel);
    const previousIndex = threatLevels.indexOf(previousData.threatLevel);
    
    if (currentIndex > previousIndex) {
      alerts.push({
        type: 'threat_escalation',
        message: `위협 수준이 ${previousData.threatLevel}에서 ${securityData.threatLevel}로 상승했습니다.`,
        severity: 'critical'
      });
    }
    
    // 활성 위협 증가 확인
    if (securityData.activeThreats > previousData.activeThreats + 5) {
      alerts.push({
        type: 'threat_increase',
        message: '활성 위협이 급격히 증가했습니다.',
        severity: 'high'
      });
    }
    
    return alerts;
  },
  
/**
   * 알림 메시지 포맷팅
   */
  formatAlertMessage: (alert) => {
    const timestamp = new Date().toLocaleString();
    return `[${timestamp}] ${alert.severity.toUpperCase()}: ${alert.message}`;
  }
};

export default {
  SecurityDataProcessor,
  SecurityAnalyzer,
  SecurityDataManager,
  SecurityAlertManager
};
