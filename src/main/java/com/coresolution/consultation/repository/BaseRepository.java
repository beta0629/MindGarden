package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.BaseEntity;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

/**
 * 모든 Repository의 기본 인터페이스
 * 공통 데이터 접근 메서드 정의
 * 테넌트 필터링 기능 포함
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@NoRepositoryBean
public interface BaseRepository<T extends BaseEntity, ID> extends JpaRepository<T, ID> {
    
    // ==================== 활성 상태 엔티티 조회 ====================
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    List<T> findAllActive();
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    Page<T> findAllActive(Pageable pageable);
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = ?1 AND e.isDeleted = false")
    Optional<T> findActiveById(ID id);
    
    @Query("SELECT COUNT(e) FROM #{#entityName} e WHERE e.isDeleted = false")
    long countActive();
    
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM #{#entityName} e WHERE e.id = ?1 AND e.isDeleted = false")
    boolean existsActiveById(ID id);
    
    // ==================== 삭제된 엔티티 조회 ====================
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = true")
    List<T> findAllDeleted();
    
    @Query("SELECT COUNT(e) FROM #{#entityName} e WHERE e.isDeleted = true")
    long countDeleted();
    
    // ==================== 기간별 조회 ====================
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.createdAt BETWEEN ?1 AND ?2 AND e.isDeleted = false")
    List<T> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.updatedAt BETWEEN ?1 AND ?2 AND e.isDeleted = false")
    List<T> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // ==================== 최근 데이터 조회 ====================
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false ORDER BY e.createdAt DESC")
    List<T> findRecentActive(Pageable pageable);
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false ORDER BY e.updatedAt DESC")
    List<T> findRecentlyUpdatedActive(Pageable pageable);
    
    default List<T> findRecentActive(int limit) {
        return findRecentActive(Pageable.ofSize(limit));
    }
    
    default List<T> findRecentlyUpdatedActive(int limit) {
        return findRecentlyUpdatedActive(Pageable.ofSize(limit));
    }
    
    // ==================== 테넌트 필터링 조회 ====================
    
    /**
     * 테넌트 ID로 활성 엔티티 조회
     * 
     * @param tenantId 테넌트 UUID
     * @return 활성 엔티티 목록
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.isDeleted = false")
    List<T> findAllByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트 ID로 활성 엔티티 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param pageable 페이징 정보
     * @return 활성 엔티티 페이지
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.isDeleted = false")
    Page<T> findAllByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    /**
     * 테넌트 ID와 엔티티 ID로 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param id 엔티티 ID
     * @return 엔티티 Optional
     */
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.id = :id AND e.isDeleted = false")
    Optional<T> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") ID id);
    
    /**
     * 테넌트 ID로 활성 엔티티 개수 조회
     * 
     * @param tenantId 테넌트 UUID
     * @return 활성 엔티티 개수
     */
    @Query("SELECT COUNT(e) FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.isDeleted = false")
    long countByTenantId(@Param("tenantId") String tenantId);
    
    // findAllByTenantIdAndBranchId 메서드는 제거됨
    // branchId 필드가 있는 엔티티의 Repository에서만 구현하세요
    // 예: PaymentRepository, AccountRepository 등
    
    // ==================== 테넌트 컨텍스트 자동 적용 메서드 ====================
    
    /**
     * 현재 테넌트 컨텍스트의 활성 엔티티 조회
     * TenantContextHolder에서 tenantId를 자동으로 가져옴
     * 
     * @return 현재 테넌트의 활성 엔티티 목록
     */
    default List<T> findAllActiveByCurrentTenant() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return findAllByTenantId(tenantId);
        }
        // 테넌트 컨텍스트가 없으면 전체 조회 (HQ 관리자용)
        return findAllActive();
    }
    
    /**
     * 현재 테넌트 컨텍스트의 활성 엔티티 조회 (페이징)
     * 
     * @param pageable 페이징 정보
     * @return 현재 테넌트의 활성 엔티티 페이지
     */
    default Page<T> findAllActiveByCurrentTenant(Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return findAllByTenantId(tenantId, pageable);
        }
        // 테넌트 컨텍스트가 없으면 전체 조회 (HQ 관리자용)
        return findAllActive(pageable);
    }
    
    /**
     * 현재 테넌트 컨텍스트의 엔티티 조회 (ID로)
     * 
     * @param id 엔티티 ID
     * @return 엔티티 Optional
     */
    default Optional<T> findActiveByIdAndCurrentTenant(ID id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return findByTenantIdAndId(tenantId, id);
        }
        // 테넌트 컨텍스트가 없으면 일반 조회 (HQ 관리자용)
        return findActiveById(id);
    }
    
    /**
     * 현재 테넌트 컨텍스트의 활성 엔티티 개수 조회
     * 
     * @return 현재 테넌트의 활성 엔티티 개수
     */
    default long countActiveByCurrentTenant() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            return countByTenantId(tenantId);
        }
        // 테넌트 컨텍스트가 없으면 전체 개수 (HQ 관리자용)
        return countActive();
    }
    
    // ==================== 통계 ====================
    
    @Query("SELECT COUNT(e), COUNT(CASE WHEN e.isDeleted = true THEN 1 END), COUNT(CASE WHEN e.isDeleted = false THEN 1 END) FROM #{#entityName} e")
    Object[] getEntityStatistics();
    
    // ==================== 정리 ====================
    
    @Query("DELETE FROM #{#entityName} e WHERE e.isDeleted = true AND e.deletedAt < ?1")
    void cleanupOldDeleted(LocalDateTime cutoffDate);
    
    // ==================== 중복 검사 ====================
    
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM #{#entityName} e WHERE e.isDeleted = false AND e.id != ?1 AND e.id IS NOT NULL")
    boolean isDuplicateExcludingId(ID excludeId, String fieldName, Object fieldValue);
    
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM #{#entityName} e WHERE e.id != ?1 AND e.id IS NOT NULL")
    boolean isDuplicateExcludingIdAll(ID excludeId, String fieldName, Object fieldValue, boolean includeDeleted);
    
    // ==================== 버전 관리 ====================
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = ?1 AND e.version = ?2")
    Optional<T> findByIdAndVersion(ID id, Long version);
    
    // ==================== 소프트 삭제 ====================
    
    @Query("UPDATE #{#entityName} e SET e.isDeleted = true, e.deletedAt = ?2, e.version = e.version + 1 WHERE e.id = ?1")
    void softDeleteById(ID id, LocalDateTime deletedAt);
    
    @Query("UPDATE #{#entityName} e SET e.isDeleted = false, e.deletedAt = null, e.version = e.version + 1 WHERE e.id = ?1")
    void restoreById(ID id);
}
