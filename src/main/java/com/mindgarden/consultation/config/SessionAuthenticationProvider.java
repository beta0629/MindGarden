package com.mindgarden.consultation.config;

import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 세션 기반 인증 제공자
 * 기존 세션 기반 인증 시스템과 Spring Security를 연동
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Component
@Slf4j
public class SessionAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        try {
            log.info("🔐 SessionAuthenticationProvider: 인증 시도");
            
            // HTTP 요청에서 세션 정보 가져오기
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                log.warn("❌ RequestContextHolder에서 ServletRequestAttributes를 찾을 수 없습니다.");
                return null;
            }
            
            HttpServletRequest request = attributes.getRequest();
            var session = request.getSession(false);
            
            if (session == null) {
                log.warn("❌ 세션을 찾을 수 없습니다.");
                return null;
            }
            
            // 세션에서 사용자 정보 조회
            User user = SessionUtils.getCurrentUser(session);
            if (user == null) {
                log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
                return null;
            }
            
            log.info("✅ 세션 기반 인증 성공: 사용자={}, 역할={}", user.getEmail(), user.getRole());
            
            // 사용자 권한 설정
            Collection<GrantedAuthority> authorities = getAuthorities(user);
            
            // 인증된 토큰 생성
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                user.getEmail(), 
                null, // 비밀번호는 null로 설정 (이미 인증됨)
                authorities
            );
            
            // 사용자 정보를 Principal에 설정
            authToken.setDetails(new WebAuthenticationDetails(request));
            authToken.setAuthenticated(true);
            
            return authToken;
            
        } catch (Exception e) {
            log.error("❌ 세션 기반 인증 실패: {}", e.getMessage(), e);
            return null;
        }
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
    
    /**
     * 사용자 역할에 따른 권한 생성
     */
    private Collection<GrantedAuthority> getAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // 기본 역할 권한 추가
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // 추가 권한 설정 (필요시)
        switch (user.getRole()) {
            case HQ_MASTER:
                // HQ_MASTER는 모든 권한
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_HQ_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_BRANCH_SUPER_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
                break;
            case SUPER_HQ_ADMIN:
            case HQ_ADMIN:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_HQ_ADMIN"));
                break;
            case BRANCH_SUPER_ADMIN:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_BRANCH_SUPER_ADMIN"));
                break;
            case ADMIN:
            case BRANCH_MANAGER:
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                break;
            case CONSULTANT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
                break;
            case CLIENT:
                authorities.add(new SimpleGrantedAuthority("ROLE_CLIENT"));
                break;
            default:
                log.warn("⚠️ 알 수 없는 사용자 역할: {}", user.getRole());
                break;
        }
        
        log.info("🔐 사용자 권한 설정: {} -> {}", user.getEmail(), authorities);
        return authorities;
    }
}
