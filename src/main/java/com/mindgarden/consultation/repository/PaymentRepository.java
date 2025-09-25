package com.mindgarden.consultation.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 결제 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    /**
     * 결제 고유 ID로 결제 조회
     */
    Optional<Payment> findByPaymentIdAndIsDeletedFalse(String paymentId);
    
    /**
     * 주문 ID로 결제 조회
     */
    List<Payment> findByOrderIdAndIsDeletedFalse(String orderId);
    
    /**
     * 결제자 ID로 결제 목록 조회
     */
    Page<Payment> findByPayerIdAndIsDeletedFalse(Long payerId, Pageable pageable);
    
    /**
     * 수취인 ID로 결제 목록 조회
     */
    Page<Payment> findByRecipientIdAndIsDeletedFalse(Long recipientId, Pageable pageable);
    
    /**
     * 지점 ID로 결제 목록 조회
     */
    Page<Payment> findByBranchIdAndIsDeletedFalse(Long branchId, Pageable pageable);
    
    /**
     * 만료된 결제 데이터 조회 (파기용)
     */
    @Query("SELECT p.id, p.method FROM Payment p WHERE p.updatedAt < ?1")
    List<Object[]> findExpiredPaymentsForDestruction(LocalDateTime cutoffDate);
    
    /**
     * 결제 상태로 결제 목록 조회
     */
    Page<Payment> findByStatusAndIsDeletedFalse(Payment.PaymentStatus status, Pageable pageable);
    
    /**
     * 결제 방법으로 결제 목록 조회
     */
    Page<Payment> findByMethodAndIsDeletedFalse(Payment.PaymentMethod method, Pageable pageable);
    
    /**
     * 결제 대행사로 결제 목록 조회
     */
    Page<Payment> findByProviderAndIsDeletedFalse(Payment.PaymentProvider provider, Pageable pageable);
    
    /**
     * 날짜 범위로 결제 목록 조회
     */
    Page<Payment> findByCreatedAtBetweenAndIsDeletedFalse(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 결제자 ID와 날짜 범위로 결제 목록 조회
     */
    Page<Payment> findByPayerIdAndCreatedAtBetweenAndIsDeletedFalse(
            Long payerId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 지점 ID와 날짜 범위로 결제 목록 조회
     */
    Page<Payment> findByBranchIdAndCreatedAtBetweenAndIsDeletedFalse(
            Long branchId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 만료된 결제 조회
     */
    @Query("SELECT p FROM Payment p WHERE p.expiresAt < :currentTime AND p.status = 'PENDING' AND p.isDeleted = false")
    List<Payment> findExpiredPayments(@Param("currentTime") LocalDateTime currentTime);
    
    /**
     * 결제자별 총 결제 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.payerId = :payerId AND p.status = 'APPROVED' AND p.isDeleted = false")
    BigDecimal getTotalAmountByPayerId(@Param("payerId") Long payerId);
    
    /**
     * 지점별 총 결제 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.branchId = :branchId AND p.status = 'APPROVED' AND p.isDeleted = false")
    BigDecimal getTotalAmountByBranchId(@Param("branchId") Long branchId);
    
    /**
     * 가상계좌번호로 결제 조회
     */
    @Query("SELECT p FROM Payment p WHERE p.virtualAccountNumber = :virtualAccountNumber AND p.isDeleted = false")
    List<Payment> findByVirtualAccountNumberAndIsDeletedFalse(@Param("virtualAccountNumber") String virtualAccountNumber);
    
    /**
     * 날짜 범위별 총 결제 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.createdAt BETWEEN :startDate AND :endDate AND p.status = 'APPROVED' AND p.isDeleted = false")
    BigDecimal getTotalAmountByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 결제 상태별 건수 조회
     */
    @Query("SELECT CAST(p.status AS string), COUNT(p) FROM Payment p WHERE p.isDeleted = false GROUP BY p.status")
    List<Object[]> getPaymentCountByStatus();
    
    /**
     * 결제 방법별 건수 조회
     */
    @Query("SELECT CAST(p.method AS string), COUNT(p) FROM Payment p WHERE p.isDeleted = false GROUP BY p.method")
    List<Object[]> getPaymentCountByMethod();
    
    /**
     * 결제 대행사별 건수 조회
     */
    @Query("SELECT CAST(p.provider AS string), COUNT(p) FROM Payment p WHERE p.isDeleted = false GROUP BY p.provider")
    List<Object[]> getPaymentCountByProvider();
    
    /**
     * 월별 결제 통계 조회
     */
    @Query("SELECT YEAR(p.createdAt), MONTH(p.createdAt), COUNT(p), SUM(p.amount) " +
           "FROM Payment p WHERE p.status = 'APPROVED' AND p.isDeleted = false " +
           "AND p.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY YEAR(p.createdAt), MONTH(p.createdAt) " +
           "ORDER BY YEAR(p.createdAt), MONTH(p.createdAt)")
    List<Object[]> getMonthlyPaymentStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 지점별 월별 결제 통계 조회
     */
    @Query("SELECT p.branchId, YEAR(p.createdAt), MONTH(p.createdAt), COUNT(p), SUM(p.amount) " +
           "FROM Payment p WHERE p.status = 'APPROVED' AND p.isDeleted = false " +
           "AND p.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY p.branchId, YEAR(p.createdAt), MONTH(p.createdAt) " +
           "ORDER BY p.branchId, YEAR(p.createdAt), MONTH(p.createdAt)")
    List<Object[]> getBranchMonthlyPaymentStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 결제 존재 여부 확인 (중복 방지)
     */
    boolean existsByPaymentIdAndIsDeletedFalse(String paymentId);
    
    /**
     * 주문 ID로 승인된 결제 존재 여부 확인
     */
    boolean existsByOrderIdAndStatusAndIsDeletedFalse(String orderId, Payment.PaymentStatus status);
}
