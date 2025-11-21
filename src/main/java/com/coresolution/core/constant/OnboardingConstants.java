package com.coresolution.core.constant;

import java.text.MessageFormat;

/**
 * 온보딩 시스템 상수 정의
 * 하드코딩 금지 원칙에 따라 모든 상수를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
public class OnboardingConstants {
    
    // 공통 코드 그룹 상수
    public static final String CODE_GROUP_ONBOARDING_STATUS = "ONBOARDING_STATUS";
    public static final String CODE_GROUP_RISK_LEVEL = "RISK_LEVEL";
    public static final String CODE_GROUP_BUSINESS_TYPE = "BUSINESS_TYPE";
    
    // 공통 코드 값 상수 (기본값, 공통 코드에서 조회 실패 시 사용)
    public static final String CODE_VALUE_PENDING = "PENDING";
    public static final String CODE_VALUE_APPROVED = "APPROVED";
    public static final String CODE_VALUE_ON_HOLD = "ON_HOLD";
    public static final String CODE_VALUE_REJECTED = "REJECTED";
    public static final String CODE_VALUE_LOW = "LOW";
    public static final String CODE_VALUE_DEFAULT_BUSINESS_TYPE = "CONSULTATION"; // 기본 업종 (공통 코드에서 조회 실패 시 사용)
    
    // 에러 메시지 상수
    public static final String ERROR_TENANT_NOT_FOUND = "온보딩 요청을 찾을 수 없습니다: {0}";
    public static final String ERROR_EMAIL_DUPLICATE = "이미 해당 이메일로 테넌트가 생성되어 있습니다.";
    public static final String ERROR_INVALID_STATUS = "유효하지 않은 상태 코드입니다: {0}";
    public static final String ERROR_RETRY_ONLY_ON_HOLD = "재시도는 ON_HOLD 상태인 경우에만 가능합니다. 현재 상태: {0}";
    public static final String ERROR_ONBOARDING_REQUEST_NOT_FOUND = "온보딩 요청을 찾을 수 없습니다. ID와 이메일을 확인해주세요.";
    
    // 메시지 포맷팅 헬퍼 메서드
    public static String formatError(String template, Object... args) {
        return MessageFormat.format(template, args);
    }
    
    // 생성자 방지
    private OnboardingConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}

