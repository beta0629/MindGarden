package com.coresolution.core.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Tenant Repository
 * 테넌트 엔티티에 대한 데이터 접근 계층
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    
    /**
     * tenant_id로 테넌트 조회
     * 
     * @param tenantId 테넌트 UUID
     * @return 테넌트 Optional
     */
    Optional<Tenant> findByTenantId(String tenantId);
    
    /**
     * tenant_id로 삭제되지 않은 테넌트 조회
     * 
     * @param tenantId 테넌트 UUID
     * @return 테넌트 Optional
     */
    @Query("SELECT t FROM Tenant t WHERE t.tenantId = :tenantId AND t.isDeleted = false")
    Optional<Tenant> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    /**
     * tenant_id로 활성 테넌트 조회
     * 
     * @param tenantId 테넌트 UUID
     * @return 활성 테넌트 Optional
     */
    @Query("SELECT t FROM Tenant t WHERE t.tenantId = :tenantId AND t.status = 'ACTIVE' AND t.isDeleted = false")
    Optional<Tenant> findActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 업종 타입으로 테넌트 목록 조회
     * 
     * @param businessType 업종 타입
     * @return 테넌트 목록
     */
    List<Tenant> findByBusinessType(Tenant.BusinessType businessType);
    
    /**
     * 상태로 테넌트 목록 조회
     * 
     * @param status 테넌트 상태
     * @return 테넌트 목록
     */
    List<Tenant> findByStatus(Tenant.TenantStatus status);
    
    /**
     * 활성 테넌트 목록 조회
     * 
     * @return 활성 테넌트 목록
     */
    @Query("SELECT t FROM Tenant t WHERE t.status = 'ACTIVE' AND t.isDeleted = false ORDER BY t.name")
    List<Tenant> findAllActive();
    
    /**
     * tenant_id 존재 여부 확인
     * 
     * @param tenantId 테넌트 UUID
     * @return 존재 여부
     */
    boolean existsByTenantId(String tenantId);
}

