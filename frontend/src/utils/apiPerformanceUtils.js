/**
 * API 성능 모니터링 비즈니스 로직 유틸리티
 * UI와 분리된 순수한 API 성능 관련 비즈니스 로직 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

import { WIDGET_CONSTANTS, API_PERFORMANCE_WIDGET } from '../constants/widgetConstants';
import { PerformanceUtils } from './performanceUtils';

// ===== API 성능 데이터 처리 =====
export const ApiPerformanceProcessor = {
  /**
   * API 성능 통계 데이터 변환
   */
  transformApiStatsResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || {};
      
      return {
        summary: {
          totalApiEndpoints: data.summary?.totalApiEndpoints || 0,
          totalRequests: data.summary?.totalRequests || 0,
          averageResponseTime: data.summary?.averageResponseTime || 0,
          overallErrorRate: data.summary?.overallErrorRate || 0,
          slowestRequest: data.summary?.slowestRequest || 0,
          slowestEndpoint: data.summary?.slowestEndpoint || ''
        },
        endpoints: data.endpoints || {},
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('API 통계 데이터 변환 실패:', error);
      return {
        summary: {
          totalApiEndpoints: 0,
          totalRequests: 0,
          averageResponseTime: 0,
          overallErrorRate: 0,
          slowestRequest: 0,
          slowestEndpoint: ''
        },
        endpoints: {},
        lastUpdated: new Date(),
        error: error.message
      };
    }
  },

  /**
   * 느린 API 데이터 변환
   */
  transformSlowApisResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || {};
      return {
        threshold: data.threshold || 500,
        slowApiCount: data.slowApiCount || 0,
        slowApis: data.slowApis || {},
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('느린 API 데이터 변환 실패:', error);
      return {
        threshold: 500,
        slowApiCount: 0,
        slowApis: {},
        lastUpdated: new Date(),
        error: error.message
      };
    }
  },

  /**
   * 에러 많은 API 데이터 변환
   */
  transformErrorProneApisResponse: (apiResponse) => {
    try {
      const data = apiResponse?.data || {};
      return {
        errorRateThreshold: data.errorRateThreshold || 5.0,
        errorProneApiCount: data.errorProneApiCount || 0,
        errorProneApis: data.errorProneApis || {},
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('에러 많은 API 데이터 변환 실패:', error);
      return {
        errorRateThreshold: 5.0,
        errorProneApiCount: 0,
        errorProneApis: {},
        lastUpdated: new Date(),
        error: error.message
      };
    }
  }
};

