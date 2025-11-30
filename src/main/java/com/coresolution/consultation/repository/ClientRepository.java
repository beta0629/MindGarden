package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Client;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 클라이언트 리포지토리
 * BaseRepository를 상속하여 테넌트 필터링 지원
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-05
 */
@Repository
public interface ClientRepository extends BaseRepository<Client, Long> {
    
    // === tenantId 필터링 메서드 (권장) ===
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.email = :email AND c.isDeleted = false")
    Optional<Client> findByTenantIdAndEmailAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("email") String email);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false")
    List<Client> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isEmergencyContact = :isEmergencyContact AND c.isDeleted = false")
    List<Client> findByTenantIdAndIsEmergencyContactAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("isEmergencyContact") Boolean isEmergencyContact);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.name LIKE %:name% AND c.isDeleted = false")
    List<Client> findByTenantIdAndNameContaining(@Param("tenantId") String tenantId, @Param("name") String name);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.phone LIKE %:phone% AND c.isDeleted = false")
    List<Client> findByTenantIdAndPhoneContaining(@Param("tenantId") String tenantId, @Param("phone") String phone);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.gender = :gender AND c.isDeleted = false")
    List<Client> findByTenantIdAndGender(@Param("tenantId") String tenantId, @Param("gender") String gender);
    
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.preferredLanguage = :language AND c.isDeleted = false")
    List<Client> findByTenantIdAndPreferredLanguage(@Param("tenantId") String tenantId, @Param("language") String language);
    
    // === @Deprecated: tenantId 없는 메서드 (하위 호환성) ===
    @Deprecated
    Optional<Client> findByEmailAndIsDeletedFalse(String email);
    
    @Deprecated
    List<Client> findByIsDeletedFalse();
    
    @Deprecated
    List<Client> findByIsEmergencyContactAndIsDeletedFalse(Boolean isEmergencyContact);
    
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.name LIKE %:name% AND c.isDeleted = false")
    List<Client> findByNameContaining(@Param("name") String name);
    
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.phone LIKE %:phone% AND c.isDeleted = false")
    List<Client> findByPhoneContaining(@Param("phone") String phone);
    
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.gender = :gender AND c.isDeleted = false")
    List<Client> findByGender(@Param("gender") String gender);
    
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.preferredLanguage = :language AND c.isDeleted = false")
    List<Client> findByPreferredLanguage(@Param("language") String language);
    
    // === BaseRepository 메서드 오버라이드 ===
    // Client 엔티티는 branchId 필드가 없음 (branchCode만 있음)
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 branchId를 무시하도록 함
    
    /**
     * 테넌트 ID로 활성 클라이언트 조회
     * Client 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 클라이언트 목록
     */
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Client> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 클라이언트 조회 (페이징)
     * Client 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 클라이언트 페이지
     */
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    org.springframework.data.domain.Page<Client> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, org.springframework.data.domain.Pageable pageable);
}