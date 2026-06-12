package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ConsultationRecord#getClientCondition()} 외 상담일지 모달 "큰 본문" textarea 5개의
 * Bean Validation ({@code @Size(max = 4000)}) 회귀 테스트.
 *
 * <p>2026-06-12 — 상담일지 모달 textarea 최대 글자수 2000 → 4000 확장에 따라 boundary 갱신.
 * 적용 필드: {@code clientCondition}, {@code mainIssues}, {@code interventionMethods},
 * {@code clientResponse}, {@code progressEvaluation}.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
@DisplayName("ConsultationRecord 상담일지 모달 본문 textarea Bean Validation")
class ConsultationRecordClientConditionValidationTest {

    private static final int CLIENT_CONDITION_MAX_LENGTH = 4000;

    private static final String EXPECTED_CLIENT_CONDITION_VIOLATION_MESSAGE = "내담자 상태는 4000자 이하여야 합니다.";

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

    private static ConsultationRecord minimalValidRecord() {
        ConsultationRecord consultationRecord = new ConsultationRecord();
        consultationRecord.setConsultationId(1L);
        consultationRecord.setClientId(1L);
        consultationRecord.setConsultantId(1L);
        consultationRecord.setSessionDate(LocalDate.of(2026, 5, 10));
        return consultationRecord;
    }

    private static String repeatChar(char c, int count) {
        return String.valueOf(c).repeat(count);
    }

    @Test
    @DisplayName("clientCondition 4000자이면 통과")
    void clientConditionExactlyMaxLength_valid() {
        ConsultationRecord consultationRecord = minimalValidRecord();
        consultationRecord.setClientCondition(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));

        Set<ConstraintViolation<ConsultationRecord>> violations = validator.validate(consultationRecord);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("clientCondition 4001자이면 위반 메시지에 4000 또는 한글 안내 포함")
    void clientConditionOneOverMaxLength_violationMessage() {
        ConsultationRecord consultationRecord = minimalValidRecord();
        consultationRecord.setClientCondition(repeatChar('b', CLIENT_CONDITION_MAX_LENGTH + 1));

        Set<ConstraintViolation<ConsultationRecord>> violations = validator.validate(consultationRecord);

        assertThat(violations).isNotEmpty();
        Set<String> messages = violations.stream()
                .filter(v -> "clientCondition".equals(v.getPropertyPath().toString()))
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());
        assertThat(messages)
                .isNotEmpty()
                .anyMatch(msg ->
                        msg.contains("4000") || EXPECTED_CLIENT_CONDITION_VIOLATION_MESSAGE.equals(msg));
    }

    @Test
    @DisplayName("mainIssues 4000자이면 통과, 4001자이면 위반")
    void mainIssuesBoundary() {
        ConsultationRecord ok = minimalValidRecord();
        ok.setMainIssues(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));
        assertThat(validator.validate(ok)).isEmpty();

        ConsultationRecord over = minimalValidRecord();
        over.setMainIssues(repeatChar('b', CLIENT_CONDITION_MAX_LENGTH + 1));
        Set<ConstraintViolation<ConsultationRecord>> v = validator.validate(over);
        assertThat(v)
                .anyMatch(violation -> "mainIssues".equals(violation.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("interventionMethods 4000자이면 통과, 4001자이면 위반")
    void interventionMethodsBoundary() {
        ConsultationRecord ok = minimalValidRecord();
        ok.setInterventionMethods(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));
        assertThat(validator.validate(ok)).isEmpty();

        ConsultationRecord over = minimalValidRecord();
        over.setInterventionMethods(repeatChar('b', CLIENT_CONDITION_MAX_LENGTH + 1));
        assertThat(validator.validate(over))
                .anyMatch(violation -> "interventionMethods".equals(violation.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("clientResponse 4000자이면 통과, 4001자이면 위반")
    void clientResponseBoundary() {
        ConsultationRecord ok = minimalValidRecord();
        ok.setClientResponse(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));
        assertThat(validator.validate(ok)).isEmpty();

        ConsultationRecord over = minimalValidRecord();
        over.setClientResponse(repeatChar('b', CLIENT_CONDITION_MAX_LENGTH + 1));
        assertThat(validator.validate(over))
                .anyMatch(violation -> "clientResponse".equals(violation.getPropertyPath().toString()));
    }

    @Test
    @DisplayName("progressEvaluation 4000자이면 통과, 4001자이면 위반")
    void progressEvaluationBoundary() {
        ConsultationRecord ok = minimalValidRecord();
        ok.setProgressEvaluation(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));
        assertThat(validator.validate(ok)).isEmpty();

        ConsultationRecord over = minimalValidRecord();
        over.setProgressEvaluation(repeatChar('b', CLIENT_CONDITION_MAX_LENGTH + 1));
        assertThat(validator.validate(over))
                .anyMatch(violation -> "progressEvaluation".equals(violation.getPropertyPath().toString()));
    }
}
