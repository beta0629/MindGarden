package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.Class;
import com.coresolution.core.domain.academy.Class.ClassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 반 Repository
 * 학원 시스템의 반(Class) 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Repository
public interface ClassRepository extends JpaRepository<Class, Long> {
    
    /**
     * class_id로 조회
     */
    Optional<Class> findByClassIdAndIsDeletedFalse(String classId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<Class> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<Class> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 course_id로 조회
     */
    List<Class> findByTenantIdAndCourseIdAndIsDeletedFalse(String tenantId, String courseId);
    
    /**
     * tenant_id와 branch_id와 course_id로 조회
     */
    List<Class> findByTenantIdAndBranchIdAndCourseIdAndIsDeletedFalse(String tenantId, Long branchId, String courseId);
    
    /**
     * 활성 반 조회
     */
    @Query("SELECT c FROM Class c WHERE c.tenantId = :tenantId AND c.isActive = true AND c.status = 'ACTIVE' AND c.isDeleted = false ORDER BY c.name ASC")
    List<Class> findActiveClassesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 모집 중인 반 조회
     */
    @Query("SELECT c FROM Class c WHERE c.tenantId = :tenantId AND c.branchId = :branchId AND c.status = 'RECRUITING' AND c.isActive = true AND c.isDeleted = false ORDER BY c.name ASC")
    List<Class> findRecruitingClassesByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 강사별 반 조회
     */
    List<Class> findByTenantIdAndBranchIdAndTeacherIdAndIsActiveTrueAndIsDeletedFalse(String tenantId, Long branchId, Long teacherId);
    
    /**
     * 상태별 반 조회
     */
    List<Class> findByTenantIdAndBranchIdAndStatusAndIsActiveTrueAndIsDeletedFalse(String tenantId, Long branchId, ClassStatus status);
    
    /**
     * 정원이 가득 차지 않은 반 조회
     */
    @Query("SELECT c FROM Class c WHERE c.tenantId = :tenantId AND c.branchId = :branchId AND c.status = 'RECRUITING' AND c.isActive = true AND c.isDeleted = false AND c.currentEnrollment < c.capacity ORDER BY c.name ASC")
    List<Class> findAvailableClassesByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 수업 기간 내 반 조회
     */
    @Query("SELECT c FROM Class c WHERE c.tenantId = :tenantId AND c.branchId = :branchId AND c.startDate <= :date AND c.endDate >= :date AND c.isActive = true AND c.isDeleted = false")
    List<Class> findClassesByDateRange(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, @Param("date") LocalDate date);
    
    /**
     * class_id 존재 여부 확인
     */
    boolean existsByClassIdAndIsDeletedFalse(String classId);
}

