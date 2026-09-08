package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.core.controller.dto.OnboardingDecisionRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.security.CaptchaVerifier;
import com.coresolution.core.service.OnboardingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

/**
 * OnboardingController 민감 엔드포인트 fail-closed 권한 가드 단위 테스트.
 *
 * <p>P0: URI prefix 분기 제거 후 양 매핑 모두 {@code requireOps()} 가 적용되는지 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingController — 민감 API OPS fail-closed")
class OnboardingControllerAuthzTest {

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

    @InjectMocks
    private OnboardingController onboardingController;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        OAuth2DomainUtil oauth2DomainUtil = new OAuth2DomainUtil();
        ReflectionTestUtils.setField(oauth2DomainUtil, "mainDomainsConfig",
                "core-solution.co.kr,dev.core-solution.co.kr");
        ReflectionTestUtils.setField(oauth2DomainUtil, "subdomainPatternsConfig",
                "^dev\\.core-solution\\.co\\.kr$,.*\\.dev\\.core-solution\\.co\\.kr,.*\\.core-solution\\.co\\.kr");
        ReflectionTestUtils.setField(oauth2DomainUtil, "removeRegexPattern", true);
        oauth2DomainUtil.init();
        ReflectionTestUtils.setField(onboardingController, "oauth2DomainUtil", oauth2DomainUtil);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 decide → AuthenticationCredentialsNotFoundException (서비스 미호출)")
    void decide_unauthenticated_throws401Equivalent() {
        OnboardingDecisionRequest payload =
                new OnboardingDecisionRequest(OnboardingStatus.APPROVED, "actor-1", "note");

        assertThatThrownBy(() -> onboardingController.decide(1L, payload))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        verifyNoInteractions(onboardingService);
    }

    @Test
    @DisplayName("미인증 getPendingRequests → AuthenticationCredentialsNotFoundException")
    void getPendingRequests_unauthenticated_throws() {
        assertThatThrownBy(() -> onboardingController.getPendingRequests())
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        verifyNoInteractions(onboardingService);
    }

    @Test
    @DisplayName("미인증 getRequest → AuthenticationCredentialsNotFoundException")
    void getRequest_unauthenticated_throws() {
        assertThatThrownBy(() -> onboardingController.getRequest(99L))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        verify(onboardingService, never()).getById(99L);
    }

    @Test
    @DisplayName("ROLE_ADMIN 만으로는 decide 거부 (403 상당 AccessDeniedException)")
    void decide_adminWithoutOps_throwsAccessDenied() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin-user",
                        "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        OnboardingDecisionRequest payload =
                new OnboardingDecisionRequest(OnboardingStatus.REJECTED, "actor-1", "no");

        assertThatThrownBy(() -> onboardingController.decide(1L, payload))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(onboardingService);
    }

    @Test
    @DisplayName("미인증 retryApproval → AuthenticationCredentialsNotFoundException")
    void retryApproval_unauthenticated_throws() {
        assertThatThrownBy(() -> onboardingController.retryApproval(1L, null))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        verifyNoInteractions(onboardingService);
    }
}