// ===== API 성능 분석기 =====
export const ApiPerformanceAnalyzer = {
  /**
   * 응답 시간 성능 등급 계산
   */
  calculateResponseTimeGrade: (responseTime) => {
    const thresholds = API_PERFORMANCE_WIDGET.THRESHOLDS.RESPONSE_TIME;
    
    if (responseTime < thresholds.EXCELLENT) return 'excellent';
    if (responseTime < thresholds.GOOD) return 'good';
    if (responseTime < thresholds.AVERAGE) return 'average';
    return 'poor';
  },

  /**
   * 에러율 성능 등급 계산
   */
  calculateErrorRateGrade: (errorRate) => {
    const thresholds = API_PERFORMANCE_WIDGET.THRESHOLDS.ERROR_RATE;
    
    if (errorRate < thresholds.EXCELLENT) return 'excellent';
    if (errorRate < thresholds.GOOD) return 'good';
    if (errorRate < thresholds.AVERAGE) return 'average';
    return 'poor';
  },

  /**
   * 전체 시스템 건강도 분석
   */
  analyzeSystemHealth: (performanceData) => {
    const { summary } = performanceData;
    
    const responseTimeGrade = ApiPerformanceAnalyzer.calculateResponseTimeGrade(summary.averageResponseTime);
    const errorRateGrade = ApiPerformanceAnalyzer.calculateErrorRateGrade(summary.overallErrorRate);
    
    // 등급을 점수로 변환
    const gradeScores = {
      excellent: 4,
      good: 3,
      average: 2,
      poor: 1
    };
    
    const avgScore = (gradeScores[responseTimeGrade] + gradeScores[errorRateGrade]) / 2;
    
    let overallHealth;
    if (avgScore >= 3.5) overallHealth = 'excellent';
    else if (avgScore >= 2.5) overallHealth = 'good';
    else if (avgScore >= 1.5) overallHealth = 'average';
    else overallHealth = 'poor';
    
    return {
      overallHealth,
      responseTimeGrade,
      errorRateGrade,
      score: avgScore,
      recommendations: ApiPerformanceAnalyzer.generateRecommendations(responseTimeGrade, errorRateGrade)
    };
  },

  /**
   * 성능 개선 권장사항 생성
   */
  generateRecommendations: (responseTimeGrade, errorRateGrade) => {
    const recommendations = [];
    
    if (responseTimeGrade === 'poor') {
      recommendations.push('응답 시간이 느립니다. 데이터베이스 쿼리 최적화를 검토하세요.');
      recommendations.push('캐시 전략을 개선하여 응답 속도를 향상시키세요.');
    } else if (responseTimeGrade === 'average') {
      recommendations.push('응답 시간 개선을 위해 인덱스 최적화를 고려하세요.');
    }
    
    if (errorRateGrade === 'poor') {
      recommendations.push('에러율이 높습니다. 로그를 확인하여 근본 원인을 파악하세요.');
      recommendations.push('입력 유효성 검사 및 예외 처리를 강화하세요.');
    } else if (errorRateGrade === 'average') {
      recommendations.push('에러 처리 로직을 개선하여 안정성을 높이세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('시스템이 양호한 상태입니다. 지속적인 모니터링을 유지하세요.');
    }
    
    return recommendations;
  },

  /**
   * API 엔드포인트 분석
   */
  analyzeEndpoint: (endpointStats) => {
    const responseTimeGrade = ApiPerformanceAnalyzer.calculateResponseTimeGrade(endpointStats.averageDuration);
    const errorRateGrade = ApiPerformanceAnalyzer.calculateErrorRateGrade(endpointStats.errorRate);
    
    return {
      responseTimeGrade,
      errorRateGrade,
      isSlowApi: endpointStats.averageDuration > API_PERFORMANCE_WIDGET.THRESHOLDS.SLOW_API_MS,
      isErrorProne: endpointStats.errorRate > API_PERFORMANCE_WIDGET.THRESHOLDS.ERROR_RATE_PERCENT,
      healthScore: (responseTimeGrade === 'excellent' ? 4 : responseTimeGrade === 'good' ? 3 : responseTimeGrade === 'average' ? 2 : 1) +
                   (errorRateGrade === 'excellent' ? 4 : errorRateGrade === 'good' ? 3 : errorRateGrade === 'average' ? 2 : 1)
    };
  }
};

// ===== API 성능 데이터 매니저 =====
export const ApiPerformanceDataManager = {
  /**
   * 성능 데이터 캐시 관리
   */
  cache: new Map(),
  
  /**
   * 캐시된 데이터 조회
   */
  getCachedData: (key, maxAge = 30000) => { // 30초 캐시
    const cached = ApiPerformanceDataManager.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  },
  
  /**
   * 데이터 캐시 저장
   */
  setCachedData: (key, data) => {
    ApiPerformanceDataManager.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  /**
   * 캐시 클리어
   */
  clearCache: () => {
    ApiPerformanceDataManager.cache.clear();
  },
  
  /**
   * 성능 히스토리 관리
   */
  performanceHistory: [],
  
  /**
   * 성능 히스토리 추가
   */
  addToHistory: (performanceData, maxLength = 100) => {
    ApiPerformanceDataManager.performanceHistory.push({
      ...performanceData,
      timestamp: Date.now()
    });
    
    // 최대 길이 유지
    if (ApiPerformanceDataManager.performanceHistory.length > maxLength) {
      ApiPerformanceDataManager.performanceHistory = 
        ApiPerformanceDataManager.performanceHistory.slice(-maxLength);
    }
  },
  
  /**
   * 성능 트렌드 분석
   */
  analyzeTrend: (metric, timeWindow = 10) => {
    const recentData = ApiPerformanceDataManager.performanceHistory
      .slice(-timeWindow)
      .map(data => data.summary?.[metric] || 0);
    
    if (recentData.length < 2) return 'stable';
    
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }
};

// ===== API 성능 리포트 생성기 =====
export const ApiPerformanceReportGenerator = {
  /**
   * 성능 보고서 데이터 생성
   */
  generateReportData: (performanceData) => {
    const analysis = ApiPerformanceAnalyzer.analyzeSystemHealth(performanceData);
    
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        ...performanceData.summary,
        healthGrade: analysis.overallHealth,
        healthScore: analysis.score
      },
      analysis: {
        responseTimeGrade: analysis.responseTimeGrade,
        errorRateGrade: analysis.errorRateGrade,
        recommendations: analysis.recommendations
      },
      endpoints: Object.entries(performanceData.endpoints || {}).map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        analysis: ApiPerformanceAnalyzer.analyzeEndpoint(stats)
      })),
      trends: {
        responseTime: ApiPerformanceDataManager.analyzeTrend('averageResponseTime'),
        errorRate: ApiPerformanceDataManager.analyzeTrend('overallErrorRate'),
        requestVolume: ApiPerformanceDataManager.analyzeTrend('totalRequests')
      }
    };
  },
  
  /**
   * JSON 보고서 다운로드
   */
  downloadJsonReport: (reportData, filename) => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `api-performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  /**
   * CSV 보고서 다운로드
   */
  downloadCsvReport: (reportData, filename) => {
    const csvRows = [
      ['Endpoint', 'Total Requests', 'Average Duration (ms)', 'Error Rate (%)', 'Health Grade'],
      ...reportData.endpoints.map(endpoint => [
        endpoint.endpoint,
        endpoint.totalRequests,
        Math.round(endpoint.averageDuration),
        endpoint.errorRate.toFixed(2),
        endpoint.analysis.responseTimeGrade
      ])
    ];
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `api-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export default {
  ApiPerformanceProcessor,
  ApiPerformanceAnalyzer,
  ApiPerformanceDataManager,
  ApiPerformanceReportGenerator
};
