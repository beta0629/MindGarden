package com.coresolution.core.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 보안 감사 어노테이션
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SecurityAudit {
    /**
     * 이벤트 타입
     */
    String eventType();
    
    /**
     * 이벤트 설명 (선택)
     */
    String description() default "";
}

