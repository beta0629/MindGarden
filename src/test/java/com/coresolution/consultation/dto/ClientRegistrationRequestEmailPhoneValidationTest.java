package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;

import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.validation.OnAdminClientRegister;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.groups.Default;

/**
 * 내담자 등록 그룹(OnAdminClientRegister) 기준 이메일·휴대폰 Bean Validation.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
@DisplayName("ClientRegistrationRequest 이메일·휴대폰 등록 검증")
class ClientRegistrationRequestEmailPhoneValidationTest {

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

    private Set<ConstraintViolation<ClientRegistrationRequest>> validateForRegister(ClientRegistrationRequest req) {
        return validator.validate(req, Default.class, OnAdminClientRegister.class);
    }

    @Test
    @DisplayName("이메일·휴대폰 모두 비어 있으면 위반")
    void bothEmpty_violation() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail("");
        req.setPhone("   ");
        Set<ConstraintViolation<ClientRegistrationRequest>> v = validateForRegister(req);
        assertThat(v).isNotEmpty();
        assertThat(v).anyMatch(x -> ClientRegistrationConstants.MSG_EMAIL_OR_PHONE_REQUIRED.equals(x.getMessage()));
    }

    @Test
    @DisplayName("휴대폰만 있으면 통과")
    void phoneOnly_ok() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setPhone("010-1234-5678");
        assertThat(validateForRegister(req)).isEmpty();
    }

    @Test
    @DisplayName("이메일만 있으면 통과")
    void emailOnly_ok() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail("only-" + UUID.randomUUID() + "@example.com");
        assertThat(validateForRegister(req)).isEmpty();
    }

    @Test
    @DisplayName("이메일·휴대폰 둘 다 있으면 통과")
    void emailAndPhone_ok() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail("both-" + UUID.randomUUID() + "@example.com");
        req.setPhone("010-9876-5432");
        assertThat(validateForRegister(req)).isEmpty();
    }

    @Test
    @DisplayName("이메일 형식 오류 시 위반")
    void badEmail_violation() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail("not-an-email");
        Set<ConstraintViolation<ClientRegistrationRequest>> v = validateForRegister(req);
        assertThat(v).isNotEmpty();
        assertThat(v).anyMatch(x -> ClientRegistrationConstants.MSG_INVALID_EMAIL_FORMAT.equals(x.getMessage()));
    }

    @Test
    @DisplayName("등록 그룹 없이 검증 시 이메일·휴대폰 AssertTrue는 스킵(수정 API 등)")
    void withoutRegisterGroup_assertTrueSkipped() {
        ClientRegistrationRequest req = new ClientRegistrationRequest();
        req.setEmail(null);
        req.setPhone(null);
        assertThat(validator.validate(req)).isEmpty();
    }
}
