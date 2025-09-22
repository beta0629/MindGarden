package com.mindgarden.consultation.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import com.mindgarden.consultation.constant.UserRole;

/**
 * 메서드 레벨 권한 체크 어노테이션
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    UserRole[] value();
}
