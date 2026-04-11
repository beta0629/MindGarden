/**
 * 성능 모니터링 비즈니스 로직 유틸리티
/**
 * UI와 분리된 순수한 비즈니스 로직 관리
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

// ===== 성능 지표 계산 함수 =====
export const PerformanceCalculator = {
/**
   * 캐시 히트율 계산
   */
  calculateCacheHitRate: (cacheStats) => {
    if (!cacheStats || typeof cacheStats !== 'object') return 0;
    
    let totalHits = 0;
    let totalRequests = 0;
    
    Object.values(cacheStats).forEach(cache => {
      if (cache && typeof cache === 'object') {
        const hits = Number(cache.hits) || 0;
        const misses = Number(cache.misses) || 0;
        
        totalHits += hits;
        totalRequests += hits + misses;
      }
    });
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  },

/**
   * 전체 캐시 크기 계산
   */
  calculateTotalCacheSize: (cacheStats) => {
    if (!cacheStats || typeof cacheStats !== 'object') return 0;
    
    return Object.values(cacheStats).reduce((total, cache) => {
      return total + (Number(cache.size) || 0);
    }, 0);
  },

/**
   * 성능 트렌드 분석
   */
  analyzeTrend: (currentValue, previousValue, threshold = 5) => {
    if (!previousValue || previousValue === 0) return 'stable';
    
    const changePercent = ((currentValue - previousValue) / previousValue) * 100;
    
    if (changePercent > threshold) return 'up';
    if (changePercent < -threshold) return 'down';
    return 'stable';
  },

/**
   * 성능 등급 계산
   */
  calculatePerformanceGrade: (value, type) => {
    const thresholds = {
      responseTime: { excellent: 100, good: 200, poor: 500 },
      cacheHitRate: { excellent: 80, good: 60, poor: 40 },
      systemLoad: { excellent: 50, good: 70, poor: 90 },
      errorRate: { excellent: 1, good: 5, poor: 10 }
    };
    
    const threshold = thresholds[type];
    if (!threshold) return 'unknown';
    
    if (type === 'responseTime' || type === 'systemLoad' || type === 'errorRate') {
      // 낮을수록 좋은 지표
      if (value <= threshold.excellent) return 'excellent';
      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'average';
      return 'poor';
    } else {
      // 높을수록 좋은 지표
      if (value >= threshold.excellent) return 'excellent';
      if (value >= threshold.good) return 'good';
      if (value >= threshold.poor) return 'average';
      return 'poor';
    }
  }
};

// ===== 데이터 변환 함수 =====
export const DataTransformer = {
/**
   * API 응답을 성능 데이터로 변환
   */
  transformCacheStatsToPerformanceData: (apiResponse) => {
    try {
      const cacheStats = apiResponse?.data || {};
      
      return {
        cacheHitRate: PerformanceCalculator.calculateCacheHitRate(cacheStats),
        totalCacheSize: PerformanceCalculator.calculateTotalCacheSize(cacheStats),
        cacheCount: Object.keys(cacheStats).length,
        lastUpdated: new Date(),
        rawData: cacheStats
      };
    } catch (error) {
      console.error('캐시 통계 변환 실패:', error);
      return {
        cacheHitRate: 0,
        totalCacheSize: 0,
        cacheCount: 0,
        lastUpdated: new Date(),
        rawData: {},
        error: error.message
      };
    }
  },

/**
   * 성능 데이터를 차트 데이터로 변환
   */
  transformToChartData: (performanceHistory, metric) => {
    if (!Array.isArray(performanceHistory)) return [];
    
    return performanceHistory.map((data, index) => ({
      timestamp: data.timestamp || new Date(Date.now() - (performanceHistory.length - index) * 60000),
      value: data[metric] || 0,
      label: new Date(data.timestamp || Date.now()).toLocaleTimeString()
    }));
  },

/**
   * 메트릭 데이터 정규화
   */
  normalizeMetricValue: (value, type) => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    
    switch (type) {
      case 'percentage':
        return Math.max(0, Math.min(100, Number(value.toFixed(1))));
      case 'milliseconds':
        return Math.max(0, Number(value.toFixed(0)));
      case 'bytes':
        return Math.max(0, Math.floor(value));
      case 'count':
        return Math.max(0, Math.floor(value));
      default:
        return Number(value.toFixed(2));
    }
  }
};

