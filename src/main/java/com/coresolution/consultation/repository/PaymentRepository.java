package com.coresolution.consultation.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public interface PaymentRepository extends BaseRepository<Payment, Long> {
    
    /**
     * 테넌트별 결제 고유 ID로 결제 조회 (테넌트 필터링)
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.paymentId = :paymentId AND p.isDeleted = false")
    Optional<Payment> findByTenantIdAndPaymentIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("paymentId") String paymentId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 결제 정보 노출!
     */
    @Deprecated
    Optional<Payment> findByPaymentIdAndIsDeletedFalse(String paymentId);
    
    /**
     * 테넌트별 주문 ID로 결제 조회 (테넌트 필터링)
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.orderId = :orderId AND p.isDeleted = false")
    List<Payment> findByTenantIdAndOrderIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("orderId") String orderId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 주문 결제 정보 노출!
     */
    @Deprecated
    List<Payment> findByOrderIdAndIsDeletedFalse(String orderId);
    
    /**
     * 테넌트별 결제자 ID로 결제 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.payerId = :payerId AND p.isDeleted = false")
    Page<Payment> findByTenantIdAndPayerIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("payerId") Long payerId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 결제자 결제 내역 노출!
     */
    @Deprecated
    Page<Payment> findByPayerIdAndIsDeletedFalse(Long payerId, Pageable pageable);
    
    /**
     * 테넌트별 수취인 ID로 결제 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.recipientId = :recipientId AND p.isDeleted = false")
    Page<Payment> findByTenantIdAndRecipientIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("recipientId") Long recipientId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 수취인 결제 내역 노출!
     */
    @Deprecated
    Page<Payment> findByRecipientIdAndIsDeletedFalse(Long recipientId, Pageable pageable);
    
    /**
     * 테넌트별 결제 목록 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param pageable 페이징 정보
     * @return 결제 페이지
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.isDeleted = false")
    Page<Payment> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId, Pageable pageable);
    
    /**
     * 지점 ID로 결제 목록 조회
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndIsDeletedFalse(String, Pageable)}를 사용하세요.
     */
    @Deprecated
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
     * 테넌트별 날짜 범위로 결제 목록 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param startDate 시작일
     * @param endDate 종료일
     * @param pageable 페이징 정보
     * @return 결제 페이지
     */
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.createdAt BETWEEN :startDate AND :endDate AND p.isDeleted = false")
    Page<Payment> findByTenantIdAndCreatedAtBetweenAndIsDeletedFalse(
            @Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
    
    /**
     * 지점 ID와 날짜 범위로 결제 목록 조회
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndCreatedAtBetweenAndIsDeletedFalse(String, LocalDateTime, LocalDateTime, Pageable)}를 사용하세요.
     */
    @Deprecated
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
     * 테넌트별 총 결제 금액 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @return 총 결제 금액
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tenantId = :tenantId AND p.status = 'APPROVED' AND p.isDeleted = false")
    BigDecimal getTotalAmountByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 지점별 총 결제 금액 조회
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #getTotalAmountByTenantId(String)}를 사용하세요.
     */
    @Deprecated
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
     * 테넌트별 월별 결제 통계 조회 (브랜치 개념 제거)
     * 
     * @param tenantId 테넌트 UUID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 월별 결제 통계 목록 [YEAR, MONTH, COUNT, SUM]
     */
    @Query("SELECT YEAR(p.createdAt), MONTH(p.createdAt), COUNT(p), SUM(p.amount) " +
           "FROM Payment p WHERE p.tenantId = :tenantId AND p.status = 'APPROVED' AND p.isDeleted = false " +
           "AND p.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY YEAR(p.createdAt), MONTH(p.createdAt) " +
           "ORDER BY YEAR(p.createdAt), MONTH(p.createdAt)")
    List<Object[]> getTenantMonthlyPaymentStatistics(@Param("tenantId") String tenantId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 지점별 월별 결제 통계 조회
     * 
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #getTenantMonthlyPaymentStatistics(String, LocalDateTime, LocalDateTime)}를 사용하세요.
     */
    @Deprecated
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
    
    // ==================== 통계 대시보드용 메서드 ====================
    
    /**
     * 승인된 결제 총 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'APPROVED' AND p.isDeleted = false")
    Long sumConfirmedAmount();
    
    /**
     * 특정 날짜 이후 승인된 결제 총 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'APPROVED' AND p.createdAt > ?1 AND p.isDeleted = false")
    Long sumConfirmedAmountByCreatedAtAfter(LocalDateTime dateTime);
    
    /**
     * 특정 날짜 이전 승인된 결제 총 금액 조회
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'APPROVED' AND p.createdAt < ?1 AND p.isDeleted = false")
    Long sumConfirmedAmountByCreatedAtBefore(LocalDateTime dateTime);
    
    // === BaseRepository 메서드 오버라이드 ===
    // 브랜치 개념 제거: findAllByTenantIdAndBranchId 메서드는 Deprecated 처리됨 (표준화 2025-12-05)
    
    /**
     * 테넌트 ID와 지점 ID로 활성 결제 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID
     * @return 활성 결제 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndIsDeletedFalse(String, Pageable)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.branchId = :branchId AND p.isDeleted = false")
    List<Payment> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID와 지점 ID로 활성 결제 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID
     * @param pageable 페이징 정보
     * @return 활성 결제 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndIsDeletedFalse(String, Pageable)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId AND p.branchId = :branchId AND p.isDeleted = false")
    Page<Payment> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
