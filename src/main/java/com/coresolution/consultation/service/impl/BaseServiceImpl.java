package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.BaseEntity;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.BaseRepository;
import com.coresolution.consultation.service.BaseService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

/**
 * BaseService의 기본 구현체
 * 공통 비즈니스 로직을 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Transactional
public abstract class BaseServiceImpl<T extends BaseEntity, ID> implements BaseService<T, ID> {
    
    @Override
    public abstract BaseRepository<T, ID> getRepository();
    
    /**
     * 현재 컨텍스트의 tenantId를 반환한다. null 또는 빈 문자열이면 예외를 던진다.
     *
     * @return tenantId (null이 아님)
     * @throws IllegalStateException tenantId가 없을 때
     */
    private String ensureTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException("tenantId는 필수입니다. 테넌트 정보가 없습니다.");
        }
        return tenantId;
    }
    
    // ==================== 기본 CRUD 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findAllActive() {
        String tenantId = ensureTenantId();
        return getRepository().findAllActiveByTenantId(tenantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<T> findAllActive(Pageable pageable) {
        String tenantId = ensureTenantId();
        return getRepository().findAllActiveByTenantId(tenantId, pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<T> findActiveById(ID id) {
        String tenantId = ensureTenantId();
        return getRepository().findByTenantIdAndId(tenantId, id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public T findActiveByIdOrThrow(ID id) {
        return findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("엔티티를 찾을 수 없습니다. ID: " + id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean existsActiveById(ID id) {
        String tenantId = ensureTenantId();
        return getRepository().findByTenantIdAndId(tenantId, id).isPresent();
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countActive() {
        String tenantId = ensureTenantId();
        return getRepository().countByTenantId(tenantId);
    }
    
    @Override
    public T save(T entity) {
        beforeSave(entity);
        validateEntity(entity);
        validateBusinessRules(entity);
        
        T savedEntity = getRepository().save(entity);
        
        afterSave(savedEntity);
        return savedEntity;
    }
    
    @Override
    public List<T> saveAll(List<T> entities) {
        entities.forEach(this::beforeSave);
        entities.forEach(this::validateEntity);
        entities.forEach(this::validateBusinessRules);
        
        List<T> savedEntities = getRepository().saveAll(entities);
        
        savedEntities.forEach(this::afterSave);
        return savedEntities;
    }
    
    @Override
    public T update(T entity) {
        if (entity.getId() == null) {
            throw new ValidationException("업데이트할 엔티티의 ID가 필요합니다.");
        }
        
        T existingEntity = findActiveByIdOrThrow((ID) entity.getId());
        
        beforeUpdate(entity);
        validateEntity(entity);
        validateBusinessRules(entity);
        
        // null이 아닌 필드만 복사
        BeanUtils.copyProperties(entity, existingEntity, getNullPropertyNames(entity));
        
        T updatedEntity = getRepository().save(existingEntity);
        
        afterUpdate(updatedEntity);
        return updatedEntity;
    }
    
    @Override
    public T partialUpdate(ID id, T updateData) {
        T existingEntity = findActiveByIdOrThrow(id);
        
        beforeUpdate(updateData);
        validateEntity(updateData);
        validateBusinessRules(updateData);
        
        // null이 아닌 필드만 복사
        BeanUtils.copyProperties(updateData, existingEntity, getNullPropertyNames(updateData));
        
        T updatedEntity = getRepository().save(existingEntity);
        
        afterUpdate(updatedEntity);
        return updatedEntity;
    }
    
    @Override
    public void softDeleteById(ID id) {
        T entity = findActiveByIdOrThrow(id);
        beforeDelete(entity);
        
        String tenantId = ensureTenantId();
        getRepository().softDeleteByIdAndTenantId(id, tenantId, LocalDateTime.now());
        
        afterDelete(entity);
    }
    
    @Override
    public void hardDeleteById(ID id) {
        T entity = findActiveByIdOrThrow(id);
        beforeDelete(entity);
        
        getRepository().deleteById(id);
        
        afterDelete(entity);
    }
    
    @Override
    public void restoreById(ID id) {
        String tenantId = ensureTenantId();
        T entity = getRepository().findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new EntityNotFoundException("엔티티를 찾을 수 없습니다. ID: " + id));
        
        getRepository().restoreByIdAndTenantId(id, tenantId);
    }
    
    // ==================== 삭제된 엔티티 관련 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findAllDeleted() {
        String tenantId = ensureTenantId();
        return getRepository().findAllDeletedByTenantId(tenantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countDeleted() {
        String tenantId = ensureTenantId();
        return getRepository().countDeletedByTenantId(tenantId);
    }
    
    // ==================== 기간별 조회 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String tenantId = ensureTenantId();
        return getRepository().findByTenantIdAndCreatedAtBetween(tenantId, startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        String tenantId = ensureTenantId();
        return getRepository().findByTenantIdAndUpdatedAtBetween(tenantId, startDate, endDate);
    }
    
    // ==================== 최근 데이터 조회 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findRecentActive(int limit) {
        String tenantId = ensureTenantId();
        return getRepository().findRecentActiveByTenantId(tenantId, Pageable.ofSize(limit));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findRecentlyUpdatedActive(int limit) {
        String tenantId = ensureTenantId();
        return getRepository().findRecentlyUpdatedActiveByTenantId(tenantId, Pageable.ofSize(limit));
    }
    
    // ==================== 사용자별 조회 메서드 ====================
    

    

    
    // ==================== 통계 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Object[] getEntityStatistics() {
        String tenantId = ensureTenantId();
        return getRepository().getEntityStatisticsByTenantId(tenantId);
    }
    
    // ==================== 정리 메서드 ====================
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        String tenantId = ensureTenantId();
        getRepository().cleanupOldDeletedByTenantId(tenantId, cutoffDate);
    }
    
    // ==================== 중복 검사 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public boolean isDuplicateExcludingIdAll(ID excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return getRepository().isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    // ==================== 버전 관리 메서드 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Optional<T> findByIdAndVersion(ID id, Long version) {
        return getRepository().findByIdAndVersion(id, version);
    }
    
    // ==================== 생명주기 훅 메서드 ====================
    
    public void beforeSave(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void afterSave(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void beforeUpdate(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void afterUpdate(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void beforeDelete(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void afterDelete(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    // ==================== 검증 메서드 ====================
    
    public void validateEntity(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    public void validateBusinessRules(T entity) {
        // 기본 구현 - 하위 클래스에서 오버라이드 가능
    }
    
    // ==================== 유틸리티 메서드 ====================
    
    /**
     * null이 아닌 프로퍼티 이름 배열 반환
     */
    private String[] getNullPropertyNames(Object source) {
        final java.beans.PropertyDescriptor[] pds = BeanUtils.getPropertyDescriptors(source.getClass());
        final java.util.Set<String> emptyNames = new java.util.HashSet<>();
        
        for (java.beans.PropertyDescriptor pd : pds) {
            try {
                Object srcValue = pd.getReadMethod().invoke(source);
                if (srcValue == null) {
                    emptyNames.add(pd.getName());
                }
            } catch (Exception e) {
                // 무시
            }
        }
        
        String[] result = new String[emptyNames.size()];
        return emptyNames.toArray(result);
    }
}
