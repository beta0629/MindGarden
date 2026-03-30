package com.coresolution.core.repository;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 테넌트 PG 설정 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantPgConfigurationRepository extends JpaRepository<TenantPgConfiguration, Long> {
    
    /**
     * config_id로 조회
     */
    Optional<TenantPgConfiguration> findByConfigIdAndIsDeletedFalse(String configId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<TenantPgConfiguration> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 status로 조회
     */
    List<TenantPgConfiguration> findByTenantIdAndStatusAndIsDeletedFalse(
        String tenantId, 
        PgConfigurationStatus status
    );
    
    /**
     * tenant_id와 approval_status로 조회
     */
    List<TenantPgConfiguration> findByTenantIdAndApprovalStatusAndIsDeletedFalse(
        String tenantId, 
        ApprovalStatus approvalStatus
    );
    
    /**
     * 승인 대기 중인 PG 설정 목록 조회
     */
    @Query("SELECT c FROM TenantPgConfiguration c " +
           "WHERE c.approvalStatus = :approvalStatus " +
           "AND c.isDeleted = false " +
           "ORDER BY c.requestedAt ASC")
    List<TenantPgConfiguration> findPendingApprovals(@Param("approvalStatus") ApprovalStatus approvalStatus);
    
    /**
     * 승인 대기 중인 PG 설정 목록 조회 (tenant_id 필터링)
     */
    @Query("SELECT c FROM TenantPgConfiguration c " +
           "WHERE c.tenantId = :tenantId " +
           "AND c.approvalStatus = :approvalStatus " +
           "AND c.isDeleted = false " +
           "ORDER BY c.requestedAt ASC")
    List<TenantPgConfiguration> findPendingApprovalsByTenant(
        @Param("tenantId") String tenantId,
        @Param("approvalStatus") ApprovalStatus approvalStatus
    );
    
    /**
     * 승인 대기 중인 PG 설정 목록 조회 (pg_provider 필터링)
     */
    @Query("SELECT c FROM TenantPgConfiguration c " +
           "WHERE c.pgProvider = :pgProvider " +
           "AND c.approvalStatus = :approvalStatus " +
           "AND c.isDeleted = false " +
           "ORDER BY c.requestedAt ASC")
    List<TenantPgConfiguration> findPendingApprovalsByProvider(
        @Param("pgProvider") PgProvider pgProvider,
        @Param("approvalStatus") ApprovalStatus approvalStatus
    );
    
    /**
     * 활성화된 PG 설정 조회 (tenant_id별)
     */
    @Query("SELECT c FROM TenantPgConfiguration c " +
           "WHERE c.tenantId = :tenantId " +
           "AND c.status = :status " +
           "AND c.isDeleted = false " +
           "ORDER BY c.approvedAt DESC")
    List<TenantPgConfiguration> findActiveConfigurations(
        @Param("tenantId") String tenantId,
        @Param("status") PgConfigurationStatus status
    );
    
    /**
     * tenant_id와 pg_provider로 활성 설정 조회
     */
    Optional<TenantPgConfiguration> findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
        String tenantId,
        PgProvider pgProvider,
        PgConfigurationStatus status
    );
    
    /**
     * 존재 여부 확인 (config_id)
     */
    boolean existsByConfigIdAndIsDeletedFalse(String configId);
    
    /**
     * 존재 여부 확인 (tenant_id, pg_provider, status)
     */
    boolean existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
        String tenantId,
        PgProvider pgProvider,
        PgConfigurationStatus status
    );
}

