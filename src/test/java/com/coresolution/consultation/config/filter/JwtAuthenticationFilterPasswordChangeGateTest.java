package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.auth.PasswordChangeGate;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
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
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 제한 클레임 JWT 는 허용 경로가 아니면 필터 체인을 타지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter 비밀번호 변경 가드")
class JwtAuthenticationFilterPasswordChangeGateTest {

    private static final String TOKEN = "limited.jwt";

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("제한 토큰의 일정 조회는 403 이고 다음 필터로 가지 않는다")
    void limitedToken_blocksOtherApi() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        stubToken(true);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/schedules");
        when(request.getContextPath()).thenReturn("");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, never()).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_FORBIDDEN);
        assertThat(response.getContentAsString()).contains(PasswordChangeGate.ERROR_CODE);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("제한 토큰도 비밀번호 변경 API 는 통과한다")
    void limitedToken_allowsPasswordChange() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        stubToken(true);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/password/change");
        when(request.getContextPath()).thenReturn("");
        when(jwtService.extractUsername(TOKEN)).thenReturn("user-7");
        when(jwtService.extractTenantId(TOKEN)).thenReturn("tenant-gate");
        when(userRepository.findByTenantIdAndUserId("tenant-gate", "user-7"))
                .thenReturn(Optional.of(activeUser()));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(HttpServletResponse.SC_FORBIDDEN);
    }

    private void stubToken(boolean required) {
        when(request.getHeader("Authorization")).thenReturn("Bearer " + TOKEN);
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.isPasswordChangeRequired(TOKEN)).thenReturn(required);
    }

    private static User activeUser() {
        User user = User.builder()
                .email("client@example.com")
                .role(UserRole.CLIENT)
                .isPasswordChanged(false)
                .build();
        user.setId(7L);
        user.setUserId("user-7");
        user.setTenantId("tenant-gate");
        user.setLifecycleState(LifecycleState.ACTIVE);
        user.setIsActive(true);
        return user;
    }
}
