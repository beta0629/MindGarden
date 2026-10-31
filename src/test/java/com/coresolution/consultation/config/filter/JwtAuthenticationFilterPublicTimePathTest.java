package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import com.coresolution.consultation.config.DuplicateLoginAccessBlockRegistry;
import com.coresolution.consultation.constant.SystemTimeConstants;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthTokenRevocationService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;

/**
 * JwtAuthenticationFilter.shouldNotFilter 에 /api/v1/time 이 포함되는지 회귀.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@DisplayName("JwtAuthenticationFilter public time path")
class JwtAuthenticationFilterPublicTimePathTest {

    @Test
    @DisplayName("GET /api/v1/time 은 JWT 필터를 건너뛴다")
    void shouldNotFilter_timePath() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                mock(JwtService.class),
                mock(UserService.class),
                mock(UserRepository.class),
                mock(DuplicateLoginAccessBlockRegistry.class),
                mock(AuthTokenRevocationService.class),
                null);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", SystemTimeConstants.API_PATH);
        request.setRequestURI(SystemTimeConstants.API_PATH);

        java.lang.reflect.Method method = JwtAuthenticationFilter.class
                .getDeclaredMethod("shouldNotFilter", jakarta.servlet.http.HttpServletRequest.class);
        method.setAccessible(true);
        boolean skip = (boolean) method.invoke(filter, request);
        assertThat(skip).isTrue();
    }
}
