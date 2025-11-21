package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 지점 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Repository
public interface BranchRepository extends BaseRepository<Branch, Long> {
    
    // === 기본 조회 메서드 ===
    
    /**
     * 지점 코드로 조회
     */
    Optional<Branch> findByBranchCodeAndIsDeletedFalse(String branchCode);
    
    /**
     * 지점명으로 조회
     */
    List<Branch> findByBranchNameContainingAndIsDeletedFalseOrderByBranchName(String branchName);
    
    /**
     * 활성 지점만 조회
     */
    List<Branch> findByBranchStatusAndIsDeletedFalseOrderByBranchName(Branch.BranchStatus status);
    
    /**
     * 모든 활성 지점 조회 (삭제되지 않은 모든 지점)
     */
    List<Branch> findByIsDeletedFalseOrderByBranchName();
    
    /**
     * 지점 유형별 조회
     */
    List<Branch> findByBranchTypeAndIsDeletedFalseOrderByBranchName(Branch.BranchType type);
    
    /**
     * 상위 지점으로 조회 (하위 지점들)
     */
    List<Branch> findByParentBranchAndIsDeletedFalseOrderByBranchName(Branch parentBranch);
    
    /**
     * 본점들 조회 (상위 지점이 없는 지점들)
     */
    List<Branch> findByParentBranchIsNullAndIsDeletedFalseOrderByBranchName();
    
    /**
     * 지점장으로 조회
     */
    List<Branch> findByManagerAndIsDeletedFalse(User manager);
    
    // === 페이징 조회 메서드 ===
    
    /**
     * 모든 활성 지점 페이징 조회
     */
    Page<Branch> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * 지점 상태별 페이징 조회
     */
    Page<Branch> findByBranchStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            Branch.BranchStatus status, Pageable pageable);
    
    /**
     * 지점 유형별 페이징 조회
     */
    Page<Branch> findByBranchTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Branch.BranchType type, Pageable pageable);
    
    // === 검색 메서드 ===
    
    /**
     * 지점명 또는 주소로 검색
     */
    @Query("SELECT b FROM Branch b WHERE b.isDeleted = false AND " +
           "(LOWER(b.branchName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.addressDetail) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.branchName")
    List<Branch> searchByKeyword(@Param("keyword") String keyword);
    
    /**
     * 지점명 또는 주소로 페이징 검색
     */
    @Query("SELECT b FROM Branch b WHERE b.isDeleted = false AND " +
           "(LOWER(b.branchName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.addressDetail) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.branchName")
    Page<Branch> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    // === 통계 메서드 ===
    
    /**
     * 지점 상태별 개수 조회
     */
    @Query("SELECT b.branchStatus, COUNT(b) FROM Branch b WHERE b.isDeleted = false GROUP BY b.branchStatus")
    List<Object[]> countByBranchStatus();
    
    /**
     * 지점 유형별 개수 조회
     */
    @Query("SELECT b.branchType, COUNT(b) FROM Branch b WHERE b.isDeleted = false GROUP BY b.branchType")
    List<Object[]> countByBranchType();
    
    /**
     * 활성 지점 수 조회
     */
    long countByBranchStatusAndIsDeletedFalse(Branch.BranchStatus status);
    
    /**
     * 모든 활성 지점 수 조회
     */
    long countByIsDeletedFalse();
    
    /**
     * 지점별 상담사 수 조회
     */
    @Query("SELECT b.id, b.branchName, COUNT(u) FROM Branch b " +
           "LEFT JOIN User u ON u.branch = b AND u.isDeleted = false AND u.role = 'CONSULTANT' " +
           "WHERE b.isDeleted = false GROUP BY b.id, b.branchName ORDER BY b.branchName")
    List<Object[]> countConsultantsByBranch();
    
    /**
     * 지점별 내담자 수 조회
     */
    @Query("SELECT b.id, b.branchName, COUNT(u) FROM Branch b " +
           "LEFT JOIN User u ON u.branch = b AND u.isDeleted = false AND u.role = 'CLIENT' " +
           "WHERE b.isDeleted = false GROUP BY b.id, b.branchName ORDER BY b.branchName")
    List<Object[]> countClientsByBranch();
    
    // === 유효성 검사 메서드 ===
    
    /**
     * 지점 코드 중복 확인
     */
    boolean existsByBranchCodeAndIsDeletedFalse(String branchCode);
    
    /**
     * 특정 지점 제외하고 지점 코드 중복 확인
     */
    boolean existsByBranchCodeAndIdNotAndIsDeletedFalse(String branchCode, Long id);
    
    /**
     * 지점명 중복 확인 (동일한 상위 지점 내에서)
     */
    boolean existsByBranchNameAndParentBranchAndIsDeletedFalse(String branchName, Branch parentBranch);
    
    /**
     * 특정 지점 제외하고 지점명 중복 확인
     */
    boolean existsByBranchNameAndParentBranchAndIdNotAndIsDeletedFalse(
            String branchName, Branch parentBranch, Long id);
    
    // === 관계 조회 메서드 ===
    
    /**
     * 지점의 직접적인 하위 지점 조회 (1단계만)
     */
    List<Branch> findByParentBranchIdAndIsDeletedFalseOrderByBranchName(@Param("branchId") Long branchId);
    
    /**
     * 지점의 상위 지점 조회 (1단계만)
     */
    @Query("SELECT b.parentBranch FROM Branch b WHERE b.id = :branchId AND b.parentBranch IS NOT NULL AND b.isDeleted = false")
    Optional<Branch> findParentBranch(@Param("branchId") Long branchId);
    
    // === 관리자 메서드 ===
    
    /**
     * 지점장이 없는 지점들 조회
     */
    List<Branch> findByManagerIsNullAndIsDeletedFalseOrderByBranchName();
    
    /**
     * 최대 수용 인원을 초과한 지점들 조회
     */
    @Query("SELECT b FROM Branch b WHERE b.isDeleted = false AND " +
           "(SELECT COUNT(u) FROM User u WHERE u.branch = b AND u.role = 'CONSULTANT' AND u.isDeleted = false) > b.maxConsultants")
    List<Branch> findBranchesExceedingConsultantLimit();
    
    @Query("SELECT b FROM Branch b WHERE b.isDeleted = false AND " +
           "(SELECT COUNT(u) FROM User u WHERE u.branch = b AND u.role = 'CLIENT' AND u.isDeleted = false) > b.maxClients")
    List<Branch> findBranchesExceedingClientLimit();
    
    // === BaseRepository 메서드 오버라이드 ===
    // Branch 엔티티는 자기 자신이므로 branchId 필드가 없음
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 Branch의 경우 id를 사용하도록 함
    
    /**
     * 테넌트 ID와 지점 ID로 활성 지점 조회
     * Branch 엔티티는 자기 자신이므로 id를 사용
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (Branch의 경우 id와 동일)
     * @return 활성 지점 목록
     */
    @Query("SELECT b FROM Branch b WHERE b.tenantId = :tenantId AND b.id = :branchId AND b.isDeleted = false")
    List<Branch> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID와 지점 ID로 활성 지점 조회 (페이징)
     * Branch 엔티티는 자기 자신이므로 id를 사용
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (Branch의 경우 id와 동일)
     * @param pageable 페이징 정보
     * @return 활성 지점 페이지
     */
    @Query("SELECT b FROM Branch b WHERE b.tenantId = :tenantId AND b.id = :branchId AND b.isDeleted = false")
    Page<Branch> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
