package com.coresolution.consultation.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 수동 다중 발송 수신자 목록 크기 검증. 상한은 {@code notification.manual.max-recipients} 설정 하나만 쓴다.
 *
 * <p>메시지의 {@code {max}} 는 검증 시점의 설정값으로 채워진다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Documented
@Constraint(validatedBy = WithinManualRecipientLimitValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface WithinManualRecipientLimit {

    String message() default "한 번에 최대 {max}명까지 발송할 수 있습니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
