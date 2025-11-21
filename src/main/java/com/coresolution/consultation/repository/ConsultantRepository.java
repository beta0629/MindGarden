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
public interface ConsultantRepository extends BaseRepository<Consultant, Long> {
    
    // === 전문분야별 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.specialty LIKE %:specialty% AND c.isDeleted = false")
    List<Consultant> findBySpecialtyContainingIgnoreCaseAndIsDeletedFalse(@Param("specialty") String specialty);
    
    // === 경력별 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.yearsOfExperience >= :experience AND c.isDeleted = false")
    List<Consultant> findByExperienceGreaterThanEqualAndIsDeletedFalse(@Param("experience") int experience);
    
    // === 평점별 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.averageRating >= :rating AND c.isDeleted = false")
    List<Consultant> findByAverageRatingGreaterThanEqualAndIsDeletedFalse(@Param("rating") double rating);
    
    // === 사용 가능한 상담사 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.isAvailable = true AND c.isDeleted = false")
    List<Consultant> findByIsAvailableTrueAndIsDeletedFalse();
    
    // === 삭제되지 않은 상담사 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.isDeleted = false")
    List<Consultant> findByIsDeletedFalse();
    
    // === 활성 상담사만 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.isDeleted = false AND c.isActive = true")
    List<Consultant> findActiveConsultants();
    
    // === 지점별 삭제되지 않은 상담사 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.branchCode = :branchCode AND c.isDeleted = false")
    List<Consultant> findByBranchCodeAndIsDeletedFalse(@Param("branchCode") String branchCode);
    
    // === 지점별 활성 상담사만 조회 ===
    @Query("SELECT c FROM Consultant c WHERE c.branchCode = :branchCode AND c.isDeleted = false AND c.isActive = true")
    List<Consultant> findActiveConsultantsByBranchCode(@Param("branchCode") String branchCode);
    
    // === BaseRepository 메서드 오버라이드 ===
    // Consultant 엔티티는 branchId 필드가 없음 (branchCode만 있음)
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 branchId를 무시하도록 함
    
    /**
     * 테넌트 ID로 활성 상담사 조회
     * Consultant 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 상담사 목록
     */
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Consultant> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 상담사 조회 (페이징)
     * Consultant 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 상담사 페이지
     */
    @Query("SELECT c FROM Consultant c WHERE c.tenantId = :tenantId AND c.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    org.springframework.data.domain.Page<Consultant> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, org.springframework.data.domain.Pageable pageable);
    
}
