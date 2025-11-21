package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 강좌 Repository
 * 학원 시스템의 강좌 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    /**
     * course_id로 조회
     */
    Optional<Course> findByCourseIdAndIsDeletedFalse(String courseId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<Course> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<Course> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 전체 지점 공통 강좌 조회 (branch_id가 NULL인 경우)
     */
    @Query("SELECT c FROM Course c WHERE c.tenantId = :tenantId AND c.branchId IS NULL AND c.isDeleted = false")
    List<Course> findCommonCoursesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * tenant_id와 활성 강좌만 조회
     */
    @Query("SELECT c FROM Course c WHERE c.tenantId = :tenantId AND c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC, c.name ASC")
    List<Course> findActiveCoursesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * tenant_id와 branch_id로 활성 강좌 조회
     */
    @Query("SELECT c FROM Course c WHERE c.tenantId = :tenantId AND (c.branchId = :branchId OR c.branchId IS NULL) AND c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC, c.name ASC")
    List<Course> findActiveCoursesByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 카테고리로 조회
     */
    List<Course> findByTenantIdAndCategoryAndIsActiveTrueAndIsDeletedFalse(String tenantId, String category);
    
    /**
     * 과목으로 조회
     */
    List<Course> findByTenantIdAndSubjectAndIsActiveTrueAndIsDeletedFalse(String tenantId, String subject);
    
    /**
     * course_id 존재 여부 확인
     */
    boolean existsByCourseIdAndIsDeletedFalse(String courseId);
}

