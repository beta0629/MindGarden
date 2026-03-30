package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * 내담자 등록 DTO의 {@code vehiclePlate} 필드 Bean Validation 검증.
 * 컨트롤러 {@code @Valid}와 동일한 제약을 프로그램 방식으로 검증한다.
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
@DisplayName("ClientRegistrationRequest 차량번호 Bean Validation")
class ClientRegistrationRequestVehiclePlateValidationTest {

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

    private ClientRegistrationRequest validBase() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail("plate-" + UUID.randomUUID() + "@test.com");
        return req;
    }

    @Test
    @DisplayName("vehiclePlate가 null이면 위반 없음")
    void nullPlate_noViolation() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate(null);
        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    @DisplayName("vehiclePlate가 빈 문자열·공백만이면 위반 없음")
    void blankPlate_noViolation() {
        ClientRegistrationRequest empty = validBase();
        empty.setVehiclePlate("");
        assertThat(validator.validate(empty)).isEmpty();
        ClientRegistrationRequest spaces = validBase();
        spaces.setVehiclePlate("   ");
        assertThat(validator.validate(spaces)).isEmpty();
    }

    @Test
    @DisplayName("한글·숫자·하이픈·공백 조합 통과")
    void koreanStylePlate_noViolation() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate("12가 3456");
        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    @DisplayName("영문 포함(정규화 대상) 통과")
    void asciiLetters_noViolation() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate("ab 12");
        assertThat(validator.validate(req)).isEmpty();
    }

    @Test
    @DisplayName("금지 문자 입력 시 propertyPath가 vehiclePlate인 위반 발생")
    void illegalCharacter_violationOnVehiclePlate() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate("12@3456");
        Set<ConstraintViolation<ClientRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).isNotEmpty();
        Set<String> paths = violations.stream()
                .map(v -> v.getPropertyPath().toString())
                .collect(Collectors.toSet());
        assertThat(paths).contains("vehiclePlate");
    }

    @Test
    @DisplayName("33자 초과 시 vehiclePlate 위반")
    void tooLong_violationOnVehiclePlate() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate("1".repeat(33));
        Set<ConstraintViolation<ClientRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations.stream().map(v -> v.getPropertyPath().toString()))
                .contains("vehiclePlate");
    }

    @Test
    @DisplayName("위반 시 메시지에 차량번호 안내 문구 포함(프론트·API 일관성)")
    void violationMessage_containsPlateHint() {
        ClientRegistrationRequest req = validBase();
        req.setVehiclePlate("!!");
        Set<ConstraintViolation<ClientRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("vehiclePlate")
                && v.getMessage() != null
                && v.getMessage().contains("차량번호"));
    }
}
