package com.coresolution.core.service;

/**
 * 역할 템플릿 초기화 서비스
 * 시스템 메타데이터인 RoleTemplate의 초기화 상태를 검증하고 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface RoleTemplateInitializationService {
    
    /**
     * 역할 템플릿 시스템 초기화 상태 확인
     * @return 초기화 여부
     */
    boolean isRoleTemplateSystemInitialized();
    
    /**
     * 역할 템플릿 시스템 초기화
     * V9 마이그레이션에서 초기 데이터가 삽입되어야 함
     */
    void validateRoleTemplateSystem();
}

