package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link CustomUserDetailsService}는 {@link UserService#findByLoginPrincipal(String)}에 위임하며,
 * 로그인 식별자(이메일·휴대폰) 해석의 테넌트 스코프는 UserServiceImpl 쪽에서 보장된다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService 로그인 식별자 위임")
class CustomUserDetailsServiceTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("loadUserByUsername: UserService.findByLoginPrincipal 결과로 UserDetails 생성")
    void loadUserByUsername_delegatesToFindByLoginPrincipal() {
        User user = User.builder()
            .userId("login-user-1")
            .email("scoped@test.com")
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.ADMIN)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setTenantId("tenant-ut-delegate");

        when(userService.findByLoginPrincipal("scoped@test.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("scoped@test.com");

        assertThat(details.getUsername()).isEqualTo("scoped@test.com");
        assertThat(details.isEnabled()).isTrue();
        verify(userService).findByLoginPrincipal("scoped@test.com");
    }

    @Test
    @DisplayName("loadUserByUsername: 비활성 사용자는 UsernameNotFoundException")
    void loadUserByUsername_inactive_throws() {
        User user = User.builder()
            .userId("inactive-1")
            .email("off@test.com")
            .password("{bcrypt}$2a$10$0123456789012345678901y")
            .name("비활성")
            .role(UserRole.CLIENT)
            .isActive(false)
            .isPasswordChanged(true)
            .build();
        when(userService.findByLoginPrincipal("off@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("off@test.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("비활성화");
    }
}