// ===== 성능 모니터링 상태 관리 =====
export const PerformanceMonitor = {
/**
   * 성능 임계값 검사
   */
  checkThresholds: (metrics, thresholds) => {
    const alerts = [];
    
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric];
      if (value !== undefined && value !== null) {
        if (threshold.critical && value >= threshold.critical) {
          alerts.push({
            level: 'critical',
            metric,
            value,
            threshold: threshold.critical,
            message: `${metric}이(가) 임계 수준에 도달했습니다: ${value}`
          });
        } else if (threshold.warning && value >= threshold.warning) {
          alerts.push({
            level: 'warning',
            metric,
            value,
            threshold: threshold.warning,
            message: `${metric}이(가) 경고 수준에 도달했습니다: ${value}`
          });
        }
      }
    });
    
    return alerts;
  },

/**
   * 성능 히스토리 관리
   */
  updatePerformanceHistory: (history, newData, maxLength = 50) => {
    const updatedHistory = [...history, {
      ...newData,
      timestamp: new Date()
    }];
    
    // 최대 길이 유지
    if (updatedHistory.length > maxLength) {
      return updatedHistory.slice(-maxLength);
    }
    
    return updatedHistory;
  },

/**
   * 성능 요약 생성
   */
  generatePerformanceSummary: (metrics) => {
    const summary = {
      overall: 'good',
      issues: [],
      recommendations: []
    };
    
    // 전체 성능 등급 계산
    const grades = Object.entries(metrics).map(([key, value]) => {
      return PerformanceCalculator.calculatePerformanceGrade(value, key);
    });
    
    const gradeScores = {
      excellent: 4,
      good: 3,
      average: 2,
      poor: 1,
      unknown: 0
    };
    
    const avgScore = grades.reduce((sum, grade) => sum + gradeScores[grade], 0) / grades.length;
    
    if (avgScore >= 3.5) summary.overall = 'excellent';
    else if (avgScore >= 2.5) summary.overall = 'good';
    else if (avgScore >= 1.5) summary.overall = 'average';
    else summary.overall = 'poor';
    
    // 개선 권장사항 생성
    Object.entries(metrics).forEach(([metric, value]) => {
      const grade = PerformanceCalculator.calculatePerformanceGrade(value, metric);
      
      if (grade === 'poor') {
        summary.issues.push(`${metric} 성능이 저하되었습니다`);
        
        switch (metric) {
          case 'cacheHitRate':
            summary.recommendations.push('캐시 전략을 재검토하고 자주 사용되는 데이터의 캐시 정책을 개선하세요');
            break;
          case 'responseTime':
            summary.recommendations.push('API 응답 시간 최적화를 위해 쿼리 성능을 점검하세요');
            break;
          case 'systemLoad':
            summary.recommendations.push('시스템 리소스 사용량을 모니터링하고 부하 분산을 고려하세요');
            break;
        }
      }
    });
    
    return summary;
  }
};

// ===== 유틸리티 함수 =====
export const PerformanceUtils = {
/**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

/**
   * 밀리초를 읽기 쉬운 형태로 변환
   */
  formatDuration: (milliseconds) => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
  },

/**
   * 숫자를 읽기 쉬운 형태로 변환
   */
  formatNumber: (number, decimals = 0) => {
    if (typeof number !== 'number') return '0';
    
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(decimals)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(decimals)}K`;
    }
    
    return number.toFixed(decimals);
  },

/**
   * 퍼센티지 포맷팅
   */
  formatPercentage: (value, decimals = 1) => {
    if (typeof value !== 'number') return '0%';
    return `${value.toFixed(decimals)}%`;
  }
};

export default {
  PerformanceCalculator,
  DataTransformer,
  PerformanceMonitor,
  PerformanceUtils
};
