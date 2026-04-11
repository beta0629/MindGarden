package com.coresolution.core.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.integrationtest.onboarding.OnboardingControllerMvcTestApplication;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.service.OnboardingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link OnboardingController#create} 의 CAPTCHA 분기 MockMvc 검증.
 * <p>
 * 로컬 실행: {@code mvn -q -Dtest=OnboardingControllerCaptchaWebMvcTest test}
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@SpringBootTest(classes = OnboardingControllerMvcTestApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("OnboardingController POST /requests CAPTCHA MockMvc")
class OnboardingControllerCaptchaWebMvcTest {

    private static final String CREATE_PATH = "/api/v1/onboarding/requests";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OnboardingService onboardingService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private CaptchaVerifier captchaVerifier;

    @MockBean
    private MindgardenSecurityProperties mindgardenSecurityProperties;

    private String buildCreateBody(boolean includeCaptchaToken, String captchaTokenValue) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tenantName", "테스트 테넌트");
        m.put("requestedBy", "req-" + System.nanoTime() + "@example.com");
        m.put("riskLevel", "LOW");
        m.put("checklistJson", "{\"adminPassword\":\"SecurePw123!\"}");
        m.put("businessType", "ACADEMY");
        if (includeCaptchaToken) {
            m.put("captchaToken", captchaTokenValue);
        }
        return objectMapper.writeValueAsString(m);
    }

    @Test
    @DisplayName("CAPTCHA 비활성화(또는 시크릿 없음)일 때 토큰 없이도 생성 호출이 진행된다")
    void create_whenCaptchaNotRequired_passesWithoutToken() throws Exception {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(false);

        OnboardingRequest created = OnboardingRequest.builder()
                .id(1L)
                .tenantName("테스트 테넌트")
                .requestedBy("req@example.com")
                .status(OnboardingStatus.PENDING)
                .riskLevel(RiskLevel.LOW)
                .checklistJson("{\"adminPassword\":\"x\"}")
                .businessType("ACADEMY")
                .build();
        when(onboardingService.create(any(), any(), any(), any(), any(), any())).thenReturn(created);

        mockMvc.perform(post(CREATE_PATH).contentType(MediaType.APPLICATION_JSON)
                .content(buildCreateBody(false, null))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(onboardingService).create(any(), any(), any(), any(), any(), any());
        verify(captchaVerifier).requiresCaptchaToken();
        verify(captchaVerifier, never()).verify(any(), any());
    }

    @Test
    @DisplayName("CAPTCHA 검증 모드에서 토큰이 없으면 400(ILLEGAL_ARGUMENT)")
    void create_whenCaptchaRequiredAndTokenMissing_returns400() throws Exception {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(true);

        mockMvc.perform(post(CREATE_PATH).contentType(MediaType.APPLICATION_JSON)
                .content(buildCreateBody(false, null))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ILLEGAL_ARGUMENT"))
                .andExpect(jsonPath("$.message").value(OnboardingConstants.ERROR_ONBOARDING_CAPTCHA_TOKEN_REQUIRED));

        verifyNoInteractions(onboardingService);
        verify(captchaVerifier).requiresCaptchaToken();
        verify(captchaVerifier, never()).verify(any(), any());
    }

    @Test
    @DisplayName("CAPTCHA 검증 모드에서 검증기가 false를 반환하면 400")
    void create_whenCaptchaVerifierRejects_returns400() throws Exception {
        when(captchaVerifier.requiresCaptchaToken()).thenReturn(true);
        when(captchaVerifier.verify(eq("bad-token"), any())).thenReturn(false);

        mockMvc.perform(post(CREATE_PATH).contentType(MediaType.APPLICATION_JSON)
                .content(buildCreateBody(true, "bad-token"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ILLEGAL_ARGUMENT"))
                .andExpect(jsonPath("$.message").value(OnboardingConstants.ERROR_ONBOARDING_CAPTCHA_VERIFICATION_FAILED));

        verify(captchaVerifier).verify(eq("bad-token"), any());
        verifyNoInteractions(onboardingService);
    }
}
