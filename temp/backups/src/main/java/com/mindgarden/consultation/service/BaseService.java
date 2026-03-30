package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.BaseEntity;
import com.mindgarden.consultation.repository.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 모든 Service의 기본 인터페이스
 * 공통 비즈니스 로직 메서드 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface BaseService<T extends BaseEntity, ID> {
    
    BaseRepository<T, ID> getRepository();
    
    // ==================== 기본 CRUD 메서드 ====================
    
    List<T> findAllActive();
    
    Page<T> findAllActive(Pageable pageable);
    
    Optional<T> findActiveById(ID id);
    
    T findActiveByIdOrThrow(ID id); // Throws EntityNotFoundException
    
    boolean existsActiveById(ID id);
    
    long countActive();
    
    T save(T entity);
    
    List<T> saveAll(List<T> entities);
    
    T update(T entity);
    
    T partialUpdate(ID id, T updateData);
    
    void softDeleteById(ID id);
    
    void hardDeleteById(ID id);
    
    void restoreById(ID id);
    
    // ==================== 삭제된 엔티티 관련 메서드 ====================
    
    List<T> findAllDeleted();
    
    long countDeleted();
    
    // ==================== 기간별 조회 메서드 ====================
    
    List<T> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<T> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // ==================== 최근 데이터 조회 메서드 ====================
    
    List<T> findRecentActive(int limit);
    
    List<T> findRecentlyUpdatedActive(int limit);
    
    // ==================== 통계 메서드 ====================
    
    Object[] getEntityStatistics();
    
    // ==================== 정리 메서드 ====================
    
    void cleanupOldDeleted(LocalDateTime cutoffDate);
    
    // ==================== 중복 검사 메서드 ====================
    
    boolean isDuplicateExcludingIdAll(ID excludeId, String fieldName, Object fieldValue, boolean includeDeleted);
    
    // ==================== 버전 관리 메서드 ====================
    
    Optional<T> findByIdAndVersion(ID id, Long version);
    

}
