package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.AcademyInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 학원 청구서 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Repository
public interface AcademyInvoiceRepository extends JpaRepository<AcademyInvoice, Long> {
    
    /**
     * invoice_id로 조회
     */
    Optional<AcademyInvoice> findByInvoiceIdAndIsDeletedFalse(String invoiceId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<AcademyInvoice> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<AcademyInvoice> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * enrollment_id로 조회
     */
    List<AcademyInvoice> findByTenantIdAndEnrollmentIdAndIsDeletedFalse(String tenantId, String enrollmentId);
    
    /**
     * consumer_id로 조회
     */
    List<AcademyInvoice> findByTenantIdAndConsumerIdAndIsDeletedFalse(String tenantId, Long consumerId);
    
    /**
     * billing_schedule_id로 조회
     */
    List<AcademyInvoice> findByTenantIdAndBillingScheduleIdAndIsDeletedFalse(String tenantId, String billingScheduleId);
    
    /**
     * invoice_number로 조회
     */
    Optional<AcademyInvoice> findByTenantIdAndInvoiceNumberAndIsDeletedFalse(String tenantId, String invoiceNumber);
    
    /**
     * 상태별 조회
     */
    List<AcademyInvoice> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, AcademyInvoice.InvoiceStatus status);
    
    /**
     * 납기일이 지난 미결제 청구서 조회
     */
    @Query("SELECT i FROM AcademyInvoice i WHERE i.tenantId = :tenantId AND i.dueDate < :date AND i.status NOT IN ('PAID', 'CANCELLED') AND i.isDeleted = false")
    List<AcademyInvoice> findOverdueInvoices(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * invoice_id 존재 여부 확인
     */
    boolean existsByInvoiceIdAndIsDeletedFalse(String invoiceId);
}

