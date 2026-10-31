package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.service.impl.BearerIdleSessionServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Access JWT sid 를 JSESSIONID 로 보내도 쿠키 경로가 Bearer 세션을 되살리지 못함을 고정한다.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SessionBasedAuthenticationFilter — JWT sid 를 JSESSIONID 로 재사용 차단")
class SessionBasedAuthenticationFilterBearerSidTest {

    private static final String REQUEST_PATH = "/api/v1/auth/current-user";

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private SessionBasedAuthenticationFilter filter;

    private final Map<String, UserSession> store = new HashMap<>();

    private BearerIdleSessionServiceImpl bearerService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(filter, "sessionTimeoutProperties",
                new SessionTimeoutProperties(Duration.ofHours(4)));
        bearerService = new BearerIdleSessionServiceImpl(userSessionService,
                new SessionTimeoutProperties(Duration.ofHours(4)), "test-server-key");
        when(userSessionService.getActiveSession(anyString()))
                .thenAnswer(inv -> store.get(inv.<String>getArgument(0)));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("JWT sid 를 JSESSIONID 로 보내면 Bearer 행을 찾지 못해 인증 없음")
    void rawJwtSidAsCookie_doesNotRevive() throws Exception {
        String sid = UUID.randomUUID().toString();
        String key = bearerService.toServerSessionKey(sid);
        store.put(key, activeRow(key));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setCookies(new Cookie("JSESSIONID", sid));
        filter.doFilterInternal(request, new MockHttpServletResponse(), filterChain);

        assertThat(key).isNotEqualTo(sid).startsWith(SessionConstants.BEARER_SESSION_KEY_PREFIX);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Bearer 서버 키를 JSESSIONID 로 보내도 조회하지 않고 인증 없음")
    void bearerKeyAsCookie_isRejected() throws Exception {
        String key = bearerService.toServerSessionKey(UUID.randomUUID().toString());
        store.put(key, activeRow(key));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setCookies(new Cookie("JSESSIONID", key));
        filter.doFilterInternal(request, new MockHttpServletResponse(), filterChain);

        verify(userSessionService, never()).getActiveSession(eq(key));
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private static UserSession activeRow(String sessionId) {
        User user = User.builder().email("bearer-sid@example.com").role(UserRole.CLIENT).build();
        user.setId(77L);
        user.setTenantId("tenant-bearer-sid");
        return UserSession.builder()
                .sessionId(sessionId)
                .user(user)
                .isActive(true)
                .lastActivityAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
    }
}
