package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.Consultant;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 데이터 접근 레이어
 */
@Repository
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
public interface ConsultantRepository extends BaseRepository<Consultant, Long> {
    
    // === 테넌트별 모든 상담사 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false")
    List<Consultant> findByTenantId(@Param("tenantId") String tenantId);
    
    // === 전문분야별 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.specialty LIKE %:specialty% AND c.isDeleted = false")
    List<Consultant> findByTenantIdAndSpecialtyContainingIgnoreCaseAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("specialty") String specialty);
    
    // @Deprecated - 보안 위험: 테넌트 필터링 없음
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.specialty LIKE %:specialty% AND c.isDeleted = false")
    List<Consultant> findBySpecialtyContainingIgnoreCaseAndIsDeletedFalse(@Param("specialty") String specialty);
    
    // === 경력별 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.yearsOfExperience >= :experience AND c.isDeleted = false")
    List<Consultant> findByTenantIdAndExperienceGreaterThanEqualAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("experience") int experience);
    
    // @Deprecated - 보안 위험: 테넌트 필터링 없음
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.yearsOfExperience >= :experience AND c.isDeleted = false")
    List<Consultant> findByExperienceGreaterThanEqualAndIsDeletedFalse(@Param("experience") int experience);
    
    // === 평점별 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.averageRating >= :rating AND c.isDeleted = false")
    List<Consultant> findByTenantIdAndAverageRatingGreaterThanEqualAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("rating") double rating);
    
    // @Deprecated - 보안 위험: 테넌트 필터링 없음
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.averageRating >= :rating AND c.isDeleted = false")
    List<Consultant> findByAverageRatingGreaterThanEqualAndIsDeletedFalse(@Param("rating") double rating);
    
    // === 사용 가능한 상담사 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isAvailable = true AND c.isDeleted = false")
    List<Consultant> findByTenantIdAndIsAvailableTrueAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    // @Deprecated - 보안 위험: 테넌트 필터링 없음  
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.isAvailable = true AND c.isDeleted = false")
    List<Consultant> findByIsAvailableTrueAndIsDeletedFalse();
    
    // === 삭제되지 않은 상담사 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false")  
    List<Consultant> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    // @Deprecated - 🚨 보안 위험: 모든 테넌트 데이터 노출!
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.isDeleted = false")
    List<Consultant> findByIsDeletedFalse();
    
    // === 활성 상담사만 조회 (테넌트 필터링) ===
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND c.isActive = true")
    List<Consultant> findActiveConsultantsByTenantId(@Param("tenantId") String tenantId);
    
    // @Deprecated - 🚨 보안 위험: 모든 테넌트 활성 상담사 노출!
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.isDeleted = false AND c.isActive = true")
    List<Consultant> findActiveConsultants();
    
    // === BaseRepository 메서드 오버라이드 ===
    // 브랜치 개념 제거: findAllByTenantIdAndBranchId 메서드는 Deprecated 처리됨 (표준화 2025-12-05)
    
    /**
     * 테넌트 ID로 활성 상담사 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 상담사 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Consultant> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 상담사 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 상담사 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantId(String)}와 페이징을 사용하세요.
     // 표준화 2025-12-07: branchCode 무시
     if (branchId != null) {
         log.warn("Deprecated 파라미터: branchId는 더 이상 사용하지 않음");
     }     // 표준화 2025-12-07: branchCode 무시
     if (branchId != null) {
         log.warn("Deprecated 파라미터: branchId는 더 이상 사용하지 않음");
     }     */
    @Deprecated
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    org.springframework.data.domain.Page<Consultant> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, org.springframework.data.domain.Pageable pageable);
    
}
