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
 * {@link ConsultationRecord#getClientCondition()} Bean Validation ({@code @Size(max = 2000)}) 회귀 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-10
 */
@DisplayName("ConsultationRecord clientCondition Bean Validation")
class ConsultationRecordClientConditionValidationTest {

    private static final int CLIENT_CONDITION_MAX_LENGTH = 2000;

    private static final String EXPECTED_CLIENT_CONDITION_VIOLATION_MESSAGE = "내담자 상태는 2000자 이하여야 합니다.";

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
    @DisplayName("clientCondition 2000자이면 통과")
    void clientConditionExactlyMaxLength_valid() {
        ConsultationRecord consultationRecord = minimalValidRecord();
        consultationRecord.setClientCondition(repeatChar('a', CLIENT_CONDITION_MAX_LENGTH));

        Set<ConstraintViolation<ConsultationRecord>> violations = validator.validate(consultationRecord);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("clientCondition 2001자이면 위반 메시지에 2000 또는 한글 안내 포함")
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
                        msg.contains("2000") || EXPECTED_CLIENT_CONDITION_VIOLATION_MESSAGE.equals(msg));
    }
}
