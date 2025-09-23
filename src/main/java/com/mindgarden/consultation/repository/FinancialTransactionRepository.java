package com.mindgarden.consultation.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.mindgarden.consultation.entity.FinancialTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 회계 거래 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {
    
    /**
     * 삭제되지 않은 모든 거래 조회
     */
    List<FinancialTransaction> findByIsDeletedFalse();
    
    /**
     * 거래 유형별 조회
     */
    List<FinancialTransaction> findByTransactionTypeAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType);
    
    /**
     * 카테고리별 조회
     */
    List<FinancialTransaction> findByCategoryAndIsDeletedFalse(String category);
    
    /**
     * 상태별 조회
     */
    List<FinancialTransaction> findByStatusAndIsDeletedFalse(
        FinancialTransaction.TransactionStatus status);
    
    /**
     * 기간별 조회
     */
    List<FinancialTransaction> findByTransactionDateBetweenAndIsDeletedFalse(
        LocalDate startDate, LocalDate endDate);
    
    /**
     * 거래 유형과 기간으로 조회
     */
    List<FinancialTransaction> findByTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType, LocalDate startDate, LocalDate endDate);
    
    /**
     * 승인 대기 중인 거래 조회
     */
    List<FinancialTransaction> findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(
        FinancialTransaction.TransactionStatus status);
    
    /**
     * 관련 엔티티로 조회
     */
    List<FinancialTransaction> findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
        Long relatedEntityId, String relatedEntityType);
    
    /**
     * 페이징 조회
     */
    Page<FinancialTransaction> findByIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(Pageable pageable);
    
    /**
     * 거래 유형별 페이징 조회
     */
    Page<FinancialTransaction> findByTransactionTypeAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        FinancialTransaction.TransactionType transactionType, Pageable pageable);
    
    /**
     * 카테고리별 페이징 조회
     */
    Page<FinancialTransaction> findByCategoryAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String category, Pageable pageable);
    
    /**
     * 기간별 페이징 조회
     */
    Page<FinancialTransaction> findByTransactionDateBetweenAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * 승인 대기 건수 조회
     */
    @Query("SELECT COUNT(f) FROM FinancialTransaction f WHERE f.status = 'PENDING' AND f.isDeleted = false")
    Long countPendingApprovals();
    
    /**
     * 기간별 총 수입 조회
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumIncomeByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 기간별 총 지출 조회
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumExpenseByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 카테고리별 수입 통계
     */
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getIncomeByCategory(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 카테고리별 지출 통계
     */
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getExpenseByCategory(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 월별 수입/지출 통계
     */
    @Query("SELECT YEAR(f.transactionDate) as year, MONTH(f.transactionDate) as month, " +
           "f.transactionType, COALESCE(SUM(f.amount), 0) " +
           "FROM FinancialTransaction f " +
           "WHERE f.status = 'COMPLETED' AND f.transactionDate BETWEEN :startDate AND :endDate " +
           "AND f.isDeleted = false " +
           "GROUP BY YEAR(f.transactionDate), MONTH(f.transactionDate), f.transactionType " +
           "ORDER BY year, month")
    List<Object[]> getMonthlyFinancialData(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 최근 거래 내역 조회
     */
    @Query("SELECT f FROM FinancialTransaction f WHERE f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC, f.createdAt DESC")
    List<FinancialTransaction> findRecentTransactions(Pageable pageable);
    
    /**
     * 급여 관련 거래 조회
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'SALARY' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findSalaryTransactions();
    
    /**
     * ERP 구매 관련 거래 조회
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'PURCHASE' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPurchaseTransactions();
    
    /**
     * 결제 관련 거래 조회
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'PAYMENT' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPaymentTransactions();
    
    /**
     * 특정 날짜의 거래 조회
     */
    List<FinancialTransaction> findByTransactionDateAndIsDeletedFalse(LocalDate transactionDate);
    
    /**
     * 중복 거래 방지를 위한 존재 여부 확인
     */
    boolean existsByRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
        Long relatedEntityId, String relatedEntityType, FinancialTransaction.TransactionType transactionType);
    
    /**
     * 거래 유형, 세부카테고리, 기간으로 조회 (부분 환불용)
     */
    List<FinancialTransaction> findByTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType, String subcategory, LocalDate startDate, LocalDate endDate);
}
