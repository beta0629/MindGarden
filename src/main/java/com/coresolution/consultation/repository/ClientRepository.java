package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
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
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
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

    /**
     * 비교 기준 시점(전일 0시 등) 이전에 생성된 내담자 수 (KPI 총 사용자 증감률 계산용)
     *
     * @param tenantId 테넌트 UUID
     * @param before 기준 시점 (미만)
     * @return 해당 시점 이전 생성·미삭제 내담자 수
     */
    @Query("SELECT COUNT(c) FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND c.createdAt < :before")
    long countByTenantIdAndIsDeletedFalseAndCreatedAtBefore(@Param("tenantId") String tenantId, @Param("before") LocalDateTime before);
    
    // === BaseRepository 메서드 오버라이드 ===
    // 브랜치 개념 제거: findAllByTenantIdAndBranchId 메서드는 Deprecated 처리됨 (표준화 2025-12-05)
    
    /**
     * 테넌트 ID로 활성 클라이언트 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 클라이언트 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantIdAndIsDeletedFalse(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (CAST(:branchId AS long) IS NULL OR 1=1)")
    List<Client> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 클라이언트 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 클라이언트 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link BaseRepository#findAllByTenantId(String, Pageable)}를 사용하세요.
     // 표준화 2025-12-07: branchCode 무시
     if (branchId != null) {
         log.warn("Deprecated 파라미터: branchId는 더 이상 사용하지 않음");
     }     // 표준화 2025-12-07: branchCode 무시
     if (branchId != null) {
         log.warn("Deprecated 파라미터: branchId는 더 이상 사용하지 않음");
     }     */
    @Deprecated
    @Query("SELECT c FROM Client c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (CAST(:branchId AS long) IS NULL OR 1=1)")
    org.springframework.data.domain.Page<Client> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, org.springframework.data.domain.Pageable pageable);
}