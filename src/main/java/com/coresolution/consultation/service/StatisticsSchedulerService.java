package com.coresolution.consultation.service;

import java.time.LocalDate;

/**
 * 통계 자동화 스케줄러 서비스
 * MySQL 이벤트 스케줄러 대신 Spring Scheduler를 사용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface StatisticsSchedulerService {
    
    /**
     * 일별 통계 자동 업데이트 스케줄러
     * 매일 자정 1분 후 실행
     */
    void scheduleDailyStatisticsUpdate();
    
    /**
     * 상담사 성과 자동 업데이트 스케줄러
     * 매일 자정 3분 후 실행
     */
    void scheduleConsultantPerformanceUpdate();
    
    /**
     * 성과 모니터링 자동 실행 스케줄러
     * 매일 자정 5분 후 실행
     */
    void schedulePerformanceMonitoring();
    
    /**
     * 수동으로 어제 통계 업데이트 실행
     * 
     * @return 실행 결과
     */
    String updateYesterdayStatistics();
    
    /**
     * 수동으로 특정 날짜 통계 업데이트 실행
     * 
     * @param targetDate 대상 날짜
     * @return 실행 결과
     */
    String updateStatisticsForDate(LocalDate targetDate);
    
    /**
     * 스케줄러 상태 확인
     * 
     * @return 스케줄러 상태 정보
     */
    String getSchedulerStatus();
}
