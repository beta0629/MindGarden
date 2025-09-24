package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.Map;

/**
 * 통계 시스템 테스트용 데이터 생성 서비스
 * PL/SQL 프로시저 테스트를 위한 샘플 데이터 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface StatisticsTestDataService {
    
    /**
     * 테스트용 스케줄 데이터 생성
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @param scheduleCount 생성할 스케줄 수
     * @return 생성 결과
     */
    Map<String, Object> createTestSchedules(LocalDate targetDate, String branchCode, int scheduleCount);
    
    /**
     * 테스트용 완료된 상담 데이터 생성
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @param completedCount 완료 처리할 스케줄 수
     * @return 생성 결과
     */
    Map<String, Object> createCompletedConsultations(LocalDate targetDate, String branchCode, int completedCount);
    
    /**
     * 테스트용 재무 거래 데이터 생성
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @param transactionCount 생성할 거래 수
     * @return 생성 결과
     */
    Map<String, Object> createTestFinancialTransactions(LocalDate targetDate, String branchCode, int transactionCount);
    
    /**
     * 테스트용 평점 데이터 생성
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @param ratingCount 생성할 평점 수
     * @return 생성 결과
     */
    Map<String, Object> createTestRatings(LocalDate targetDate, String branchCode, int ratingCount);
    
    /**
     * 종합 테스트 데이터 세트 생성
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @return 생성 결과
     */
    Map<String, Object> createCompleteTestDataSet(LocalDate targetDate, String branchCode);
    
    /**
     * 테스트 데이터 정리
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드 (null이면 모든 지점)
     * @return 정리 결과
     */
    Map<String, Object> cleanupTestData(LocalDate targetDate, String branchCode);
    
    /**
     * 다양한 시나리오 테스트 데이터 생성
     * - 정상 완료, 취소, 노쇼 등 다양한 상태의 스케줄
     * - 다양한 평점 분포
     * - 환불 케이스 포함
     * 
     * @param targetDate 대상 날짜
     * @param branchCode 지점 코드
     * @return 생성 결과
     */
    Map<String, Object> createDiverseTestScenarios(LocalDate targetDate, String branchCode);
}
