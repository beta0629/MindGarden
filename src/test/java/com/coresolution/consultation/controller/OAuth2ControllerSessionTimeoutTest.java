package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AppleSignInService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.repository.TenantRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

/**
 * OAuth2 세션 생성 경로가 {@link SessionTimeoutProperties} SSOT를 쓰는지 검증.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller — SessionTimeoutProperties SSOT")
class OAuth2ControllerSessionTimeoutTest {

    private static final String TENANT_ID = "tenant-oauth-session-timeout";
    private static final long USER_ID = 42L;
    /** SessionConstants 폴백(4h)과 다른 값으로 properties 우선을 증명 */
    private static final int CUSTOM_TIMEOUT_SECONDS = 2 * 60 * 60;

    @Mock
    private OAuth2FactoryService oauth2FactoryService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private UserSessionService userSessionService;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private Environment environment;
    @Mock
    private AppleSignInService appleSignInService;
    @Mock
    private SessionTimeoutProperties sessionTimeoutProperties;
    @Mock
    private com.coresolution.consultation.config.SessionCookieSupport sessionCookieSupport;

    private final MeterRegistry meterRegistry = new SimpleMeterRegistry();

    @InjectMocks
    private OAuth2Controller controller;

    @BeforeEach
    void setUp() {
        when(sessionTimeoutProperties.getTimeoutSeconds()).thenReturn(CUSTOM_TIMEOUT_SECONDS);
    }

    @Test
    @DisplayName("mobileOAuth2Callback: setMaxInactiveInterval은 SessionTimeoutProperties 초 값")
    void mobileOAuth2Callback_usesSessionTimeoutProperties() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail("oauth-timeout@example.com");
        user.setName("세션타임아웃");
        user.setNickname("timeout");
        user.setRole(UserRole.CLIENT);
        user.setTenantId(TENANT_ID);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(eq(TENANT_ID), eq(USER_ID)))
                .thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("oauth2_tenant_id", TENANT_ID);
        request.setSession(session);

        Map<String, Object> body = new HashMap<>();
        body.put("provider", "KAKAO");
        body.put("userId", String.valueOf(USER_ID));

        ResponseEntity<?> response = controller.mobileOAuth2Callback(body, request, session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(session.getMaxInactiveInterval()).isEqualTo(CUSTOM_TIMEOUT_SECONDS);
    }
}
