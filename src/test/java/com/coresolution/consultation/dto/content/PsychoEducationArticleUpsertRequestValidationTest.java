package com.coresolution.consultation.dto.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * Apple Guideline 1.4.1 (T3) — 심리교육 마스터 Upsert 요청 검증.
 *
 * <p>출처 4 필드(label/url/author/publishedYear)의 Bean Validation 회귀.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("PsychoEducationArticleUpsertRequest 검증")
class PsychoEducationArticleUpsertRequestValidationTest {

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

    private PsychoEducationArticleUpsertRequest validBaseWith(
            String label, String url, String author, Integer year
    ) {
        return new PsychoEducationArticleUpsertRequest(
                "test-slug",
                "테스트 글",
                "테스트 요약",
                "테스트 본문",
                "stress",
                "스트레스 관리",
                3,
                List.of(new PsychoEducationArticleResponse.Page("페이지", "본문")),
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
        PsychoEducationArticleUpsertRequest req = validBaseWith(null, null, null, null);

        Set<ConstraintViolation<PsychoEducationArticleUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("정상 source 4 필드 → 위반 없음")
    void validSource_passes() {
        PsychoEducationArticleUpsertRequest req = validBaseWith(
                "WHO mhGAP",
                "https://www.who.int/mhgap",
                "World Health Organization",
                2016
        );

        Set<ConstraintViolation<PsychoEducationArticleUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("sourceUrl 길이 초과(501) → @Size 위반")
    void sourceUrlTooLong_violation() {
        String tooLong = "https://example.com/" + "x".repeat(485);
        PsychoEducationArticleUpsertRequest req = validBaseWith(null, tooLong, null, null);

        Set<ConstraintViolation<PsychoEducationArticleUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourceUrl".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("sourcePublishedYear 1899 → @Min 위반")
    void sourceYearTooSmall_violation() {
        PsychoEducationArticleUpsertRequest req = validBaseWith(null, null, null, 1899);

        Set<ConstraintViolation<PsychoEducationArticleUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourcePublishedYear".equals(v.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("sourcePublishedYear 2101 → @Max 위반")
    void sourceYearTooLarge_violation() {
        PsychoEducationArticleUpsertRequest req = validBaseWith(null, null, null, 2101);

        Set<ConstraintViolation<PsychoEducationArticleUpsertRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> "sourcePublishedYear".equals(v.getPropertyPath().toString()));
    }
}
