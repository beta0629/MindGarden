package com.coresolution.consultation.service;

import java.math.BigDecimal;

/**
 * 통계 설정 서비스 인터페이스
 * 공통 코드 기반 통계 설정 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface StatisticsConfigService {

    // ==================== 성과 평가 기준 ====================
    
    /**
     * 완료율 기준값 조회
     */
    BigDecimal getCompletionRateThreshold(String level); // EXCELLENT, GOOD, WARNING, CRITICAL
    
    /**
     * 취소율 기준값 조회
     */
    BigDecimal getCancellationRateThreshold(String level); // ACCEPTABLE, WARNING, CRITICAL
    
    /**
     * 노쇼율 기준값 조회
     */
    BigDecimal getNoShowRateThreshold(String level); // ACCEPTABLE, WARNING, CRITICAL
    
    // ==================== 성과 점수 가중치 ====================
    
    /**
     * 성과 점수 가중치 조회
     */
    BigDecimal getPerformanceWeight(String type); // COMPLETION_RATE, AVERAGE_RATING, CLIENT_RETENTION, etc.
    
    /**
     * 보너스 점수 조회
     */
    BigDecimal getBonusScore(String type); // CANCELLATION_BONUS, NOSHOW_BONUS
    
    // ==================== 등급 기준 ====================
    
    /**
     * 등급별 기준 점수 조회
     */
    BigDecimal getGradeThreshold(String grade); // S, A, B, C
    
    /**
     * 점수에 따른 등급명 조회
     */
    String getGradeName(BigDecimal score);
    
    /**
     * 등급 한글명 조회
     */
    String getGradeKoreanName(String grade);
    
    // ==================== 알림 설정 ====================
    
    /**
     * 알림 설정 조회
     */
    Integer getAlertConfig(String configType); // DUPLICATE_PREVENTION_HOURS, CRITICAL_THRESHOLD_DAYS, etc.
    
    /**
     * 알림 메시지 템플릿 조회
     */
    String getAlertMessageTemplate(String templateType);
    
    /**
     * 알림 메시지 생성 (템플릿 + 데이터)
     */
    String generateAlertMessage(String templateType, Object... params);
    
    // ==================== 통계 업데이트 설정 ====================
    
    /**
     * 통계 업데이트 시간 조회
     */
    Integer getUpdateSchedule(String updateType); // DAILY_UPDATE_HOUR, PERFORMANCE_UPDATE_HOUR, etc.
    
    // ==================== 대시보드 설정 ====================
    
    /**
     * 대시보드 설정 조회
     */
    Integer getDashboardConfig(String configType); // TOP_PERFORMERS_COUNT, RECENT_DAYS_COUNT, etc.
    
    // ==================== ERP 동기화 설정 ====================
    
    /**
     * ERP 동기화 설정 조회
     */
    Integer getErpSyncConfig(String configType); // FINANCIAL_SYNC_INTERVAL_HOURS, RETRY_ATTEMPTS, etc.
    
    // ==================== 캐시 관리 ====================
    
    /**
     * 설정 캐시 초기화
     */
    void clearConfigCache();
    
    /**
     * 특정 설정 그룹 캐시 초기화
     */
    void clearConfigCache(String codeGroup);
}
