package com.mindgarden.consultation.service;

/**
 * 권한 초기화 서비스
 * 시스템 시작 시 기본 권한들을 데이터베이스에 초기화
 */
public interface PermissionInitializationService {
    
    /**
     * 기본 권한들 초기화
     */
    void initializeDefaultPermissions();
    
    /**
     * 기본 역할별 권한 매핑 초기화
     */
    void initializeDefaultRolePermissions();
    
    /**
     * 전체 권한 시스템 초기화
     */
    void initializePermissionSystem();
    
    /**
     * 권한 시스템 초기화 상태 확인
     */
    boolean isPermissionSystemInitialized();
}
