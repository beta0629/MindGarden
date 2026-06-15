package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.constants.SecurityRoleConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link JwtAuthenticationFilter} 권한 매핑 회귀 테스트.
 *
 * <p>OPS_PORTAL_MIGRATION Phase 1b (P0 보안 정정): {@code case STAFF} 분기에서
 * 자동으로 부여되던 {@code ROLE_ADMIN} + {@code ROLE_OPS} 를 제거하고
 * {@code ROLE_STAFF} 만 부여하는지 확인한다.</p>
 *
 * <p>회귀 가드:</p>
 * <ul>
 *   <li>STAFF 인증 시 ROLE_ADMIN/ROLE_OPS 가 부여되지 않아야 한다 (P0 권한 상승 차단).</li>
 *   <li>ADMIN 인증 시 ROLE_OPS 가 자동 부여되지 않아야 한다 (본사 테넌트 가드는 별도 사이클).</li>
 *   <li>ADMIN(counselingEnabled=true) 인증 시 ROLE_CONSULTANT 가 함께 부여된다 (기존 동작 유지).</li>
 *   <li>CONSULTANT/CLIENT 인증 시 단일 역할만 부여된다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-15
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter 권한 매핑 회귀 (Phase 1b)")
class JwtAuthenticationFilterAuthoritiesTest {

    private static final String TENANT = "tenant-jwt-authorities";
    private static final String USER_ID = "user-authorities-1";
    private static final String EMAIL = "authorities@example.com";
    private static final String TOKEN = "valid.jwt.token";
    private static final String AUTH_HEADER = "Bearer " + TOKEN;
    private static final String REQUEST_PATH = "/api/v1/clients/me";

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("STAFF 인증 시 ROLE_STAFF 만 부여되고 ROLE_ADMIN/ROLE_OPS 는 부여되지 않는다 (P0 회귀 가드)")
    void staffUser_grantsOnlyRoleStaff_withoutAdminOrOps() throws Exception {
        User user = activeUserOf(UserRole.STAFF, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Set<String> authorities = currentAuthorities();
        assertThat(authorities)
            .as("STAFF 사용자는 ROLE_STAFF 만 받아야 한다")
            .containsExactly(SecurityRoleConstants.ROLE_STAFF);
        assertThat(authorities)
            .as("STAFF 사용자에게 ROLE_ADMIN 이 자동 부여되면 P0 권한 상승")
            .doesNotContain(SecurityRoleConstants.ROLE_ADMIN);
        assertThat(authorities)
            .as("STAFF 사용자에게 ROLE_OPS 가 자동 부여되면 P0 권한 상승")
            .doesNotContain(SecurityRoleConstants.ROLE_OPS);
    }

    @Test
    @DisplayName("ADMIN 인증 시 ROLE_ADMIN 만 부여되고 ROLE_OPS 는 자동 부여되지 않는다")
    void adminUser_grantsOnlyRoleAdmin_withoutOps() throws Exception {
        User user = activeUserOf(UserRole.ADMIN, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Set<String> authorities = currentAuthorities();
        assertThat(authorities)
            .as("ADMIN 사용자는 ROLE_ADMIN 만 받아야 한다 (counselingEnabled=false)")
            .containsExactly(SecurityRoleConstants.ROLE_ADMIN);
        assertThat(authorities)
            .as("ADMIN 자동 ROLE_OPS 부여는 본사 테넌트 가드와 함께 별도 사이클에서 처리")
            .doesNotContain(SecurityRoleConstants.ROLE_OPS);
    }

    @Test
    @DisplayName("ADMIN + counselingEnabled=true 인증 시 ROLE_ADMIN + ROLE_CONSULTANT 가 부여된다")
    void adminWithCounseling_grantsAdminAndConsultant() throws Exception {
        User user = activeUserOf(UserRole.ADMIN, true);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Set<String> authorities = currentAuthorities();
        assertThat(authorities)
            .as("ADMIN(counselingEnabled=true)은 ROLE_ADMIN + ROLE_CONSULTANT 를 받아야 한다")
            .containsExactlyInAnyOrder(
                SecurityRoleConstants.ROLE_ADMIN,
                SecurityRoleConstants.ROLE_PREFIX + UserRole.CONSULTANT.name());
        assertThat(authorities)
            .doesNotContain(SecurityRoleConstants.ROLE_OPS);
    }

    @Test
    @DisplayName("CONSULTANT 인증 시 ROLE_CONSULTANT 만 부여된다")
    void consultantUser_grantsOnlyRoleConsultant() throws Exception {
        User user = activeUserOf(UserRole.CONSULTANT, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Set<String> authorities = currentAuthorities();
        assertThat(authorities)
            .containsExactly(SecurityRoleConstants.ROLE_PREFIX + UserRole.CONSULTANT.name());
        assertThat(authorities)
            .doesNotContain(SecurityRoleConstants.ROLE_ADMIN, SecurityRoleConstants.ROLE_OPS);
    }

    @Test
    @DisplayName("CLIENT 인증 시 ROLE_CLIENT 만 부여된다")
    void clientUser_grantsOnlyRoleClient() throws Exception {
        User user = activeUserOf(UserRole.CLIENT, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        Set<String> authorities = currentAuthorities();
        assertThat(authorities)
            .containsExactly(SecurityRoleConstants.ROLE_PREFIX + UserRole.CLIENT.name());
        assertThat(authorities)
            .doesNotContain(SecurityRoleConstants.ROLE_ADMIN, SecurityRoleConstants.ROLE_OPS);
    }

    private Set<String> currentAuthorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication)
            .as("인증 컨텍스트가 설정되어 있어야 한다")
            .isNotNull();
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());
    }

    private User activeUserOf(UserRole role, boolean counselingEnabled) {
        User user = User.builder()
            .userId(USER_ID)
            .email(EMAIL)
            .password("{bcrypt}$2a$10$0123456789012345678901w")
            .name("authorities-test")
            .role(role)
            .isActive(true)
            .isPasswordChanged(true)
            .counselingEnabled(counselingEnabled)
            .build();
        user.setId(101L);
        user.setTenantId(TENANT);
        user.setLifecycleState(LifecycleState.ACTIVE);
        return user;
    }

    private void stubRequest(User user) {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        when(request.getHeader("Authorization")).thenReturn(AUTH_HEADER);
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractUsername(TOKEN)).thenReturn(USER_ID);
        when(jwtService.extractTenantId(TOKEN)).thenReturn(TENANT);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID))
            .thenReturn(Optional.of(user));
    }
}
