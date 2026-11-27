package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AppleSignInService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.OAuthWebSessionExchangeCodeService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.repository.TenantRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * 웹 OAuth {@code issueWebOAuthJwtPair} smoke — Access 발급은 JwtService 훅이 sid 등록.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller — issueWebOAuthJwtPair smoke")
class OAuth2ControllerJwtBearerIdleBindTest {

    @Mock private OAuth2FactoryService oauth2FactoryService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private OAuth2DomainUtil oauth2DomainUtil;
    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserSessionService userSessionService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private com.coresolution.consultation.service.SystemConfigService systemConfigService;
    @Mock private TenantRepository tenantRepository;
    @Mock private Environment environment;
    @Mock private AppleSignInService appleSignInService;
    @Mock private SessionTimeoutProperties sessionTimeoutProperties;
    @Mock private SessionCookieSupport sessionCookieSupport;
    @Mock private OAuthWebSessionExchangeCodeService oauthWebSessionExchangeCodeService;

    private final MeterRegistry meterRegistry = new SimpleMeterRegistry();

    @InjectMocks
    private OAuth2Controller controller;

    private String accessToken;
    private String refreshToken;

    @BeforeEach
    void setUp() {
        accessToken = "oauth-access." + UUID.randomUUID() + ".jwt";
        refreshToken = "oauth-refresh." + UUID.randomUUID() + ".jwt";
        when(dynamicPermissionService.getUserPermissionsAsStringList(any(User.class)))
                .thenReturn(List.of("READ"));
        when(jwtService.generateTokenForOAuth(any(User.class), any())).thenReturn(accessToken);
        when(jwtService.generateRefreshTokenForOAuth(any(User.class))).thenReturn(refreshToken);
    }

    @ParameterizedTest(name = "issueWebOAuthJwtPair {0}")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("issueWebOAuthJwtPair — generateTokenForOAuth + refresh 저장")
    void issueWebOAuthJwtPair_issuesTokens(UserRole role) throws Exception {
        User user = sampleUser(role);
        MockHttpServletRequest request = new MockHttpServletRequest();

        Method method = OAuth2Controller.class.getDeclaredMethod(
                "issueWebOAuthJwtPair", User.class, HttpServletRequest.class);
        method.setAccessible(true);
        String[] pair = (String[]) method.invoke(controller, user, request);

        assertThat(pair).containsExactly(accessToken, refreshToken);
        verify(jwtService).generateTokenForOAuth(eq(user), any());
        verify(refreshTokenService).createRefreshToken(eq(user), eq(refreshToken), eq(request));
    }

    private static User sampleUser(UserRole role) {
        User user = User.builder()
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.com")
                .name("OAuth바인드")
                .role(role)
                .isActive(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId("tenant-" + UUID.randomUUID());
        return user;
    }
}
