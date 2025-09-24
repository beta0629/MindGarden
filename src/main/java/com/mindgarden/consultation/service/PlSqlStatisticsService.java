package com.mindgarden.consultation.service;

import java.time.LocalDate;

/**
 * PL/SQL 프로시저 기반 통계 처리 서비스
 * 기존 Java Stream 기반 처리를 PL/SQL로 대체하여 성능 향상
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface PlSqlStatisticsService {
    
    /**
     * 일별 통계 업데이트 PL/SQL 프로시저 호출
     * 
     * @param branchCode 지점 코드 (특정 지점 처리시)
     * @param statDate 통계 대상 날짜
     * @return 처리 결과 메시지
     */
    String updateDailyStatistics(String branchCode, LocalDate statDate);
    
    /**
     * 모든 지점 일별 통계 업데이트 PL/SQL 프로시저 호출
     * 
     * @param statDate 통계 대상 날짜
     * @return 처리 결과 메시지
     */
    String updateAllBranchDailyStatistics(LocalDate statDate);
    
    /**
     * 상담사별 성과 업데이트 PL/SQL 프로시저 호출
     * 
     * @param consultantId 상담사 ID
     * @param performanceDate 성과 계산 대상 날짜
     * @return 처리 결과 메시지
     */
    String updateConsultantPerformance(Long consultantId, LocalDate performanceDate);
    
    /**
     * 모든 상담사 성과 업데이트 PL/SQL 프로시저 호출
     * 
     * @param performanceDate 성과 계산 대상 날짜
     * @return 처리 결과 메시지
     */
    String updateAllConsultantPerformance(LocalDate performanceDate);
    
    /**
     * 일일 성과 모니터링 PL/SQL 프로시저 호출
     * 성과 기준 미달 상담사에 대한 알림 생성
     * 
     * @param monitoringDate 모니터링 대상 날짜
     * @return 생성된 알림 개수
     */
    int performDailyPerformanceMonitoring(LocalDate monitoringDate);
    
    /**
     * PL/SQL 프로시저 실행 상태 확인
     * 
     * @return 실행 가능 여부
     */
    boolean isProcedureAvailable();
    
    /**
     * 통계 일관성 검증
     * Java 계산 결과와 PL/SQL 계산 결과 비교
     * 
     * @param branchCode 지점 코드
     * @param statDate 검증 대상 날짜
     * @return 일관성 검증 결과
     */
    boolean validateStatisticsConsistency(String branchCode, LocalDate statDate);
}
