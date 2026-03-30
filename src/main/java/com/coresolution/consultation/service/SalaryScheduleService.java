package com.coresolution.consultation.service;

import java.time.LocalDate;

/**
 * 급여 스케줄 관리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
public interface SalaryScheduleService {
    
    /**
     * 현재 달의 급여 기산일 조회
     * @return 급여 기산일
     */
    LocalDate getCurrentMonthBaseDate();
    
    /**
     * 지정된 달의 급여 기산일 조회
     * @param year 년도
     * @param month 월
     * @return 급여 기산일
     */
    LocalDate getBaseDate(int year, int month);
    
    /**
     * 현재 달의 급여 지급일 조회
     * @return 급여 지급일
     */
    LocalDate getCurrentMonthPaymentDate();
    
    /**
     * 지정된 달의 급여 지급일 조회
     * @param year 년도
     * @param month 월
     * @return 급여 지급일
     */
    LocalDate getPaymentDate(int year, int month);
    
    /**
     * 현재 달의 급여 마감일 조회
     * @return 급여 마감일
     */
    LocalDate getCurrentMonthCutoffDate();
    
    /**
     * 지정된 달의 급여 마감일 조회
     * @param year 년도
     * @param month 월
     * @return 급여 마감일
     */
    LocalDate getCutoffDate(int year, int month);
    
    /**
     * 급여 배치 실행 여부 확인
     * @return 배치 실행 가능 여부
     */
    boolean isBatchExecutionTime();
    
    /**
     * 급여 계산 기간 조회
     * @param year 년도
     * @param month 월
     * @return 배열 [시작일, 종료일]
     */
    LocalDate[] getCalculationPeriod(int year, int month);
}
