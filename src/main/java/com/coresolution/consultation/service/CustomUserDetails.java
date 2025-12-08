package com.coresolution.consultation.service;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * 커스텀 UserDetails 구현체
 * username이 userId를 반환하도록 하는 확장된 UserDetails
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-08
 */
public class CustomUserDetails implements UserDetails {
    
    private final String userId;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean accountNonExpired;
    private final boolean accountNonLocked;
    private final boolean credentialsNonExpired;
    private final boolean enabled;
    
    public CustomUserDetails(String userId, String email, String password,
                            Collection<? extends GrantedAuthority> authorities,
                            boolean accountNonExpired, boolean accountNonLocked,
                            boolean credentialsNonExpired, boolean enabled) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.enabled = enabled;
    }
    
    /**
     * 사용자 ID 반환 (userId 필드)
     * 
     * @return 사용자 ID
     */
    public String getUserId() {
        return userId;
    }
    
    /**
     * 이메일 반환
     * 
     * @return 이메일 주소
     */
    public String getEmail() {
        return email;
    }
    
    /**
     * username은 email을 반환 (Spring Security 인증 호환성)
     * Spring Security의 UsernamePasswordAuthenticationToken에서 email을 principal로 사용하므로
     * getUsername()도 email을 반환해야 인증이 정상적으로 작동합니다.
     * 
     * @return 이메일 주소
     */
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }
    
    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

