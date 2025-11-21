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
     * @param businessType 업종 타입 (String)
     * @return 테넌트 목록
     */
    List<Tenant> findByBusinessType(String businessType);
    
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
    
    /**
     * 테넌트명으로 테넌트 조회
     * 
     * @param name 테넌트명
     * @return 테넌트 Optional
     */
    @Query("SELECT t FROM Tenant t WHERE t.name = :name AND t.isDeleted = false")
    Optional<Tenant> findByNameAndIsDeletedFalse(@Param("name") String name);
    
    /**
     * 연락 이메일로 테넌트 조회 (이메일 중복 확인용)
     * 
     * @param contactEmail 연락 이메일
     * @return 테넌트 목록
     */
    @Query("SELECT t FROM Tenant t WHERE LOWER(t.contactEmail) = LOWER(:contactEmail) AND t.isDeleted = false")
    List<Tenant> findByContactEmailIgnoreCase(@Param("contactEmail") String contactEmail);
    
    /**
     * 이메일로 테넌트 존재 여부 확인 (contact_email만 확인)
     * 
     * @param email 이메일
     * @return 존재 여부
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Tenant t WHERE LOWER(t.contactEmail) = LOWER(:email) AND t.isDeleted = false")
    boolean existsByEmail(@Param("email") String email);
    
    /**
     * 이메일로 활성 테넌트 존재 여부 확인 (contact_email, status = ACTIVE)
     * 테넌트 생성 시 중복 체크용
     * 
     * @param email 이메일
     * @return 존재 여부
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Tenant t WHERE LOWER(t.contactEmail) = LOWER(:email) AND t.status = 'ACTIVE' AND t.isDeleted = false")
    boolean existsActiveByContactEmail(@Param("email") String email);
    
    /**
     * 연락 이메일로 활성 테넌트 조회 (테넌트 생성 시 중복 체크용)
     * 
     * @param contactEmail 연락 이메일
     * @return 활성 테넌트 목록
     */
    @Query("SELECT t FROM Tenant t WHERE LOWER(t.contactEmail) = LOWER(:contactEmail) AND t.status = 'ACTIVE' AND t.isDeleted = false")
    List<Tenant> findActiveByContactEmailIgnoreCase(@Param("contactEmail") String contactEmail);
    
    /**
     * 연락 이메일로 삭제된 테넌트 조회 (복구용)
     * 
     * @param contactEmail 연락 이메일
     * @return 삭제된 테넌트 목록 (최신순)
     */
    @Query("SELECT t FROM Tenant t WHERE LOWER(t.contactEmail) = LOWER(:contactEmail) AND t.isDeleted = true ORDER BY t.deletedAt DESC")
    List<Tenant> findDeletedByContactEmailIgnoreCase(@Param("contactEmail") String contactEmail);
    
    /**
     * 업종 타입으로 삭제되지 않은 테넌트 수 조회
     * 
     * @param businessType 업종 타입
     * @return 테넌트 수
     */
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.businessType = :businessType AND t.isDeleted = false")
    long countByBusinessTypeAndIsDeletedFalse(@Param("businessType") String businessType);
    
    /**
     * tenant_id로 시작하는 삭제되지 않은 테넌트 수 조회
     * 
     * @param prefix tenant_id 접두사
     * @return 테넌트 수
     */
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.tenantId LIKE :prefix% AND t.isDeleted = false")
    long countByTenantIdStartingWithAndIsDeletedFalse(@Param("prefix") String prefix);
}

