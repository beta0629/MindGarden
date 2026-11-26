package com.coresolution.consultation.config.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.core.constants.SecurityRoleConstants;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * {@code client_event} 백필 공유 시크릿 헤더 → {@code ROLE_ADMIN} 부여 필터 (.dev 전용).
 *
 * <p>env {@link ClientEventBackfillConstants#BACKFILL_TOKEN_ENV} 가 비어 있으면 no-op
 * (시크릿 경로 불가 — ADMIN 세션/JWT 만). 헤더 불일치·누락도 no-op → Security 가 401/403.
 * 토큰 값은 로그에 남기지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@Component
@Profile(ClientEventBackfillConstants.PROFILE_DEV)
public class ClientEventBackfillTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String PRINCIPAL = "client-event-backfill-token";

    private final Environment environment;

    public ClientEventBackfillTokenAuthenticationFilter(Environment environment) {
        this.environment = environment;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return path == null || !ClientEventBackfillConstants.API_PATH.equals(path);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String expected = environment.getProperty(ClientEventBackfillConstants.BACKFILL_TOKEN_ENV);
        if (!StringUtils.hasText(expected)) {
            log.debug("client_event backfill token env unset — secret path disabled");
            filterChain.doFilter(request, response);
            return;
        }

        String provided = request.getHeader(ClientEventBackfillConstants.BACKFILL_TOKEN_HEADER);
        if (!StringUtils.hasText(provided)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (constantTimeEquals(expected.trim(), provided.trim())) {
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            PRINCIPAL,
                            null,
                            List.of(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN)));
            authentication.setDetails("backfill-token");
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.info("client_event backfill authenticated via shared secret header");
        }

        filterChain.doFilter(request, response);
    }

    /**
     * constant-time 문자열 비교. 길이가 다르면 false (MessageDigest.isEqual 규약).
     *
     * @param expected 기대 토큰
     * @param provided 요청 헤더 값
     * @return 일치 여부
     */
    static boolean constantTimeEquals(String expected, String provided) {
        if (expected == null || provided == null) {
            return false;
        }
        byte[] a = expected.getBytes(StandardCharsets.UTF_8);
        byte[] b = provided.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }
}
