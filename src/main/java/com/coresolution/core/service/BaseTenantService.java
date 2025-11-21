package com.coresolution.core.service;

import com.coresolution.consultation.entity.BaseEntity;

import java.util.List;

/**
 * 테넌트 기반 공통 서비스 인터페이스
 * 
 * <p>모든 업종(학원, 상담소, 카페, 요식업 등)에서 공통으로 사용하는 CRUD 로직을 정의합니다.</p>
 * <p>업종별 특화 비즈니스 로직은 하위 클래스에서 오버라이드하여 구현합니다.</p>
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
public interface BaseTenantService<T extends BaseEntity, ID, REQ, RES> {
    
    // ==================== 공통 CRUD 메서드 ====================
    
    /**
     * 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @param branchId 지점 ID (선택적, null이면 전체 지점)
     * @return 엔티티 목록
     */
    List<RES> findAll(String tenantId, Long branchId);
    
    /**
     * 상세 조회
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @return 엔티티 상세 정보
     * @throws IllegalArgumentException 엔티티를 찾을 수 없는 경우
     */
    RES findById(String tenantId, ID id);
    
    /**
     * 생성
     * 
     * @param tenantId 테넌트 ID
     * @param request 요청 DTO
     * @param createdBy 생성자
     * @return 생성된 엔티티
     */
    RES create(String tenantId, REQ request, String createdBy);
    
    /**
     * 수정
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @param request 요청 DTO
     * @param updatedBy 수정자
     * @return 수정된 엔티티
     */
    RES update(String tenantId, ID id, REQ request, String updatedBy);
    
    /**
     * 삭제 (소프트 삭제)
     * 
     * @param tenantId 테넌트 ID
     * @param id 엔티티 ID
     * @param deletedBy 삭제자
     */
    void delete(String tenantId, ID id, String deletedBy);
    
    // ==================== 업종별 비즈니스 로직 훅 (선택적 오버라이드) ====================
    
    /**
     * 비즈니스 규칙 검증
     * 업종별 특화 검증 로직을 구현합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param request 요청 DTO
     * @throws IllegalArgumentException 검증 실패 시
     */
    default void validateBusinessRules(String tenantId, REQ request) {
        // 기본 구현: 빈 메서드 (하위 클래스에서 오버라이드)
    }
    
    /**
     * 생성 전 훅
     * 엔티티 생성 전 추가 작업을 수행합니다.
     * 
     * @param tenantId 테넌트 ID
     * @param request 요청 DTO
     */
    default void beforeCreate(String tenantId, REQ request) {
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
     * @param request 요청 DTO
     * @param existingEntity 기존 엔티티
     */
    default void beforeUpdate(String tenantId, ID id, REQ request, T existingEntity) {
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

