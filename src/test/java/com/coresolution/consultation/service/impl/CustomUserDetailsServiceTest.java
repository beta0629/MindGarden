package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.LifecycleState;
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

    @Test
    @DisplayName("loadUserByUsername: lifecycle_state=ANONYMIZED 는 UsernameNotFoundException")
    void loadUserByUsername_anonymized_throws() {
        User user = lifecycleUser("anon-1", "anon@test.com", LifecycleState.ANONYMIZED, true);
        when(userService.findByLoginPrincipal("anon@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("anon@test.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("비활성화")
            .satisfies(ex -> {
                // 보안: 거부 메시지에 lifecycle 값 노출 금지
                String msg = ex.getMessage();
                assertThat(msg).doesNotContain("ANONYMIZED");
                assertThat(msg).doesNotContain("DELETED_BY_ADMIN");
                assertThat(msg).doesNotContain("HARD_DELETED");
            });
    }

    @Test
    @DisplayName("loadUserByUsername: lifecycle_state=DELETED_BY_ADMIN 는 UsernameNotFoundException")
    void loadUserByUsername_deletedByAdmin_throws() {
        User user = lifecycleUser("del-1", "del@test.com", LifecycleState.DELETED_BY_ADMIN, false);
        when(userService.findByLoginPrincipal("del@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("del@test.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("비활성화");
    }

    @Test
    @DisplayName("loadUserByUsername: lifecycle_state=WITHDRAWAL_PENDING 는 통과 (active-like)")
    void loadUserByUsername_withdrawalPending_passes() {
        User user = lifecycleUser("with-1", "withdraw@test.com",
            LifecycleState.WITHDRAWAL_PENDING, true);
        when(userService.findByLoginPrincipal("withdraw@test.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("withdraw@test.com");

        assertThat(details.getUsername()).isEqualTo("withdraw@test.com");
        assertThat(details.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("loadUserByUsername: lifecycle_state=DORMANT 는 통과 (active-like)")
    void loadUserByUsername_dormant_passes() {
        User user = lifecycleUser("dor-1", "dormant@test.com", LifecycleState.DORMANT, true);
        when(userService.findByLoginPrincipal("dormant@test.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("dormant@test.com");

        assertThat(details.getUsername()).isEqualTo("dormant@test.com");
        assertThat(details.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("loadUserByUsername: lifecycle_state=null 은 보호적 차단")
    void loadUserByUsername_lifecycleNull_throws() {
        User user = lifecycleUser("null-1", "nostate@test.com", null, true);
        when(userService.findByLoginPrincipal("nostate@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("nostate@test.com"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("비활성화");
    }

    private User lifecycleUser(String userId, String email, LifecycleState state, boolean isActive) {
        User user = User.builder()
            .userId(userId)
            .email(email)
            .password("{bcrypt}$2a$10$0123456789012345678901z")
            .name("lifecycle-test")
            .role(UserRole.CLIENT)
            .isActive(isActive)
            .isPasswordChanged(true)
            .build();
        user.setTenantId("tenant-lc-test");
        user.setLifecycleState(state);
        return user;
    }
}
