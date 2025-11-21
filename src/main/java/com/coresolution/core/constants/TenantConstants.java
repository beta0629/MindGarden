package com.coresolution.core.constants;

/**
 * 테넌트 상수 클래스
 * 하드코딩 방지를 위한 테넌트 식별자 상수 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
public final class TenantConstants {
    
    private TenantConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    // ==================== 테넌트 타입 상수 ====================
    
    /** 코어솔루션 플랫폼 테넌트 타입 */
    public static final String TENANT_TYPE_CORE_SOLUTION = "CORE_SOLUTION";
    
    /** Trinity 회사 테넌트 타입 */
    public static final String TENANT_TYPE_TRINITY = "TRINITY";
    
    // ==================== 테넌트 이름 상수 ====================
    
    /** Trinity 회사 이름 */
    public static final String TENANT_NAME_TRINITY = "Trinity";
    
    /** 코어솔루션 플랫폼 이름 */
    public static final String TENANT_NAME_CORE_SOLUTION = "CoreSolution";
}

