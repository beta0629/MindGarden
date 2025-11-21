package com.coresolution.core.constant;

import java.text.MessageFormat;

/**
 * 역할 관련 상수 정의
 * 하드코딩 금지 원칙에 따라 모든 상수를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
public class RoleConstants {
    
    // 에러 메시지 상수
    public static final String ERROR_ROLE_NOT_FOUND = "역할을 찾을 수 없습니다: {0}";
    public static final String ERROR_ACCESS_DENIED = "접근 권한이 없습니다.";
    public static final String ERROR_ROLE_NAME_DUPLICATE = "이미 존재하는 역할명입니다: {0}";
    public static final String ERROR_TEMPLATE_NOT_FOUND = "템플릿을 찾을 수 없습니다: {0}";
    public static final String ERROR_ROLE_HAS_USERS = "할당된 사용자가 있어 삭제할 수 없습니다. 먼저 사용자 역할을 해제해주세요.";
    
    // 메시지 포맷팅 헬퍼 메서드
    public static String formatError(String template, Object... args) {
        return MessageFormat.format(template, args);
    }
    
    // 생성자 방지
    private RoleConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}

