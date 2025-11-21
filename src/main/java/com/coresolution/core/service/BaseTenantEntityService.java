package com.coresolution.core.service;

import com.coresolution.consultation.entity.BaseEntity;

import java.util.List;
import java.util.Optional;

/**
 * 테넌트 기반 엔티티 서비스 인터페이스 (엔티티 직접 사용)
 * 
 * <p>기존 마인드가든 서비스와의 호환성을 위해 엔티티를 직접 다루는 버전입니다.</p>
 * <p>DTO 기반 BaseTenantService와 병행하여 사용할 수 있습니다.</p>
 * 
 * @param <T> 엔티티 타입 (BaseEntity 상속)
 * @param <ID> 엔티티 ID 타입
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface BaseTenantEntityService<T extends BaseEntity, ID> {
    
    // ==================== 공통 CRUD 메서드 (엔티티 직접 반환) ====================
    
    /**
     * 목록 조회 (테넌트 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param branchId 지점 ID (선택적, null이면 전체 지점)
     * @return 엔티티 목록
     */
    List<T> findAllByTenant(String tenantId, Long branchId);
    
    /**
     * 상세 조회 (테넌트 필터링)
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @return 엔티티
     * @throws IllegalArgumentException 엔티티를 찾을 수 없거나 접근 권한이 없는 경우
     */
    Optional<T> findByIdAndTenant(String tenantId, ID id);
    
    /**
     * 생성 (테넌트 ID 자동 설정)
     * 
     * @param tenantId 테넌트 ID
     * @param entity 엔티티
     * @return 생성된 엔티티
     */
    T create(String tenantId, T entity);
    
    /**
     * 수정 (테넌트 접근 제어)
     * 
     * @param tenantId 테넌트 ID
     * @param entity 엔티티
     * @return 수정된 엔티티
     */
    T update(String tenantId, T entity);
    
    /**
     * 부분 수정 (테넌트 접근 제어)
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @param updateData 수정할 데이터
     * @return 수정된 엔티티
     */
    T partialUpdate(String tenantId, ID id, T updateData);
    
    /**
     * 삭제 (소프트 삭제, 테넌트 접근 제어)
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     */
    void delete(String tenantId, ID id);
    
    // ==================== 업종별 비즈니스 로직 훅 (선택적 오버라이드) ====================
    
    /**
     * 비즈니스 규칙 검증
     * 업종별 특화 검증 로직을 구현합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param entity 엔티티
     * @throws IllegalArgumentException 검증 실패 시
     */
    default void validateBusinessRules(String tenantId, T entity) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
    
    /**
     * 생성 전 훅
     * 엔티티 생성 전 추가 작업을 수행합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param entity 엔티티
     */
    default void beforeCreate(String tenantId, T entity) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
    
    /**
     * 생성 후 훅
     * 엔티티 생성 후 추가 작업을 수행합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param entity 생성된 엔티티
     */
    default void afterCreate(String tenantId, T entity) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
    
    /**
     * 수정 전 훅
     * 엔티티 수정 전 추가 작업을 수행합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @param entity 수정할 엔티티
     * @param existingEntity 기존 엔티티
     */
    default void beforeUpdate(String tenantId, ID id, T entity, T existingEntity) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
    
    /**
     * 수정 후 훅
     * 엔티티 수정 후 추가 작업을 수행합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param entity 수정된 엔티티
     */
    default void afterUpdate(String tenantId, T entity) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
}

