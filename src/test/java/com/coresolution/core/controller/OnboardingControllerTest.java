package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.controller.dto.OnboardingCaptchaSiteKeyResponse;
import com.coresolution.core.controller.dto.OnboardingCreateRequest;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.constant.TestDocumentationIps;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

/**
 * {@link OnboardingController} CAPTCHA·site-key 동작 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@ExtendWith(MockitoExtension.class)
class OnboardingControllerTest {

    @Mock
    private OnboardingService onboardingService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CaptchaVerifier captchaVerifier;

    @Mock
    private MindgardenSecurityProperties mindgardenSecurityProperties;

    @Mock
    private HttpSession httpSession;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private OnboardingController onboardingController;

    private OnboardingCreateRequest basePayload() {
        return new OnboardingCreateRequest(null, "테넌트", "a@b.com", RiskLevel.LOW, null, "ACADEMY", null,
                null, null, "ValidPass1!", null);
    }

    @Test
    @DisplayName("실검증 모드에서 captchaToken 이 비어 있으면 IllegalArgumentException")
    void create_whenCaptchaRequiredAndTokenBlank_throws() {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(true);

        OnboardingCreateRequest payload = basePayload();

        assertThatThrownBy(() -> onboardingController.create(payload, httpSession, httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_CAPTCHA_TOKEN_REQUIRED);

        verify(onboardingService, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("실검증 모드에서 verify 실패 시 IllegalArgumentException")
    void create_whenCaptchaVerifyFails_throws() {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(true);
        when(httpRequest.getHeader("X-Forwarded-For"))
                .thenReturn(TestDocumentationIps.DOC_NET_2_EXAMPLE + ", 10.0.0.1");
        when(captchaVerifier.verify("tok", TestDocumentationIps.DOC_NET_2_EXAMPLE)).thenReturn(false);

        OnboardingCreateRequest payload = new OnboardingCreateRequest(null, "테넌트", "a@b.com", RiskLevel.LOW,
                null, "ACADEMY", null, null, null, "ValidPass1!", "tok");

        assertThatThrownBy(() -> onboardingController.create(payload, httpSession, httpRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_CAPTCHA_VERIFICATION_FAILED);
    }

    @Test
    @DisplayName("no-op 모드에서는 서비스 create 가 호출된다")
    void create_whenCaptchaNotRequired_proceeds() throws Exception {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(false);
        lenient().when(objectMapper.writeValueAsString(any()))
                .thenReturn("{\"adminPassword\":\"ValidPass1!\"}");

        OnboardingRequest created = new OnboardingRequest();
        created.setId(1L);
        created.setTenantName("테넌트");
        created.setRequestedBy("a@b.com");
        created.setCreatedAt(LocalDateTime.now());
        created.setUpdatedAt(LocalDateTime.now());

        when(onboardingService.create(any(), any(), any(), any(), any(), any())).thenReturn(created);

        OnboardingCreateRequest payload = basePayload();

        ResponseEntity<com.coresolution.core.dto.ApiResponse<OnboardingRequest>> response =
                onboardingController.create(payload, httpSession, httpRequest);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getId()).isEqualTo(1L);
        verify(captchaVerifier, never()).verify(any(), any());
    }

    @Test
    @DisplayName("site-key: 실검증 비활성 시 enabled false·siteKey null")
    void getCaptchaSiteKey_whenDisabled_returnsDisabled() {
        MindgardenSecurityProperties.Captcha captcha = new MindgardenSecurityProperties.Captcha();
        captcha.setEnabled(false);
        when(mindgardenSecurityProperties.getCaptcha()).thenReturn(captcha);

        ResponseEntity<com.coresolution.core.dto.ApiResponse<OnboardingCaptchaSiteKeyResponse>> response =
                onboardingController.getCaptchaSiteKey();

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().enabled()).isFalse();
        assertThat(response.getBody().getData().siteKey()).isNull();
    }

    @Test
    @DisplayName("site-key: 실검증 활성·site key 설정 시 반환")
    void getCaptchaSiteKey_whenActive_returnsSiteKey() {
        MindgardenSecurityProperties.Captcha captcha = new MindgardenSecurityProperties.Captcha();
        captcha.setEnabled(true);
        captcha.setSecretKey("secret");
        captcha.setSiteKey("site-key-public");
        when(mindgardenSecurityProperties.getCaptcha()).thenReturn(captcha);

        ResponseEntity<com.coresolution.core.dto.ApiResponse<OnboardingCaptchaSiteKeyResponse>> response =
                onboardingController.getCaptchaSiteKey();

        assertThat(response.getBody().getData().enabled()).isTrue();
        assertThat(response.getBody().getData().siteKey()).isEqualTo("site-key-public");
    }
}
