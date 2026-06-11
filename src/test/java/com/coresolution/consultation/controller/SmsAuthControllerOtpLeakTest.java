package com.coresolution.consultation.controller;

import java.util.Map;

import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * B4 hotfix (PR #227 후속) — {@link SmsAuthController} OTP 평문 응답 회귀 가드.
 *
 * <p>표준화 v2 Phase 1 B4: 테스트 모드에서도 응답 본문에 {@code verificationCode}
 * 키가 절대 포함되지 않아야 한다(자동화 도구·proxy 캐시·로그 누출 방지).
 *
 * <p>참조: {@code docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md} §B4,
 * PR #227 commit {@code 040d91cf8} SSOT 패턴.
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SmsAuthController — B4 OTP 평문 응답 회귀 가드")
class SmsAuthControllerOtpLeakTest {

    private static final String PHONE = "01012345678";
    private static final String OTP_CODE = "654321";

    @Mock
    private SmsAuthService smsAuthService;

    @InjectMocks
    private SmsAuthController controller;

    @Test
    @DisplayName("testMode=true 응답에 verificationCode 키가 부재 (B4: 평문 OTP 응답 금지)")
    void sendVerificationCode_testMode_responseHasNoVerificationCodeKey() {
        when(smsAuthService.sendVerificationCode(PHONE)).thenReturn(OTP_CODE);
        when(smsAuthService.isTestMode()).thenReturn(true);

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.sendVerificationCode(PHONE);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> data = response.getBody().getData();
        assertThat(data).isNotNull();
        // testMode boolean flag 는 허용
        assertThat(data).containsEntry("testMode", true);
        // 평문 OTP 키·값 모두 금지
        assertThat(data).doesNotContainKey("verificationCode");
        assertThat(data.values()).doesNotContain(OTP_CODE);
    }

    @Test
    @DisplayName("testMode=false 응답에도 verificationCode 키가 부재")
    void sendVerificationCode_productionMode_responseHasNoVerificationCodeKey() {
        when(smsAuthService.sendVerificationCode(PHONE)).thenReturn(OTP_CODE);
        when(smsAuthService.isTestMode()).thenReturn(false);

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.sendVerificationCode(PHONE);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data).isNotNull();
        assertThat(data).doesNotContainKey("verificationCode");
        assertThat(data).doesNotContainKey("testMode");
        assertThat(data.values()).doesNotContain(OTP_CODE);
    }
}
