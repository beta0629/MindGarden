package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

import com.coresolution.consultation.config.DuplicateLoginAccessBlockRegistry;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 중복 로그인 후 구 Access JWT 거부 게이트.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter duplicate-login access 거부")
class JwtAuthenticationFilterDuplicateLoginAccessTest {

    private static final String TENANT = "tenant-dup-jwt";
    private static final String USER_ID = "user-dup";
    private static final String TOKEN = "old.access.jwt";
    private static final String AUTH_HEADER = "Bearer " + TOKEN;
    private static final String REQUEST_PATH = "/api/v1/clients/me";

    @Mock private JwtService jwtService;
    @Mock private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private DuplicateLoginAccessBlockRegistry blockRegistry;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userService, userRepository, blockRegistry);
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        when(request.getHeader("Authorization")).thenReturn(AUTH_HEADER);
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractUsername(TOKEN)).thenReturn(USER_ID);
        when(jwtService.extractTenantId(TOKEN)).thenReturn(TENANT);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("인메모리 block 시 SecurityContext 미설정")
    void blockedByRegistry_skipsAuthentication() throws Exception {
        User user = activeUser(42L);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(42L)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("lastLoginAt 이후 발급이 아닌 JWT 거부")
    void issuedBeforeLastLogin_skipsAuthentication() throws Exception {
        User user = activeUser(42L);
        user.setLastLoginAt(LocalDateTime.now());
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(42L)).thenReturn(false);
        // 2시간 전 발급 → grace(30s)보다 훨씬 이전
        when(jwtService.extractIssuedAt(TOKEN))
            .thenReturn(new Date(System.currentTimeMillis() - 7_200_000L));

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("신규 로그인 직후 JWT(iat ≈ lastLoginAt) 는 허용")
    void freshTokenAfterLogin_allowsAuthentication() throws Exception {
        User user = activeUser(42L);
        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginAt(now);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(42L)).thenReturn(false);
        when(jwtService.extractIssuedAt(TOKEN)).thenReturn(new Date());

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    private static User activeUser(Long pk) {
        User user = User.builder()
            .userId(USER_ID)
            .email("dup@example.com")
            .role(UserRole.CLIENT)
            .isActive(true)
            .lifecycleState(LifecycleState.ACTIVE)
            .build();
        user.setId(pk);
        user.setTenantId(TENANT);
        return user;
    }
}
