package com.coresolution.core.repository;

import com.coresolution.core.domain.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 사용자 역할 할당 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Long> {
    
    /**
     * 할당 ID로 조회
     */
    Optional<UserRoleAssignment> findByAssignmentIdAndIsDeletedFalse(String assignmentId);
    
    /**
     * 사용자 ID로 모든 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura WHERE ura.userId = ?1 AND ura.isDeleted = false")
    List<UserRoleAssignment> findByUserId(Long userId);
    
    /**
     * 사용자 ID와 테넌트 ID로 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 AND ura.tenantId = ?2 AND ura.isDeleted = false")
    List<UserRoleAssignment> findByUserIdAndTenantId(Long userId, String tenantId);
    
    /**
     * 사용자 ID, 테넌트 ID, 브랜치 ID로 활성 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 AND ura.tenantId = ?2 " +
           "AND (ura.branchId = ?3 OR ura.branchId IS NULL) " +
           "AND ura.isActive = true AND ura.isDeleted = false " +
           "AND (ura.effectiveFrom IS NULL OR ura.effectiveFrom <= ?4) " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo >= ?4) " +
           "ORDER BY ura.branchId NULLS LAST, ura.effectiveFrom DESC")
    List<UserRoleAssignment> findActiveByUserAndTenantAndBranch(
        Long userId, String tenantId, Long branchId, LocalDate date);
    
    /**
     * 사용자 ID, 테넌트 ID로 현재 활성 역할 조회 (브랜치별)
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 AND ura.tenantId = ?2 " +
           "AND ura.isActive = true AND ura.isDeleted = false " +
           "AND (ura.effectiveFrom IS NULL OR ura.effectiveFrom <= ?3) " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo >= ?3) " +
           "ORDER BY ura.branchId NULLS LAST, ura.effectiveFrom DESC")
    List<UserRoleAssignment> findActiveRolesByUserAndTenant(
        Long userId, String tenantId, LocalDate date);
    
    /**
     * 사용자 ID로 모든 테넌트의 활성 역할 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 " +
           "AND ura.isActive = true AND ura.isDeleted = false " +
           "AND (ura.effectiveFrom IS NULL OR ura.effectiveFrom <= ?2) " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo >= ?2) " +
           "ORDER BY ura.tenantId, ura.branchId NULLS LAST, ura.effectiveFrom DESC")
    List<UserRoleAssignment> findAllActiveRolesByUser(Long userId, LocalDate date);
    
    /**
     * 사용자 ID, 테넌트 ID, 브랜치 ID로 가장 우선순위가 높은 활성 역할 조회
     * (브랜치별 할당이 있으면 우선, 없으면 전체 브랜치 할당)
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 AND ura.tenantId = ?2 " +
           "AND ura.isActive = true AND ura.isDeleted = false " +
           "AND (ura.effectiveFrom IS NULL OR ura.effectiveFrom <= ?4) " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo >= ?4) " +
           "AND (ura.branchId = ?3 OR ura.branchId IS NULL) " +
           "ORDER BY CASE WHEN ura.branchId = ?3 THEN 0 ELSE 1 END, " +
           "         ura.effectiveFrom DESC " +
           "LIMIT 1")
    Optional<UserRoleAssignment> findActiveRoleByUserAndTenantAndBranch(
        Long userId, String tenantId, Long branchId, LocalDate date);
    
    /**
     * 테넌트 역할 ID로 할당된 사용자 수 조회
     */
    @Query("SELECT COUNT(ura) FROM UserRoleAssignment ura " +
           "WHERE ura.tenantRoleId = ?1 " +
           "AND ura.isActive = true AND ura.isDeleted = false " +
           "AND (ura.effectiveFrom IS NULL OR ura.effectiveFrom <= ?2) " +
           "AND (ura.effectiveTo IS NULL OR ura.effectiveTo >= ?2)")
    Long countActiveAssignmentsByTenantRoleId(String tenantRoleId, LocalDate date);
    
    /**
     * 테넌트 ID로 모든 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.tenantId = ?1 AND ura.isDeleted = false")
    List<UserRoleAssignment> findByTenantId(String tenantId);
    
    /**
     * 테넌트 역할 ID로 모든 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.tenantRoleId = ?1 AND ura.isDeleted = false")
    List<UserRoleAssignment> findByTenantRoleId(String tenantRoleId);
    
    /**
     * 브랜치 ID로 모든 할당 조회
     */
    @Query("SELECT ura FROM UserRoleAssignment ura " +
           "WHERE ura.branchId = ?1 AND ura.isDeleted = false")
    List<UserRoleAssignment> findByBranchId(Long branchId);
    
    /**
     * 사용자 ID, 테넌트 ID, 브랜치 ID, 역할 ID로 중복 확인
     */
    @Query("SELECT COUNT(ura) > 0 FROM UserRoleAssignment ura " +
           "WHERE ura.userId = ?1 AND ura.tenantId = ?2 " +
           "AND ura.tenantRoleId = ?3 " +
           "AND (ura.branchId = ?4 OR (?4 IS NULL AND ura.branchId IS NULL)) " +
           "AND ura.isDeleted = false")
    boolean existsByUserAndTenantAndRoleAndBranch(
        Long userId, String tenantId, String tenantRoleId, Long branchId);
}

