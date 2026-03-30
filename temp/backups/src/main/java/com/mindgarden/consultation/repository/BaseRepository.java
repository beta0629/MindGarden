package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.BaseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 모든 Repository의 기본 인터페이스
 * 공통 데이터 접근 메서드 정의
 * 
 * @author MindGarden
 * @version 1.0.0
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
    
    // ==================== 사용자별 조회 ====================
    

    

    
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
