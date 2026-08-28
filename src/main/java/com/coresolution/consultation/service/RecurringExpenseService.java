package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.RecurringExpense;

/**
 * 반복 지출 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface RecurringExpenseService {
    
    // ==================== 반복 지출 관리 ====================
    
    /**
     * 반복 지출 생성
     */
    RecurringExpense createRecurringExpense(RecurringExpense recurringExpense);
    
    /**
     * 반복 지출 수정
     */
    RecurringExpense updateRecurringExpense(Long id, RecurringExpense recurringExpense);
    
    /**
     * 반복 지출 삭제 (비활성화)
     */
    boolean deleteRecurringExpense(Long id);
    
    /**
     * 반복 지출 조회
     */
    RecurringExpense getRecurringExpenseById(Long id);
    
    /**
     * 모든 활성 반복 지출 조회
     */
    List<RecurringExpense> getAllActiveRecurringExpenses();
    
    /**
     * 지출 유형별 반복 지출 조회
     */
    List<RecurringExpense> getRecurringExpensesByType(String expenseType);
    
    /**
     * 처리 예정인 반복 지출 조회
     */
    List<RecurringExpense> getDueRecurringExpenses(LocalDate targetDate);
    
    // ==================== 자동 처리 ====================
    
    /**
     * 처리 예정인 반복 지출 자동 처리
     */
    int processDueRecurringExpenses(LocalDate targetDate);
    
    /**
     * 특정 반복 지출 수동 처리
     */
    void processRecurringExpense(Long recurringExpenseId, java.math.BigDecimal customAmount);
    
    /**
     * 반복 지출 일시 중단
     */
    void pauseRecurringExpense(Long id, String reason);
    
    /**
     * 반복 지출 재개
     */
    void resumeRecurringExpense(Long id);
    
    // ==================== 통계 및 분석 ====================
    
    /**
     * 반복 지출 현황 조회
     */
    Map<String, Object> getRecurringExpenseStatus();
    
    /**
     * 월별 반복 지출 예상 금액
     */
    Map<String, Object> getMonthlyRecurringExpenseForecast();
    
    /**
     * 반복 지출 처리 내역 조회
     */
    Map<String, Object> getRecurringExpenseHistory(String startDate, String endDate);
    
    /**
     * 처리 예정 알림 목록 조회
     */
    List<RecurringExpense> getUpcomingRecurringExpenses(int daysAhead);

    /**
     * 테넌트의 모든 반복 지출 조회 (비활성 포함 — 운영자 설정 UI)
     */
    List<RecurringExpense> getAllRecurringExpensesForTenant();

    /**
     * 시작 달부터 현재(Asia/Seoul) 월까지 누락된 월별 EXPENSE 자동 기록 (멱등).
     *
     * @return 새로 생성된 거래 건수
     */
    int catchUpMonthlyRecurringExpenses();
}
