package com.mindgarden.consultation.repository;

import java.util.List;
import com.mindgarden.consultation.entity.Consultant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 데이터 접근 레이어
 */
@Repository
public interface ConsultantRepository extends JpaRepository<Consultant, Long> {
    
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
    @Query("SELECT c FROM Consultant c WHERE c.isDeleted = false AND c.isActive = true")
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
    
}
