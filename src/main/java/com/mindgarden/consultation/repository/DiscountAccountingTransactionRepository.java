package com.mindgarden.consultation.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.DiscountAccountingTransaction;
import com.mindgarden.consultation.enums.DiscountAccountingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 할인 회계 거래 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
public interface DiscountAccountingTransactionRepository extends JpaRepository<DiscountAccountingTransaction, Long> {
    
    // 매핑 ID로 조회
    Optional<DiscountAccountingTransaction> findByMappingId(Long mappingId);
    
    // 상태별 조회
    List<DiscountAccountingTransaction> findByStatus(DiscountAccountingStatus status);
    
    // 지점별 조회
    List<DiscountAccountingTransaction> findByBranchCode(String branchCode);
    
    // 지점별 상태별 조회
    List<DiscountAccountingTransaction> findByBranchCodeAndStatus(String branchCode, DiscountAccountingStatus status);
    
    // 기간별 조회
    List<DiscountAccountingTransaction> findByAppliedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // 환불 가능한 거래 조회
    @Query("SELECT d FROM DiscountAccountingTransaction d WHERE d.status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND') AND d.remainingAmount > 0")
    List<DiscountAccountingTransaction> findRefundableTransactions();
    
    // 부분 환불 가능한 거래 조회
    @Query("SELECT d FROM DiscountAccountingTransaction d WHERE d.status = 'PARTIAL_REFUND' AND d.remainingAmount > 0")
    List<DiscountAccountingTransaction> findPartialRefundableTransactions();
    
    // 전체 환불된 거래 조회
    @Query("SELECT d FROM DiscountAccountingTransaction d WHERE d.status = 'FULL_REFUND'")
    List<DiscountAccountingTransaction> findFullyRefundedTransactions();
    
    // 수정 가능한 거래 조회
    @Query("SELECT d FROM DiscountAccountingTransaction d WHERE d.status IN ('PENDING', 'APPLIED', 'CONFIRMED')")
    List<DiscountAccountingTransaction> findModifiableTransactions();
    
    // 취소 가능한 거래 조회
    @Query("SELECT d FROM DiscountAccountingTransaction d WHERE d.status IN ('PENDING', 'APPLIED', 'CONFIRMED')")
    List<DiscountAccountingTransaction> findCancellableTransactions();
    
    // 지점별 할인 통계
    @Query("SELECT SUM(d.discountAmount) FROM DiscountAccountingTransaction d WHERE d.branchCode = :branchCode AND d.status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND')")
    BigDecimal getTotalDiscountAmountByBranch(@Param("branchCode") String branchCode);
    
    // 지점별 환불 통계
    @Query("SELECT SUM(d.refundedAmount) FROM DiscountAccountingTransaction d WHERE d.branchCode = :branchCode AND d.status IN ('PARTIAL_REFUND', 'FULL_REFUND')")
    BigDecimal getTotalRefundedAmountByBranch(@Param("branchCode") String branchCode);
    
    // 지점별 순 할인 금액 (할인 - 환불)
    @Query("SELECT SUM(d.discountAmount - COALESCE(d.refundedAmount, 0)) FROM DiscountAccountingTransaction d WHERE d.branchCode = :branchCode AND d.status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND', 'FULL_REFUND')")
    BigDecimal getNetDiscountAmountByBranch(@Param("branchCode") String branchCode);
    
    // 할인 코드별 사용 횟수
    @Query("SELECT COUNT(d) FROM DiscountAccountingTransaction d WHERE d.discountCode = :discountCode AND d.status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND')")
    Long getUsageCountByDiscountCode(@Param("discountCode") String discountCode);
    
    // 기간별 할인 통계
    @Query("SELECT d.branchCode, SUM(d.discountAmount), SUM(COALESCE(d.refundedAmount, 0)), COUNT(d) " +
           "FROM DiscountAccountingTransaction d " +
           "WHERE d.appliedAt BETWEEN :startDate AND :endDate " +
           "AND d.status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND', 'FULL_REFUND') " +
           "GROUP BY d.branchCode")
    List<Object[]> getDiscountStatisticsByPeriod(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
