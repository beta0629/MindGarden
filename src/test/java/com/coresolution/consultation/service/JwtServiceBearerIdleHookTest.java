package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Access JWT mint 훅 — {@code generateToken(User,…)} / {@code generateTokenForOAuth}
 * 직후 {@link BearerIdleSessionService#ensureActiveSession} 단일 등록 검증.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtService — Access JWT mint → ensureActiveSession 훅")
class JwtServiceBearerIdleHookTest {

    @Mock
    private BearerIdleSessionService bearerIdleSessionService;

    @SuppressWarnings("unchecked")
    private final ObjectProvider<BearerIdleSessionService> provider = mock(ObjectProvider.class);

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);
        when(provider.getIfAvailable()).thenReturn(bearerIdleSessionService);
        jwtService.setBearerIdleSessionServiceProvider(provider);
        RequestContextHolder.resetRequestAttributes();
    }

    @ParameterizedTest(name = "{0} + {1}")
    @MethodSource("roleAndGenerator")
    @DisplayName("Access 발급 직후 mint sid 로 ensureActiveSession 호출")
    void generateAccess_registersBearerIdleWithMintedSid(UserRole role, String generator) {
        // Given
        User user = user(role);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("User-Agent", "junit-hook-agent");
        request.setRemoteAddr("127.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        // When
        String access = switch (generator) {
            case "generateToken" -> jwtService.generateToken(user, List.of("READ"), false);
            case "generateTokenForOAuth" -> jwtService.generateTokenForOAuth(user, List.of("READ"));
            case "generateTokenUserOnly" -> jwtService.generateToken(user);
            default -> throw new IllegalStateException(generator);
        };

        // Then
        String sid = jwtService.extractSessionId(access);
        assertThat(sid).as("Access JWT 에 sid 클레임").isNotBlank();
        ArgumentCaptor<String> sidCaptor = ArgumentCaptor.forClass(String.class);
        verify(bearerIdleSessionService).ensureActiveSession(
                eq(user), sidCaptor.capture(), any(), eq("junit-hook-agent"));
        assertThat(sidCaptor.getValue()).isEqualTo(sid);
        String claimSid = jwtService.extractClaim(access,
                claims -> claims.get(SessionManagementConstants.JWT_CLAIM_SESSION_ID, String.class));
        assertThat(claimSid).isEqualTo(sid);
    }

    static Stream<org.junit.jupiter.params.provider.Arguments> roleAndGenerator() {
        return Stream.of(UserRole.CLIENT, UserRole.CONSULTANT, UserRole.ADMIN)
                .flatMap(role -> Stream.of("generateToken", "generateTokenForOAuth", "generateTokenUserOnly")
                        .map(gen -> org.junit.jupiter.params.provider.Arguments.of(role, gen)));
    }

    @Test
    @DisplayName("email-only generateToken 은 ensureActiveSession 미호출 (sid 없음)")
    void generateTokenEmailOnly_doesNotRegisterBearerIdle() {
        jwtService.generateToken("someone@example.com");
        verify(bearerIdleSessionService, never()).ensureActiveSession(any(), anyString(), any(), any());
    }

    @Test
    @DisplayName("provider 없음(단위 new JwtService) 이어도 발급 성공 · ensure 스킵")
    void withoutProvider_issueSucceedsWithoutEnsure() {
        JwtService bare = new JwtService();
        ReflectionTestUtils.setField(bare, "secretKey",
                Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(bare, "jwtExpiration", 3_600_000L);
        String access = bare.generateToken(user(UserRole.CLIENT), List.of("READ"));
        assertThat(bare.extractSessionId(access)).isNotBlank();
        verify(bearerIdleSessionService, never()).ensureActiveSession(any(), anyString(), any(), any());
    }

    @Test
    @DisplayName("RequestContext 없으면 IP/UA null 로 ensure (fail-open)")
    void noRequestContext_ensureWithNullIpUa() {
        RequestContextHolder.resetRequestAttributes();
        User user = user(UserRole.CONSULTANT);
        String access = jwtService.generateTokenForOAuth(user);
        String sid = jwtService.extractSessionId(access);
        verify(bearerIdleSessionService).ensureActiveSession(eq(user), eq(sid), isNull(), isNull());
    }

    private static User user(UserRole role) {
        User user = User.builder()
                .userId("uid-" + UUID.randomUUID())
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.com")
                .name("훅테스터")
                .role(role)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId("tenant-" + UUID.randomUUID());
        return user;
    }
}
