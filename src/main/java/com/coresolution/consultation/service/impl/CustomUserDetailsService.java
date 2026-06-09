package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CustomUserDetails;
import com.coresolution.consultation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * Spring Security UserDetailsService 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private UserService userService;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("🔍 CustomUserDetailsService.loadUserByUsername 호출: email={}", email);
        
        try {
            log.info("🔍 사용자 조회 시작: loginPrincipal={}", email);
            User user = userService.findByLoginPrincipal(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));
            
            log.info("✅ 사용자 조회 성공: userId={}, email={}, tenantId={}, role={}, isActive={}, passwordHash={}", 
                user.getUserId(), user.getEmail(), user.getTenantId(), user.getRole(), 
                user.getIsActive(), user.getPassword() != null ? user.getPassword().substring(0, 20) + "..." : "null");
            
            // USER_LIFECYCLE_TERMINATION_POLICY §3.6 — lifecycle_state 게이트 (P1)
            // ACTIVE_LIKE_STATES 가 아닌 모든 상태(ANONYMIZED·DELETED_BY_ADMIN·HARD_DELETED 등)는 차단.
            // 거부 메시지에 lifecycle 값 노출 금지 (보안 — 기존 비활성 메시지로 통일).
            LifecycleState lifecycleState = user.getLifecycleState();
            if (lifecycleState == null || !LifecycleState.ACTIVE_LIKE_STATES.contains(lifecycleState)) {
                log.warn("❌ 비활성 lifecycle_state 사용자 로그인 시도: email={}, lifecycleState={}",
                    email, lifecycleState);
                throw new UsernameNotFoundException("비활성화된 사용자입니다: " + email);
            }

            // 사용자가 비활성화된 경우 예외 발생
            if (!user.getIsActive()) {
                log.warn("❌ 비활성화된 사용자 로그인 시도: email={}", email);
                throw new UsernameNotFoundException("비활성화된 사용자입니다: " + email);
            }
            
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            if (user.getRole() != null && user.getRole().isProfessionalProvider()
                    && user.getRole() != UserRole.CONSULTANT) {
                authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
            }

            // 커스텀 UserDetails 객체 생성
            // getUsername()은 email을 반환 (Spring Security 인증 호환성)
            CustomUserDetails userDetails = new CustomUserDetails(
                user.getUserId(),  // userId
                user.getEmail(),   // email
                user.getPassword(),
                authorities,
                true,  // accountNonExpired
                true,  // accountNonLocked
                true,  // credentialsNonExpired
                user.getIsActive()  // enabled
            );
            
            log.debug("✅ CustomUserDetails 생성 완료: username={}, userId={}", 
                userDetails.getUsername(), userDetails.getUserId());
            
            return userDetails;
        } catch (UsernameNotFoundException e) {
            log.error("❌ loadUserByUsername 실패: email={}, error={}", email, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ loadUserByUsername 예외 발생: email={}, error={}, class={}", 
                email, e.getMessage(), e.getClass().getName(), e);
            throw new UsernameNotFoundException("사용자 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
