package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * Apple Guideline 1.4.1 (T3) 의료 출처 공용 DTO 검증.
 *
 * <p>SourceCitation 의 4 필드 길이 / 연도 범위 / 빈 값 처리(isEmpty) 회귀를
 * 보장한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("SourceCitation 검증")
class SourceCitationValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDownValidator() {
        if (factory != null) {
            factory.close();
        }
    }

    @Test
    @DisplayName("모든 필드 비어 있으면 isEmpty == true 이고 위반 없음")
    void allBlank_isEmpty() {
        SourceCitation citation = new SourceCitation(null, null, null, null);

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).isEmpty();
        assertThat(citation.isEmpty()).isTrue();
    }

    @Test
    @DisplayName("정상 4 필드는 위반 없음 + isEmpty == false")
    void validCitation_passes() {
        SourceCitation citation = new SourceCitation(
                "PHQ-9 (Kroenke et al., 2001)",
                "https://doi.org/10.1046/j.1525-1497.2001.016009606.x",
                "Kroenke K, Spitzer RL, Williams JBW",
                2001
        );

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).isEmpty();
        assertThat(citation.isEmpty()).isFalse();
    }

    @Test
    @DisplayName("label 200 초과 시 @Size 위반")
    void labelTooLong_violation() {
        SourceCitation citation = new SourceCitation("a".repeat(201), null, null, null);

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).anyMatch(v -> "label".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("url 500 초과 시 @Size 위반")
    void urlTooLong_violation() {
        SourceCitation citation = new SourceCitation(null, "https://example.com/" + "x".repeat(485), null, null);

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).anyMatch(v -> "url".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("publishedYear 1899 (Min 위반) → 위반")
    void yearTooSmall_violation() {
        SourceCitation citation = new SourceCitation(null, null, null, 1899);

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).anyMatch(v -> "publishedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("publishedYear 2101 (Max 위반) → 위반")
    void yearTooLarge_violation() {
        SourceCitation citation = new SourceCitation(null, null, null, 2101);

        Set<ConstraintViolation<SourceCitation>> violations = validator.validate(citation);

        assertThat(violations).anyMatch(v -> "publishedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("publishedYear 1900 / 2100 경계는 통과")
    void yearBoundaryValues_pass() {
        SourceCitation lower = new SourceCitation(null, null, null, 1900);
        SourceCitation upper = new SourceCitation(null, null, null, 2100);

        assertThat(validator.validate(lower)).isEmpty();
        assertThat(validator.validate(upper)).isEmpty();
    }
}
