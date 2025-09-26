package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantPerformance;
import com.mindgarden.consultation.entity.DailyStatistics;
import com.mindgarden.consultation.entity.PerformanceAlert;

/**
 * 통계 서비스 인터페이스
 * PL/SQL 도입을 위한 통계 처리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface StatisticsService {

    // ==================== 일별 통계 관리 ====================
    
    /**
     * 특정 날짜의 일별 통계 생성/업데이트
     */
    DailyStatistics updateDailyStatistics(LocalDate date, String branchCode);

    /**
     * 일별 통계 조회
     */
    DailyStatistics getDailyStatistics(LocalDate date, String branchCode);

    /**
     * 기간별 일별 통계 조회
     */
    List<DailyStatistics> getDailyStatistics(LocalDate startDate, LocalDate endDate, String branchCode);

    /**
     * 월별 집계 통계 조회
     */
    Map<String, Object> getMonthlyAggregatedStatistics(String yearMonth, String branchCode);

    // ==================== 상담사 성과 관리 ====================
    
    /**
     * 상담사 성과 계산 및 업데이트
     */
    ConsultantPerformance updateConsultantPerformance(Long consultantId, LocalDate date);

    /**
     * 상담사 성과 조회
     */
    ConsultantPerformance getConsultantPerformance(Long consultantId, LocalDate date);

    /**
     * 상위 성과자 조회
     */
    List<ConsultantPerformance> getTopPerformers(LocalDate startDate, LocalDate endDate, String branchCode, int limit);

    /**
     * 성과 저하 상담사 조회
     */
    List<ConsultantPerformance> getUnderperformingConsultants(LocalDate date, String branchCode);

    /**
     * 상담사 성과 트렌드 분석
     */
    Map<String, Object> getPerformanceTrend(Long consultantId, LocalDate startDate, LocalDate endDate);

    // ==================== 알림 관리 ====================
    
    /**
     * 성과 알림 생성
     */
    PerformanceAlert createPerformanceAlert(Long consultantId, PerformanceAlert.AlertLevel level, String message);

    /**
     * 미처리 알림 조회
     */
    List<PerformanceAlert> getPendingAlerts();

    /**
     * 긴급 알림 조회
     */
    List<PerformanceAlert> getCriticalAlerts();

    /**
     * 알림 상태 업데이트
     */
    void markAlertAsRead(Long alertId);

    // ==================== 배치 처리 ====================
    
    /**
     * 전체 일별 통계 업데이트 (배치용)
     */
    void updateAllDailyStatistics(LocalDate date);

    /**
     * 전체 상담사 성과 업데이트 (배치용)
     */
    void updateAllConsultantPerformance(LocalDate date);

    /**
     * 성과 저하 감지 및 알림 생성 (배치용)
     */
    void detectPerformanceIssuesAndCreateAlerts(LocalDate date);

    // ==================== 대시보드용 통계 ====================
    
    /**
     * 대시보드용 종합 통계
     */
    Map<String, Object> getDashboardStatistics(String branchCode);

    /**
     * 실시간 성과 지표
     */
    Map<String, Object> getRealTimePerformanceIndicators(String branchCode);

    /**
     * 트렌드 분석 데이터
     */
    Map<String, Object> getTrendAnalysisData(LocalDate startDate, LocalDate endDate, String branchCode);
    
    /**
     * 월간 통계 조회
     */
    Map<String, Object> getMonthlyStatistics(LocalDate startDate, LocalDate endDate, String branchCode);
}
