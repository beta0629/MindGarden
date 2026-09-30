package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import com.coresolution.consultation.service.JwtService;

/**
 * {@link OpsAuthController} 관리자 비밀번호 미설정 시 로그인 거부 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
class OpsAuthControllerPasswordTest {

    private static final String ADMIN_ID = "unit-ops-admin";
    private static final String DUMMY_PASSWORD = "unit-test-dummy";

    private JwtService jwtService;
    private OpsAuthController controller;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        controller = new OpsAuthController(jwtService);
        ReflectionTestUtils.setField(controller, "opsAdminUsername", ADMIN_ID);
        ReflectionTestUtils.setField(controller, "opsAdminRole", "HQ_ADMIN");
    }

    private OpsAuthController.LoginRequest request(String password) {
        OpsAuthController.LoginRequest req = new OpsAuthController.LoginRequest();
        req.setUserId(ADMIN_ID);
        req.setPassword(password);
        return req;
    }

    @Test
    @DisplayName("OPS_ADMIN_PASSWORD 미설정(빈 값): 로그인 거부, 토큰 미발급")
    void blankConfiguredPassword_rejected() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", "");

        assertThatThrownBy(() -> controller.login(request(DUMMY_PASSWORD)))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(anyMap(), anyString());
    }

    @Test
    @DisplayName("OPS_ADMIN_PASSWORD 미설정(null): 로그인 거부")
    void nullConfiguredPassword_rejected() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", null);

        assertThatThrownBy(() -> controller.login(request(DUMMY_PASSWORD)))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("비밀번호 불일치: 로그인 거부")
    void wrongPassword_rejected() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", DUMMY_PASSWORD);

        assertThatThrownBy(() -> controller.login(request(DUMMY_PASSWORD + "-x")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("env 비밀번호 일치: 로그인 성공")
    void matchingPassword_succeeds() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", DUMMY_PASSWORD);
        when(jwtService.generateToken(anyMap(), anyString())).thenReturn("unit-token");

        assertThat(controller.login(request(DUMMY_PASSWORD)).getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("OPS_ADMIN_PASSWORD 공백만: 미설정으로 간주해 로그인 거부 (공백 입력으로 우회 불가)")
    void whitespaceOnlyConfiguredPassword_rejected() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", "   ");

        assertThatThrownBy(() -> controller.login(request("   " + DUMMY_PASSWORD)))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(anyMap(), anyString());
    }

    @Test
    @DisplayName("다른 아이디 + 올바른 비밀번호: 로그인 거부")
    void otherUserIdWithCorrectPassword_rejected() {
        ReflectionTestUtils.setField(controller, "opsAdminPassword", DUMMY_PASSWORD);
        OpsAuthController.LoginRequest req = request(DUMMY_PASSWORD);
        req.setUserId(ADMIN_ID + "-other");

        assertThatThrownBy(() -> controller.login(req)).isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(anyMap(), anyString());
    }

    @Test
    @DisplayName("로그: 성공·실패 모두 비밀번호 값·길이를 남기지 않음")
    void login_neverLogsPasswordValueOrLength() {
        Logger logger = (Logger) LoggerFactory.getLogger(OpsAuthController.class);
        Level originalLevel = logger.getLevel();
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        logger.setLevel(Level.DEBUG);
        try {
            ReflectionTestUtils.setField(controller, "opsAdminPassword", DUMMY_PASSWORD);
            when(jwtService.generateToken(anyMap(), anyString())).thenReturn("unit-token");
            controller.login(request(DUMMY_PASSWORD));
            assertThatThrownBy(() -> controller.login(request(DUMMY_PASSWORD + "-x")))
                    .isInstanceOf(BadCredentialsException.class);

            assertThat(appender.list).isNotEmpty();
            for (ILoggingEvent event : appender.list) {
                String message = event.getFormattedMessage();
                assertThat(message).doesNotContain(DUMMY_PASSWORD);
                assertThat(message.toLowerCase()).doesNotContain("length");
            }
        } finally {
            logger.detachAppender(appender);
            logger.setLevel(originalLevel);
        }
    }
}
