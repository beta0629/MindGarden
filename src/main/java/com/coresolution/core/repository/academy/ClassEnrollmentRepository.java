package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.ClassEnrollment;
import com.coresolution.core.domain.academy.ClassEnrollment.EnrollmentStatus;
import com.coresolution.core.domain.academy.ClassEnrollment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 수강 등록 Repository
 * 학원 시스템의 수강 등록 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Repository
public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {
    
    /**
     * enrollment_id로 조회
     */
    Optional<ClassEnrollment> findByEnrollmentIdAndIsDeletedFalse(String enrollmentId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<ClassEnrollment> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<ClassEnrollment> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 class_id로 조회
     */
    List<ClassEnrollment> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, String classId);
    
    /**
     * tenant_id와 consumer_id로 조회
     */
    List<ClassEnrollment> findByTenantIdAndConsumerIdAndIsDeletedFalse(String tenantId, Long consumerId);
    
    /**
     * 활성 수강 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.status = 'ACTIVE' AND e.isActive = true AND e.isDeleted = false ORDER BY e.enrollmentDate DESC")
    List<ClassEnrollment> findActiveEnrollmentsByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 수강생별 활성 수강 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.consumerId = :consumerId AND e.status = 'ACTIVE' AND e.isActive = true AND e.isDeleted = false ORDER BY e.enrollmentDate DESC")
    List<ClassEnrollment> findActiveEnrollmentsByConsumerId(@Param("tenantId") String tenantId, @Param("consumerId") Long consumerId);
    
    /**
     * 반별 수강 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.classId = :classId AND e.isActive = true AND e.isDeleted = false ORDER BY e.enrollmentDate ASC")
    List<ClassEnrollment> findEnrollmentsByClassId(@Param("tenantId") String tenantId, @Param("classId") String classId);
    
    /**
     * 상태별 수강 등록 조회
     */
    List<ClassEnrollment> findByTenantIdAndBranchIdAndStatusAndIsActiveTrueAndIsDeletedFalse(String tenantId, Long branchId, EnrollmentStatus status);
    
    /**
     * 결제 상태별 수강 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.branchId = :branchId AND e.paymentStatus = :paymentStatus AND e.isActive = true AND e.isDeleted = false ORDER BY e.enrollmentDate DESC")
    List<ClassEnrollment> findEnrollmentsByPaymentStatus(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, @Param("paymentStatus") PaymentStatus paymentStatus);
    
    /**
     * 결제 대기 중인 수강 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.branchId = :branchId AND e.paymentStatus = 'PENDING' AND e.isActive = true AND e.isDeleted = false ORDER BY e.enrollmentDate ASC")
    List<ClassEnrollment> findPendingPaymentEnrollments(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 수강 기간 내 등록 조회
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.startDate <= :date AND (e.endDate IS NULL OR e.endDate >= :date) AND e.status = 'ACTIVE' AND e.isActive = true AND e.isDeleted = false")
    List<ClassEnrollment> findEnrollmentsByDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * enrollment_id 존재 여부 확인
     */
    boolean existsByEnrollmentIdAndIsDeletedFalse(String enrollmentId);
    
    /**
     * 반별 수강 등록 수 카운트
     */
    @Query("SELECT COUNT(e) FROM ClassEnrollment e WHERE e.tenantId = :tenantId AND e.classId = :classId AND e.status = 'ACTIVE' AND e.isActive = true AND e.isDeleted = false")
    Long countActiveEnrollmentsByClassId(@Param("tenantId") String tenantId, @Param("classId") String classId);
}

