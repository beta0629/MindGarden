package com.coresolution.consultation.config.filter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * JWT 인증 필터 Phase 3: JWT 토큰에서 tenantId, branchId 추출하여 TenantContextHolder 자동 설정
 *
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // Ops Portal API 요청인 경우 상세 로깅 (onboarding 포함)
        boolean isOpsApi = requestPath.startsWith("/api/v1/ops/")
                || requestPath.startsWith("/api/v1/onboarding/");

        try {
            // Authorization 헤더에서 JWT 토큰 추출
            String authHeader = request.getHeader("Authorization");
            String token = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                if (isOpsApi) {
                    log.debug("JWT 토큰 발견: path={}, tokenLength={}", requestPath, token.length());
                }
            } else {
                if (isOpsApi) {
                    log.debug("JWT 토큰 없음: path={}, Authorization header={}", requestPath,
                            authHeader);
                }
            }

            // 토큰이 있고 유효한 경우
            if (token != null) {
                boolean isValid = jwtService.isTokenValid(token);
                if (isOpsApi) {
                    log.debug("JWT 토큰 유효성 검사: path={}, isValid={}", requestPath, isValid);
                }

                if (isValid) {
                    String userId = jwtService.extractUsername(token);

                    // Ops Portal API인 경우 JWT 토큰을 항상 우선 적용 (기존 인증 정보 덮어쓰기)
                    // 일반 사용자 API인 경우 기존 인증 정보가 있으면 스킵
                    boolean shouldSetAuth = isOpsApi || SecurityContextHolder.getContext().getAuthentication() == null;

                    if (userId != null && shouldSetAuth) {
                        // 표준화 2025-12-08: extractUsername이 userId를 반환하므로 userId로 사용자 조회
                        // JWT 토큰에서 tenantId 추출하여 사용자 조회
                        User user = null;
                        try {
                            String tenantId = jwtService.extractTenantId(token);
                            if (tenantId != null && !tenantId.trim().isEmpty()) {
                                // tenantId가 있으면 테넌트별 조회 (Repository 직접 사용)
                                user = userRepository.findByTenantIdAndUserId(tenantId, userId)
                                        .orElse(null);
                            } else {
                                // tenantId가 없으면 email로 조회 시도 (레거시 토큰 또는 email이 클레임에 있는 경우)
                                String email = jwtService.extractEmail(token);
                                if (email != null && !email.trim().isEmpty()) {
                                    user = userService.findByEmail(email).orElse(null);
                                    // userId도 확인
                                    if (user != null && !user.getUserId().equals(userId)) {
                                        user = null; // userId가 일치하지 않으면 null
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("JWT 토큰에서 사용자 조회 실패: userId={}, error={}", userId,
                                    e.getMessage());
                        }

                        Collection<GrantedAuthority> authorities;
                        if (user != null) {
                            // 데이터베이스에서 조회한 사용자 정보 기반으로 권한 부여
                            authorities = createAuthoritiesFromUser(user);
                            log.info(
                                    "JWT 인증 성공 (DB 조회): path={}, userId={}, userRole={}, authorities={}",
                                    requestPath, userId, user.getRole(), authorities);
                        } else {
                            // 사용자가 데이터베이스에 없는 경우 (Ops Portal 전용 계정 등)
                            // JWT 토큰에서 actorRole 추출하여 권한 부여
                            String actorRole = jwtService.extractActorRole(token);
                            authorities = createAuthoritiesFromActorRole(userId, actorRole);
                            log.info(
                                    "JWT 인증 성공 (토큰 기반): path={}, userId={}, actorRole={}, authorities={}",
                                    requestPath, userId, actorRole, authorities);
                        }

                        // userId를 principal로 사용
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userId, null, authorities);

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.info(
                                "Spring Security 컨텍스트에 인증 정보 설정 완료: path={}, userId={}, authorities={}",
                                requestPath, userId, authorities);

                        // Phase 3: JWT 토큰에서 tenantId 추출하여 TenantContextHolder 설정
                        try {
                            String tenantId = jwtService.extractTenantId(token);

                            if (tenantId != null && !tenantId.isEmpty()) {
                                TenantContextHolder.setTenantId(tenantId);
                                log.debug("Tenant context set from JWT token: {}", tenantId);
                            }
                        } catch (Exception e) {
                            log.warn("JWT 토큰에서 테넌트 정보 추출 실패: {}", e.getMessage());
                            // 테넌트 정보 추출 실패해도 인증은 계속 진행
                        }
                    } else {
                        if (isOpsApi) {
                            log.debug("JWT 인증 스킵: path={}, userId={}, alreadyAuthenticated={}",
                                    requestPath, userId,
                                    SecurityContextHolder.getContext().getAuthentication() != null);
                        }
                    }
                } else {
                    if (isOpsApi) {
                        log.warn("JWT 토큰이 유효하지 않음: path={}", requestPath);
                    }
                }
            } else {
                // Ops Portal API 또는 온보딩 API인 경우 상세 로깅
                if (isOpsApi && !requestPath.startsWith("/api/v1/ops/auth/login")
                        && !requestPath.startsWith("/api/v1/ops/plans/")) {
                    log.warn("JWT 토큰 없음 (인증 필요 경로): path={}, Authorization header={}", requestPath,
                            authHeader);
                    // 현재 SecurityContext 상태 확인
                    org.springframework.security.core.Authentication currentAuth =
                            SecurityContextHolder.getContext().getAuthentication();
                    if (currentAuth != null) {
                        log.warn("현재 SecurityContext 인증 정보: principal={}, authorities={}",
                                currentAuth.getPrincipal(), currentAuth.getAuthorities());
                    } else {
                        log.warn("SecurityContext에 인증 정보 없음");
                    }
                }
                // 온보딩 API인 경우에도 로깅 (isOpsApi가 true이므로 포함됨)
            }
        } catch (Exception e) {
            log.error("JWT 인증 처리 중 오류 발생: path={}, error={}", requestPath, e.getMessage(), e);
        } finally {
            // 요청 종료 시 TenantContext 정리 (메모리 누수 방지)
            // 주의: TenantContextFilter에서도 정리하므로 중복 정리는 문제 없음
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // 정적 리소스와 공개 API만 필터링하지 않음
        // 주의: /api/v1/ops/onboarding/는 JWT 인증이 필요하므로 필터를 거쳐야 함
        return path.startsWith("/static/") || path.startsWith("/css/") || path.startsWith("/js/")
                || path.startsWith("/images/") || path.startsWith("/fonts/")
                || path.equals("/favicon.ico") || path.equals("/robots.txt")
                || path.equals("/manifest.json") || path.startsWith("/api/auth/") || // 모든 인증 관련 API
                                                                                     // 제외
                path.startsWith("/api/v1/onboarding/") || // 온보딩 API 제외 (새로운 테넌트 등록, Ops Portal 경로 제외)
                path.startsWith("/oauth2/") || path.startsWith("/api/password-reset/")
                || path.startsWith("/api/health/") || path.equals("/error")
                || path.startsWith("/actuator/");
    }

    /**
     * 사용자 정보 기반으로 Spring Security 권한 생성 (SSO 로그인 지원) 데이터베이스에서 조회한 사용자 역할을 기반으로 권한 부여
     */
    private Collection<GrantedAuthority> createAuthoritiesFromUser(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (user == null || user.getRole() == null) {
            return authorities;
        }

        // 사용자 역할에 따른 권한 매핑 (SessionBasedAuthenticationFilter와 동일한 로직)
        // 표준화 2025-12-05: 레거시 역할 제거, 표준 역할만 사용
        if (user.getRole() == null) {
            return authorities;
        }

        switch (user.getRole()) {
            case ADMIN:
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                break;
            case STAFF:
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
                break;
            case CONSULTANT:
                authorities.add(new SimpleGrantedAuthority(
                        SecurityRoleConstants.ROLE_PREFIX + user.getRole().name()));
                break;
            case CLIENT:
                authorities.add(new SimpleGrantedAuthority(
                        SecurityRoleConstants.ROLE_PREFIX + user.getRole().name()));
                break;
            default:
                // 기본적으로 역할을 ROLE_ 접두사와 함께 추가
                authorities.add(new SimpleGrantedAuthority(
                        SecurityRoleConstants.ROLE_PREFIX + user.getRole().name()));
                break;
        }

        return authorities;
    }

    /**
     * actorRole 기반으로 Spring Security 권한 생성 (Ops Portal 전용 계정용) 사용자가 데이터베이스에 없는 경우 JWT 토큰의
     * actorRole을 사용
     */
    private Collection<GrantedAuthority> createAuthoritiesFromActorRole(String userId,
            String actorRole) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        // actorRole 기반 권한 매핑
        if (actorRole != null) {
            String normalizedRole = actorRole.toUpperCase();

            // HQ_ADMIN, SUPER_HQ_ADMIN → ADMIN + OPS + HQ_ADMIN
            if (SecurityRoleConstants.ACTOR_ROLE_HQ_ADMIN.equals(normalizedRole)
                    || SecurityRoleConstants.ACTOR_ROLE_SUPER_HQ_ADMIN.equals(normalizedRole)) {
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_HQ_ADMIN));
            }
            // ADMIN → ADMIN + OPS
            else if (SecurityRoleConstants.ACTOR_ROLE_ADMIN.equals(normalizedRole)) {
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
            }
            // OPS → OPS
            else if (SecurityRoleConstants.ACTOR_ROLE_OPS.equals(normalizedRole)) {
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
            }
            // 기타 역할은 ROLE_ 접두사와 함께 추가
            else {
                authorities.add(new SimpleGrantedAuthority(
                        SecurityRoleConstants.ROLE_PREFIX + normalizedRole));
            }
        }

        return authorities;
    }
}
