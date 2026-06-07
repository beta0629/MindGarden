package com.coresolution.consultation.dto.content;

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
 * Apple Guideline 1.4.1 (T3) — 힐링 카탈로그 Upsert 요청 출처 검증.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("HealingContentCatalogUpsertRequest 검증")
class HealingContentCatalogUpsertRequestValidationTest {

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

    private HealingContentCatalogUpsertRequest validBaseWith(
            String label, String url, String author, Integer year
    ) {
        return new HealingContentCatalogUpsertRequest(
                "code-1",
                "테스트 콘텐츠",
                "테스트 설명",
                "meditation",
                "AUDIO",
                null,
                null,
                10,
                true,
                0,
                label,
                url,
                author,
                year
        );
    }

    @Test
    @DisplayName("source 4 필드 모두 null → 위반 없음")
    void allSourceFieldsNull_passes() {
        HealingContentCatalogUpsertRequest req = validBaseWith(null, null, null, null);

        Set<ConstraintViolation<HealingContentCatalogUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("정상 source 4 필드 → 위반 없음")
    void validSource_passes() {
        HealingContentCatalogUpsertRequest req = validBaseWith(
                "APA Mindfulness Review",
                "https://www.apa.org/monitor/2012/07-08/ce-corner",
                "American Psychological Association",
                2012
        );

        Set<ConstraintViolation<HealingContentCatalogUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("sourceLabel 200 초과 → 위반")
    void sourceLabelTooLong_violation() {
        HealingContentCatalogUpsertRequest req = validBaseWith("a".repeat(201), null, null, null);

        Set<ConstraintViolation<HealingContentCatalogUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourceLabel".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("sourcePublishedYear 1899 → @Min 위반")
    void sourceYearTooSmall_violation() {
        HealingContentCatalogUpsertRequest req = validBaseWith(null, null, null, 1899);

        Set<ConstraintViolation<HealingContentCatalogUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourcePublishedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("sourcePublishedYear 2101 → @Max 위반")
    void sourceYearTooLarge_violation() {
        HealingContentCatalogUpsertRequest req = validBaseWith(null, null, null, 2101);

        Set<ConstraintViolation<HealingContentCatalogUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourcePublishedYear".equals(v.getPropertyPath().toString()));
    }
}
