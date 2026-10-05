package com.coresolution.consultation.validation;

import java.util.Collection;
import com.coresolution.consultation.config.ManualNotificationProperties;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.hibernate.validator.constraintvalidation.HibernateConstraintValidatorContext;

/**
 * {@link WithinManualRecipientLimit} 검증기. 스프링 검증기 팩토리가 설정 빈을 주입한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public class WithinManualRecipientLimitValidator
        implements ConstraintValidator<WithinManualRecipientLimit, Collection<?>> {

    static final String MESSAGE_PARAM_MAX = "max";

    private final ManualNotificationProperties properties;

    /**
     * @param properties 수동 발송 설정
     */
    public WithinManualRecipientLimitValidator(ManualNotificationProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean isValid(Collection<?> value, ConstraintValidatorContext context) {
        int max = properties.getMaxRecipients();
        if (value == null || value.size() <= max) {
            return true;
        }
        context.unwrap(HibernateConstraintValidatorContext.class)
            .addMessageParameter(MESSAGE_PARAM_MAX, max);
        return false;
    }
}
