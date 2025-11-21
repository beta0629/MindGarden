package com.coresolution.core.service.impl;

import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.BaseTenantService;
import com.coresolution.consultation.entity.BaseEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 테넌트 기반 공통 서비스 구현체
 * 
 * <p>모든 업종에서 공통으로 사용하는 CRUD 로직을 구현합니다.</p>
 * <p>하위 클래스는 추상 메서드를 구현하고, 필요시 훅 메서드를 오버라이드합니다.</p>
 * 
 * @param <T> 엔티티 타입 (BaseEntity 상속)
 * @param <ID> 엔티티 ID 타입
 * @param <REQ> 요청 DTO 타입
 * @param <RES> 응답 DTO 타입
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public abstract class BaseTenantServiceImpl<T extends BaseEntity, ID, REQ, RES> 
        implements BaseTenantService<T, ID, REQ, RES> {
    
    protected final JpaRepository<T, ID> repository;
    protected final TenantAccessControlService accessControlService;
    
    // ==================== 추상 메서드 (하위 클래스에서 구현 필수) ====================
    
    /**
     * 요청 DTO를 엔티티로 변환
     * 
     * @param request 요청 DTO
     * @return 엔티티
     */
    protected abstract T toEntity(REQ request);
    
    /**
     * 엔티티를 응답 DTO로 변환
     * 
     * @param entity 엔티티
     * @return 응답 DTO
     */
    protected abstract RES toResponse(T entity);
    
    /**
     * 엔티티에서 ID 추출
     * 
     * @param entity 엔티티
     * @return 엔티티 ID
     */
    protected abstract ID extractId(T entity);
    
    /**
     * 엔티티에서 Tenant ID 추출
     * 
     * @param entity 엔티티
     * @return 테넌트 ID
     */
    protected abstract String extractTenantId(T entity);
    
    /**
     * 엔티티 조회 (ID로)
     * 
     * @param id 엔티티 ID
     * @return 엔티티 (Optional)
     */
    protected abstract java.util.Optional<T> findEntityById(ID id);
    
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
    public List<RES> findAll(String tenantId, Long branchId) {
        log.debug("목록 조회: tenantId={}, branchId={}", tenantId, branchId);
        
        // 접근 제어 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // 엔티티 조회
        List<T> entities = findEntitiesByTenantAndBranch(tenantId, branchId);
        
        // DTO 변환
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public RES findById(String tenantId, ID id) {
        log.debug("상세 조회: tenantId={}, id={}", tenantId, id);
        
        // 엔티티 조회
        T entity = findEntityById(id)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + id));
        
        // 접근 제어 검증
        String entityTenantId = extractTenantId(entity);
        if (!entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        return toResponse(entity);
    }
    
    @Override
    public RES create(String tenantId, REQ request, String createdBy) {
        log.info("엔티티 생성: tenantId={}, createdBy={}", tenantId, createdBy);
        
        // 접근 제어 검증
        accessControlService.validateTenantAccess(tenantId);
        
        // 비즈니스 규칙 검증
        validateBusinessRules(tenantId, request);
        
        // 생성 전 훅
        beforeCreate(tenantId, request);
        
        // 엔티티 변환 및 저장
        T entity = toEntity(request);
        entity.setTenantId(tenantId);
        // createdBy, updatedBy는 하위 클래스에서 설정 (엔티티별로 필드명이 다를 수 있음)
        setAuditFields(entity, createdBy, createdBy);
        
        T saved = repository.save(entity);
        
        // 생성 후 훅
        afterCreate(tenantId, saved);
        
        log.info("엔티티 생성 완료: id={}", extractId(saved));
        return toResponse(saved);
    }
    
    @Override
    public RES update(String tenantId, ID id, REQ request, String updatedBy) {
        log.info("엔티티 수정: tenantId={}, id={}, updatedBy={}", tenantId, id, updatedBy);
        
        // 기존 엔티티 조회
        T existingEntity = findEntityById(id)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + id));
        
        // 접근 제어 검증
        String entityTenantId = extractTenantId(existingEntity);
        if (!entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        // 비즈니스 규칙 검증
        validateBusinessRules(tenantId, request);
        
        // 수정 전 훅
        beforeUpdate(tenantId, id, request, existingEntity);
        
        // 엔티티 업데이트 (부분 업데이트)
        updateEntityFields(existingEntity, request);
        setAuditFields(existingEntity, null, updatedBy);
        
        T updated = repository.save(existingEntity);
        
        // 수정 후 훅
        afterUpdate(tenantId, updated);
        
        log.info("엔티티 수정 완료: id={}", extractId(updated));
        return toResponse(updated);
    }
    
    @Override
    public void delete(String tenantId, ID id, String deletedBy) {
        log.info("엔티티 삭제: tenantId={}, id={}, deletedBy={}", tenantId, id, deletedBy);
        
        // 엔티티 조회
        T entity = findEntityById(id)
                .orElseThrow(() -> new IllegalArgumentException("엔티티를 찾을 수 없습니다: " + id));
        
        // 접근 제어 검증
        String entityTenantId = extractTenantId(entity);
        if (!entityTenantId.equals(tenantId)) {
            accessControlService.validateTenantAccess(tenantId);
        }
        
        // 소프트 삭제
        entity.delete();
        setAuditFields(entity, null, deletedBy);
        
        repository.save(entity);
        
        log.info("엔티티 삭제 완료: id={}", id);
    }
    
    // ==================== 보조 메서드 ====================
    
    /**
     * 엔티티 필드 업데이트 (부분 업데이트)
     * 하위 클래스에서 오버라이드하여 구현합니다.
     * 
     * @param entity 기존 엔티티
     * @param request 요청 DTO
     */
    protected void updateEntityFields(T entity, REQ request) {
        // 기본 구현: toEntity로 새 엔티티를 만들고 필드 복사
        // 하위 클래스에서 더 효율적으로 오버라이드 가능
        T newEntity = toEntity(request);
        copyNonNullFields(newEntity, entity);
    }
    
    /**
     * null이 아닌 필드만 복사
     * 
     * @param source 소스 엔티티
     * @param target 타겟 엔티티
     */
    protected void copyNonNullFields(T source, T target) {
        // 기본 구현: 리플렉션 사용 또는 하위 클래스에서 구현
        // 여기서는 기본 구현만 제공하고, 하위 클래스에서 오버라이드 권장
    }
    
    /**
     * 감사 필드 설정 (createdBy, updatedBy)
     * 하위 클래스에서 오버라이드하여 구현합니다.
     * 
     * @param entity 엔티티
     * @param createdBy 생성자 (null이면 설정하지 않음)
     * @param updatedBy 수정자 (null이면 설정하지 않음)
     */
    protected void setAuditFields(T entity, String createdBy, String updatedBy) {
        // 기본 구현: 리플렉션을 사용하여 필드 설정 시도
        // 하위 클래스에서 더 효율적으로 오버라이드 가능
        try {
            if (createdBy != null) {
                java.lang.reflect.Method setCreatedBy = entity.getClass().getMethod("setCreatedBy", String.class);
                setCreatedBy.invoke(entity, createdBy);
            }
            if (updatedBy != null) {
                java.lang.reflect.Method setUpdatedBy = entity.getClass().getMethod("setUpdatedBy", String.class);
                setUpdatedBy.invoke(entity, updatedBy);
            }
        } catch (Exception e) {
            // 메서드가 없으면 무시 (하위 클래스에서 오버라이드하여 처리)
            log.debug("Audit fields 설정 실패 (하위 클래스에서 오버라이드 필요): {}", e.getMessage());
        }
    }
}

