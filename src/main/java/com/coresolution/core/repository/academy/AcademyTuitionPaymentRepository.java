package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.AcademyTuitionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 학원 수강료 결제 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Repository
public interface AcademyTuitionPaymentRepository extends JpaRepository<AcademyTuitionPayment, Long> {
    
    /**
     * payment_id로 조회
     */
    Optional<AcademyTuitionPayment> findByPaymentIdAndIsDeletedFalse(String paymentId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<AcademyTuitionPayment> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<AcademyTuitionPayment> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * invoice_id로 조회
     */
    List<AcademyTuitionPayment> findByTenantIdAndInvoiceIdAndIsDeletedFalse(String tenantId, String invoiceId);
    
    /**
     * enrollment_id로 조회
     */
    List<AcademyTuitionPayment> findByTenantIdAndEnrollmentIdAndIsDeletedFalse(String tenantId, String enrollmentId);
    
    /**
     * consumer_id로 조회
     */
    List<AcademyTuitionPayment> findByTenantIdAndConsumerIdAndIsDeletedFalse(String tenantId, Long consumerId);
    
    /**
     * 상태별 조회
     */
    List<AcademyTuitionPayment> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, AcademyTuitionPayment.PaymentStatus status);
    
    /**
     * 결제 완료된 결제 조회
     */
    @Query("SELECT p FROM AcademyTuitionPayment p WHERE p.tenantId = :tenantId AND p.status = 'COMPLETED' AND p.isDeleted = false")
    List<AcademyTuitionPayment> findCompletedPayments(@Param("tenantId") String tenantId);
    
    /**
     * 기간별 결제 조회
     */
    @Query("SELECT p FROM AcademyTuitionPayment p WHERE p.tenantId = :tenantId AND DATE(p.paidAt) BETWEEN :startDate AND :endDate AND p.isDeleted = false")
    List<AcademyTuitionPayment> findPaymentsByDateRange(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * payment_id 존재 여부 확인
     */
    boolean existsByPaymentIdAndIsDeletedFalse(String paymentId);
}

