package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.coresolution.consultation.entity.RecurringExpense;

/**
 * 반복 지출 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface RecurringExpenseRepository extends BaseRepository<RecurringExpense, Long> {
    
    /**
     * 테넌트별 활성화된 모든 반복 지출 조회 (테넌트 필터링)
     */
    @Query("SELECT re FROM RecurringExpense re WHERE re.tenantId = :tenantId AND re.isActive = true")
    List<RecurringExpense> findByTenantIdAndIsActiveTrue(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 위험: 모든 테넌트 반복 지출 정보 노출!
     */
    @Deprecated
    List<RecurringExpense> findByIsActiveTrue();
    
    /**
     * 지출 유형별 활성 반복 지출 조회
     */
    List<RecurringExpense> findByExpenseTypeAndIsActiveTrue(String expenseType);
    
    /**
     * 카테고리별 활성 반복 지출 조회
     */
    List<RecurringExpense> findByCategoryAndIsActiveTrue(String category);
    
    /**
     * 테넌트별 처리 예정인 반복 지출 조회 (테넌트 필터링)
     */
    @Query("SELECT re FROM RecurringExpense re WHERE re.tenantId = :tenantId AND re.nextDueDate <= :targetDate AND re.isActive = true")
    List<RecurringExpense> findByTenantIdAndNextDueDateLessThanEqualAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("targetDate") LocalDate targetDate);
    
    /**
     * @Deprecated - 🚨 위험: 모든 테넌트 처리 예정 지출 노출!
     */
    @Deprecated
    List<RecurringExpense> findByNextDueDateLessThanEqualAndIsActiveTrue(LocalDate targetDate);
    
    /**
     * 특정 기간 내 처리 예정인 반복 지출 조회
     */
    List<RecurringExpense> findByNextDueDateBetweenAndIsActiveTrue(LocalDate startDate, LocalDate endDate);
    
    /**
     * 자동 처리 설정된 반복 지출 조회
     */
    List<RecurringExpense> findByAutoProcessTrueAndIsActiveTrue();
    
    /**
     * 공급업체별 반복 지출 조회
     */
    List<RecurringExpense> findBySupplierNameAndIsActiveTrue(String supplierName);
    
    /**
     * 지출 유형별 통계
     */
    @Query("SELECT re.expenseType, COUNT(re), SUM(re.amount) " +
           "FROM RecurringExpense re " +
           "WHERE re.isActive = true " +
           "GROUP BY re.expenseType")
    List<Object[]> getStatisticsByExpenseType();
    
    /**
     * 월별 반복 지출 예상 금액
     */
    @Query("SELECT re.recurrenceType, COUNT(re), SUM(re.amount) " +
           "FROM RecurringExpense re " +
           "WHERE re.isActive = true " +
           "GROUP BY re.recurrenceType")
    List<Object[]> getStatisticsByRecurrenceType();
    
    /**
     * 처리 예정 알림 목록 (N일 후까지)
     */
    @Query("SELECT re FROM RecurringExpense re " +
           "WHERE re.isActive = true " +
           "AND re.nextDueDate BETWEEN :startDate AND :endDate " +
           "ORDER BY re.nextDueDate ASC")
    List<RecurringExpense> findUpcomingExpenses(LocalDate startDate, LocalDate endDate);
    
    /**
     * 만료 예정인 반복 지출 조회
     */
    @Query("SELECT re FROM RecurringExpense re " +
           "WHERE re.isActive = true " +
           "AND re.endDate IS NOT NULL " +
           "AND re.endDate <= :targetDate")
    List<RecurringExpense> findExpiringExpenses(LocalDate targetDate);
}
