package com.coresolution.consultation.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 선택 차량번호 형식 검증 (Bean Validation).
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
@Documented
@Constraint(validatedBy = VehiclePlateOptionalValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface VehiclePlateOptional {

    String message() default "차량번호는 숫자, 한글, 영문, 하이픈, 공백만 입력할 수 있으며 최대 32자입니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
