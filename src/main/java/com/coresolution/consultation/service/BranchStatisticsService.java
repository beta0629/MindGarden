package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import java.time.LocalDate;
import java.util.Map;

/**
 * 지점별 통계 및 성과 관리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public interface BranchStatisticsService {
    
    /**
     * 지점별 상담 건수 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 상담 건수 통계
     */
    Map<String, Object> getConsultationStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 매출 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 매출 통계
     */
    Map<String, Object> getRevenueStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 상담사 성과 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 상담사 성과 통계
     */
    Map<String, Object> getConsultantPerformanceStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 고객 만족도 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 고객 만족도 통계
     */
    Map<String, Object> getCustomerSatisfactionStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 전체 성과 대시보드 데이터 조회
     * @param branchId 지점 ID
     * @param period 기간 (일/주/월/년)
     * @return 전체 성과 데이터
     */
    Map<String, Object> getBranchDashboardData(Long branchId, String period);
    
    /**
     * 모든 지점 성과 비교 데이터 조회 (본사 관리자용)
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 지점별 성과 비교 데이터
     */
    Map<String, Object> getAllBranchesComparisonData(LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 월별 성과 트렌드 조회
     * @param branchId 지점 ID
     * @param year 연도
     * @return 월별 성과 트렌드
     */
    Map<String, Object> getMonthlyTrendData(Long branchId, int year);
    
    /**
     * 지점별 상담사별 상세 성과 조회
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 상담사 상세 성과
     */
    Map<String, Object> getConsultantDetailPerformance(Long branchId, Long consultantId, LocalDate startDate, LocalDate endDate);
}
