package com.coresolution.consultation.config.filter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.context.TenantContextHolder;
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
 * JWT 인증 필터
 * Phase 3: JWT 토큰에서 tenantId, branchId 추출하여 TenantContextHolder 자동 설정
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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Ops Portal API 요청인 경우 상세 로깅
        boolean isOpsApi = requestPath.startsWith("/api/v1/ops/");
        
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
                    log.debug("JWT 토큰 없음: path={}, Authorization header={}", requestPath, authHeader);
                }
            }
            
            // 토큰이 있고 유효한 경우
            if (token != null) {
                boolean isValid = jwtService.isTokenValid(token);
                if (isOpsApi) {
                    log.debug("JWT 토큰 유효성 검사: path={}, isValid={}", requestPath, isValid);
                }
                
                if (isValid) {
                    String username = jwtService.extractUsername(token);
                    
                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        // 데이터베이스에서 사용자 정보 동적 조회 (SSO 로그인 지원)
                        User user = userService.findByEmail(username).orElse(null);
                        
                        Collection<GrantedAuthority> authorities;
                        if (user != null) {
                            // 데이터베이스에서 조회한 사용자 정보 기반으로 권한 부여
                            authorities = createAuthoritiesFromUser(user);
                            log.info("JWT 인증 성공 (DB 조회): path={}, username={}, userRole={}, authorities={}", 
                                requestPath, username, user.getRole(), authorities);
                        } else {
                            // 사용자가 데이터베이스에 없는 경우 (Ops Portal 전용 계정 등)
                            // JWT 토큰에서 actorRole 추출하여 권한 부여
                            String actorRole = jwtService.extractActorRole(token);
                            authorities = createAuthoritiesFromActorRole(username, actorRole);
                            log.info("JWT 인증 성공 (토큰 기반): path={}, username={}, actorRole={}, authorities={}", 
                                requestPath, username, actorRole, authorities);
                        }
                        
                        // username을 principal로 사용
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                        
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.info("Spring Security 컨텍스트에 인증 정보 설정 완료: path={}, username={}, authorities={}", 
                            requestPath, username, authorities);
                        
                        // Phase 3: JWT 토큰에서 tenantId, branchId 추출하여 TenantContextHolder 설정
                        try {
                            String tenantId = jwtService.extractTenantId(token);
                            Long branchId = jwtService.extractBranchId(token);
                            
                            if (tenantId != null && !tenantId.isEmpty()) {
                                TenantContextHolder.setTenantId(tenantId);
                                log.debug("Tenant context set from JWT token: {}", tenantId);
                            }
                            
                            if (branchId != null) {
                                TenantContextHolder.setBranchId(branchId.toString());
                                log.debug("Branch context set from JWT token: {}", branchId);
                            }
                        } catch (Exception e) {
                            log.warn("JWT 토큰에서 테넌트 정보 추출 실패: {}", e.getMessage());
                            // 테넌트 정보 추출 실패해도 인증은 계속 진행
                        }
                    } else {
                        if (isOpsApi) {
                            log.debug("JWT 인증 스킵: path={}, username={}, alreadyAuthenticated={}", 
                                requestPath, username, SecurityContextHolder.getContext().getAuthentication() != null);
                        }
                    }
                } else {
                    if (isOpsApi) {
                        log.warn("JWT 토큰이 유효하지 않음: path={}", requestPath);
                    }
                }
            } else {
                if (isOpsApi && !requestPath.startsWith("/api/v1/ops/auth/login") && 
                    !requestPath.startsWith("/api/v1/ops/plans/")) {
                    log.debug("JWT 토큰 없음 (인증 필요 경로): path={}", requestPath);
                }
            }
        } catch (Exception e) {
            log.error("JWT 인증 처리 중 오류 발생: path={}, error={}", requestPath, e.getMessage(), e);
        } finally {
            // 요청 종료 시 TenantContext 정리 (메모리 누수 방지)
            // 주의: TenantContextFilter에서도 정리하므로 중복 정리는 문제 없음
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * 사용자 정보 기반으로 Spring Security 권한 생성 (SSO 로그인 지원)
     * 데이터베이스에서 조회한 사용자 역할을 기반으로 권한 부여
     */
    private Collection<GrantedAuthority> createAuthoritiesFromUser(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        if (user == null || user.getRole() == null) {
            return authorities;
        }
        
        // 사용자 역할에 따른 권한 매핑 (SessionBasedAuthenticationFilter와 동일한 로직)
        switch (user.getRole()) {
            case HQ_MASTER:
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_HQ_ADMIN));
                break;
            case SUPER_HQ_ADMIN:
            case HQ_ADMIN:
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_HQ_ADMIN));
                break;
            case BRANCH_SUPER_ADMIN:
                authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
                break;
            case ADMIN:
            case BRANCH_MANAGER:
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
     * actorRole 기반으로 Spring Security 권한 생성 (Ops Portal 전용 계정용)
     * 사용자가 데이터베이스에 없는 경우 JWT 토큰의 actorRole을 사용
     */
    private Collection<GrantedAuthority> createAuthoritiesFromActorRole(String username, String actorRole) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // actorRole 기반 권한 매핑
        if (actorRole != null) {
            String normalizedRole = actorRole.toUpperCase();
            
            // HQ_ADMIN, SUPER_HQ_ADMIN → ADMIN + OPS + HQ_ADMIN
            if (SecurityRoleConstants.ACTOR_ROLE_HQ_ADMIN.equals(normalizedRole) || 
                SecurityRoleConstants.ACTOR_ROLE_SUPER_HQ_ADMIN.equals(normalizedRole)) {
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
