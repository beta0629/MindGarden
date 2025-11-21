package com.coresolution.core.service.impl;

import com.coresolution.consultation.entity.BaseEntity;
import com.coresolution.consultation.repository.BaseRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.BaseTenantEntityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 테넌트 기반 엔티티 서비스 구현체 (엔티티 직접 사용)
 * 
 * <p>기존 마인드가든 서비스와의 호환성을 위해 엔티티를 직접 다루는 버전입니다.</p>
 * <p>BaseService와 BaseTenantEntityService를 모두 구현하여 기존 코드와의 호환성을 유지합니다.</p>
 * 
 * @param <T> 엔티티 타입 (BaseEntity 상속)
 * @param <ID> 엔티티 ID 타입
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public abstract class BaseTenantEntityServiceImpl<T extends BaseEntity, ID> 
        implements BaseTenantEntityService<T, ID> {
    
    protected final BaseRepository<T, ID> repository;
    protected final TenantAccessControlService accessControlService;
    
    // ==================== 추상 메서드 (하위 클래스에서 구현 필수) ====================
    
    /**
     * 엔티티 조회 (ID로)
     * 
     * @param id 엔티티 ID
     * @return 엔티티 (Optional)
     */
    protected abstract Optional<T> findEntityById(ID id);
    
    /**
     * 목록 조회 (tenant_id, branch_id 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param branchId 지점 ID (선택적)
     * @return 엔티티 목록
     */
    protected abstract List<T> findEntitiesByTenantAndBranch(String tenantId, Long branchId);
    
    // ==================== 공통 CRUD 구현 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<T> findAllByTenant(String tenantId, Long branchId) {
        log.debug("목록 조회: tenantId={}, branchId={}", tenantId, branchId);
        
        // 접근 제어 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // 엔티티 조회
        return findEntitiesByTenantAndBranch(tenantId, branchId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<T> findByIdAndTenant(String tenantId, ID id) {
        log.debug("상세 조회: tenantId={}, id={}", tenantId, id);
        
        // 엔티티 조회
        T entity = findEntityById(id)
                .orElse(null);
        
        if (entity == null) {
            return Optional.empty();
        }
        
        // 접근 제어 검증
        String entityTenantId = entity.getTenantId();
        if (entityTenantId != null && !entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
            return Optional.empty(); // 다른 테넌트의 데이터는 접근 불가
        }
        
        return Optional.of(entity);
    }
    
    @Override
    public T create(String tenantId, T entity) {
        log.info("엔티티 생성: tenantId={}", tenantId);
        
        // 접근 제어 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // 비즈니스 규칙 검증
        validateBusinessRules(tenantId, entity);
        
        // 생성 전 훅
        beforeCreate(tenantId, entity);
        
        // 테넌트 ID 설정
        if (entity.getTenantId() == null) {
            entity.setTenantId(tenantId);
        }
        
        // 감사 필드 설정
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        if (entity.getUpdatedAt() == null) {
            entity.setUpdatedAt(LocalDateTime.now());
        }
        if (entity.getVersion() == null) {
            entity.setVersion(1L);
        }
        
        T saved = repository.save(entity);
        
        // 생성 후 훅
        afterCreate(tenantId, saved);
        
        log.info("엔티티 생성 완료: id={}", saved.getId());
        return saved;
    }
    
    @Override
    public T update(String tenantId, T entity) {
        @SuppressWarnings("unchecked")
        ID entityId = (ID) entity.getId();
        log.info("엔티티 수정: tenantId={}, id={}", tenantId, entityId);
        
        // 기존 엔티티 조회
        T existingEntity = findEntityById(entityId)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + entityId));
        
        // 접근 제어 검증
        String entityTenantId = existingEntity.getTenantId();
        if (entityTenantId != null && !entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
            throw new IllegalArgumentException("다른 테넌트의 데이터는 수정할 수 없습니다.");
        }
        
        // 비즈니스 규칙 검증
        validateBusinessRules(tenantId, entity);
        
        // 수정 전 훅
        beforeUpdate(tenantId, entityId, entity, existingEntity);
        
        // 엔티티 업데이트
        entity.setTenantId(tenantId); // 테넌트 ID 유지
        entity.setUpdatedAt(LocalDateTime.now());
        if (existingEntity.getVersion() != null) {
            entity.setVersion(existingEntity.getVersion() + 1);
        }
        
        T updated = repository.save(entity);
        
        // 수정 후 훅
        afterUpdate(tenantId, updated);
        
        log.info("엔티티 수정 완료: id={}", entityId);
        return updated;
    }
    
    @Override
    public T partialUpdate(String tenantId, ID id, T updateData) {
        log.info("엔티티 부분 수정: tenantId={}, id={}", tenantId, id);
        
        // 기존 엔티티 조회
        T existingEntity = findEntityById(id)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + id));
        
        // 접근 제어 검증
        String entityTenantId = existingEntity.getTenantId();
        if (entityTenantId != null && !entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
            throw new IllegalArgumentException("다른 테넌트의 데이터는 수정할 수 없습니다.");
        }
        
        // 비즈니스 규칙 검증
        validateBusinessRules(tenantId, updateData);
        
        // 수정 전 훅
        beforeUpdate(tenantId, id, updateData, existingEntity);
        
        // 부분 업데이트 (null이 아닌 필드만 업데이트)
        copyNonNullFields(updateData, existingEntity);
        existingEntity.setUpdatedAt(LocalDateTime.now());
        if (existingEntity.getVersion() != null) {
            existingEntity.setVersion(existingEntity.getVersion() + 1);
        }
        
        T updated = repository.save(existingEntity);
        
        // 수정 후 훅
        afterUpdate(tenantId, updated);
        
        log.info("엔티티 부분 수정 완료: id={}", updated.getId());
        return updated;
    }
    
    @Override
    public void delete(String tenantId, ID id) {
        log.info("엔티티 삭제: tenantId={}, id={}", tenantId, id);
        
        // 엔티티 조회
        T entity = findEntityById(id)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + id));
        
        // 접근 제어 검증
        String entityTenantId = entity.getTenantId();
        if (entityTenantId != null && !entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
            throw new IllegalArgumentException("다른 테넌트의 데이터는 삭제할 수 없습니다.");
        }
        
        // 소프트 삭제
        entity.setIsDeleted(true);
        entity.setDeletedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        if (entity.getVersion() != null) {
            entity.setVersion(entity.getVersion() + 1);
        }
        
        repository.save(entity);
        
        log.info("엔티티 삭제 완료: id={}", id);
    }
    
    // ==================== 보조 메서드 ====================
    
    /**
     * null이 아닌 필드만 복사
     * 하위 클래스에서 오버라이드하여 더 효율적으로 구현 가능
     * 
     * @param source 소스 엔티티
     * @param target 타겟 엔티티
     */
    protected void copyNonNullFields(T source, T target) {
        // 기본 구현: 리플렉션 사용 또는 하위 클래스에서 구현
        // 여기서는 기본 구현만 제공하고, 하위 클래스에서 오버라이드 권장
        // 실제 구현은 하위 클래스에서 엔티티별로 구현
    }
}

