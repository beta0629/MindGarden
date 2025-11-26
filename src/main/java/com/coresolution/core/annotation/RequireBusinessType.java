/**
 * 업종 검증 커스텀 어노테이션
 * 메서드 또는 클래스 레벨에서 업종별 접근 제어
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
package com.coresolution.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 업종 검증 어노테이션
 * 
 * 사용 예시:
 * @RequireBusinessType("CONSULTATION")
 * @RequireBusinessType({"CONSULTATION", "ACADEMY"})
 * @RequireBusinessType(value = "CONSULTATION", message = "상담소에서만 사용 가능합니다")
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireBusinessType {
    
    /**
     * 필요한 업종 타입들
     * 여러 업종을 허용할 경우 배열로 지정
     */
    String[] value();
    
    /**
     * 접근 거부 시 에러 메시지
     * 기본값: "이 기능은 해당 업종에서 사용할 수 없습니다."
     */
    String message() default "이 기능은 해당 업종에서 사용할 수 없습니다.";
    
    /**
     * 엄격한 검증 모드
     * true: 업종이 정확히 일치해야 함
     * false: 업종이 포함되면 허용 (기본값)
     */
    boolean strict() default false;
    
    /**
     * 추가 역할 검증 필요 여부
     * true: 업종 검증 후 역할도 확인
     * false: 업종만 확인 (기본값)
     */
    boolean requireRoleCheck() default false;
    
    /**
     * 필요한 역할 목록 (requireRoleCheck가 true일 때만 사용)
     */
    String[] requiredRoles() default {};
    
    /**
     * 기능 플래그 검증 필요 여부
     * 특정 기능이 활성화된 경우에만 접근 허용
     */
    String[] requiredFeatures() default {};
}
