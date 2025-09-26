package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.Map;

/**
 * PL/SQL 기반 재무 서비스 인터페이스
 * 복잡한 재무 계산을 PL/SQL 프로시저로 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-26
 */
public interface PlSqlFinancialService {
    
    /**
     * 전사 통합 재무 현황 조회
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 통합 재무 데이터
     */
    Map<String, Object> getConsolidatedFinancialData(LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 재무 상세 데이터 조회
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 지점별 재무 데이터
     */
    Map<String, Object> getBranchFinancialBreakdown(LocalDate startDate, LocalDate endDate);
    
    /**
     * 월별 재무 추이 분석
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 월별 추이 데이터
     */
    Map<String, Object> getMonthlyFinancialTrend(LocalDate startDate, LocalDate endDate);
    
    /**
     * 카테고리별 재무 분석
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 카테고리별 분석 데이터
     */
    Map<String, Object> getCategoryFinancialBreakdown(LocalDate startDate, LocalDate endDate);
    
    /**
     * 월별 재무 보고서 생성
     * @param year 연도
     * @param month 월
     * @param branchCode 지점 코드 (선택사항)
     * @return 월별 보고서 데이터
     */
    Map<String, Object> generateMonthlyFinancialReport(int year, int month, String branchCode);
    
    /**
     * 분기별 재무 보고서 생성
     * @param year 연도
     * @param quarter 분기
     * @param branchCode 지점 코드 (선택사항)
     * @return 분기별 보고서 데이터
     */
    Map<String, Object> generateQuarterlyFinancialReport(int year, int quarter, String branchCode);
    
    /**
     * 연도별 재무 보고서 생성
     * @param year 연도
     * @param branchCode 지점 코드 (선택사항)
     * @return 연도별 보고서 데이터
     */
    Map<String, Object> generateYearlyFinancialReport(int year, String branchCode);
    
    /**
     * 재무 성과 지표 계산
     * @param startDate 시작일
     * @param endDate 종료일
     * @param branchCode 지점 코드 (선택사항)
     * @return KPI 데이터
     */
    Map<String, Object> calculateFinancialKPIs(LocalDate startDate, LocalDate endDate, String branchCode);
}
