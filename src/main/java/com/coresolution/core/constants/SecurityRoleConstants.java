package com.coresolution.core.constants;

/**
 * Spring Security 역할 상수 클래스
 * 하드코딩 방지를 위한 역할 상수 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
public final class SecurityRoleConstants {
    
    private SecurityRoleConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
    }
    
    // ==================== Spring Security 역할 상수 ====================
    
    /** 관리자 역할 */
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    
    /** Ops Portal 운영자 역할 */
    public static final String ROLE_OPS = "ROLE_OPS";
    
    /** 본사 관리자 역할 */
    public static final String ROLE_HQ_ADMIN = "ROLE_HQ_ADMIN";
    
    /** 역할 접두사 */
    public static final String ROLE_PREFIX = "ROLE_";
    
    // ==================== 역할 이름 상수 (JWT 토큰의 actorRole 값) ====================
    
    /** 본사 관리자 역할 이름 */
    public static final String ACTOR_ROLE_HQ_ADMIN = "HQ_ADMIN";
    
    /** 본사 고급 관리자 역할 이름 */
    public static final String ACTOR_ROLE_SUPER_HQ_ADMIN = "SUPER_HQ_ADMIN";
    
    /** 관리자 역할 이름 */
    public static final String ACTOR_ROLE_ADMIN = "ADMIN";
    
    /** Ops Portal 운영자 역할 이름 */
    public static final String ACTOR_ROLE_OPS = "OPS";
}

