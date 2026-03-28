package com.coresolution.consultation.validation;

import com.coresolution.consultation.util.VehiclePlateText;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * {@link VehiclePlateOptional} 구현체.
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
public class VehiclePlateOptionalValidator implements ConstraintValidator<VehiclePlateOptional, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String normalized = VehiclePlateText.normalizeOrNull(value);
        if (normalized == null) {
            return true;
        }
        return VehiclePlateText.isValidNormalized(normalized);
    }
}
