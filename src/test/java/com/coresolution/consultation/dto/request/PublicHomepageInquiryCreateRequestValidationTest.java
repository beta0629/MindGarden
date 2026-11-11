package com.coresolution.consultation.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * 공개 문의 요청 Bean Validation — privacyConsent=false 거부.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class PublicHomepageInquiryCreateRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void init() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void privacyConsentFalse_isRejected() {
        PublicHomepageInquiryCreateRequest request = PublicHomepageInquiryCreateRequest.builder()
                .name("홍길동")
                .phone("01012345678")
                .inquiryType("PERSONAL")
                .content("문의")
                .privacyConsent(false)
                .consentVersion("v1")
                .build();

        Set<ConstraintViolation<PublicHomepageInquiryCreateRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("privacyConsent")))
                .isTrue();
    }
}
