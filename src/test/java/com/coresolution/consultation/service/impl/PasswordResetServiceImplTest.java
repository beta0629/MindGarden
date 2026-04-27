package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.PasswordResetToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PasswordResetTokenRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link PasswordResetServiceImpl#resetPassword}가 토큰 검증 후
 * {@link UserService#changePassword(Long, String)}(평문)로 수렴되는 동작을 고정한다.
 * 구현체는 {@code PasswordService}를 사용하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-04-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetServiceImpl 비밀번호 재설정")
class PasswordResetServiceImplTest {

    private static final String TENANT = "tenant-pwreset-" + UUID.randomUUID();
    private static final String TOKEN = "abcdefgh-reset-token";
    private static final String PLAIN_NEW = "new-plain-password";

    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private UserService userService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("resetPassword: 유효 토큰·활성 사용자 시 changePassword 1회, 토큰 조회 이후 호출")
    void resetPassword_success_invokesChangePasswordAfterTokenLookup() {
        User user = activeUser(77L);
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .tenantId(TENANT)
            .userId(user.getId())
            .token(TOKEN)
            .email(user.getEmail())
            .expiresAt(LocalDateTime.now().plusHours(1))
            .used(false)
            .user(user)
            .build();

        when(tokenRepository.findByTenantIdAndToken(TENANT, TOKEN)).thenReturn(Optional.of(resetToken));
        when(emailService.sendEmail(any())).thenReturn(EmailResponse.builder().success(true).build());

        assertThat(passwordResetService.resetPassword(TOKEN, PLAIN_NEW)).isTrue();

        InOrder inOrder = inOrder(tokenRepository, userService);
        inOrder.verify(tokenRepository).findByTenantIdAndToken(eq(TENANT), eq(TOKEN));
        inOrder.verify(userService).changePassword(eq(77L), eq(PLAIN_NEW));

        verify(userService).changePassword(eq(77L), eq(PLAIN_NEW));
        verify(tokenRepository).save(eq(resetToken));
    }

    @Test
    @DisplayName("resetPassword: 존재하지 않는 토큰이면 changePassword 미호출")
    void resetPassword_unknownToken_neverCallsChangePassword() {
        when(tokenRepository.findByTenantIdAndToken(TENANT, TOKEN)).thenReturn(Optional.empty());

        assertThat(passwordResetService.resetPassword(TOKEN, PLAIN_NEW)).isFalse();

        verify(userService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("resetPassword: 비활성 사용자면 changePassword 미호출")
    void resetPassword_inactiveUser_neverCallsChangePassword() {
        User user = inactiveUser(88L);
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .tenantId(TENANT)
            .userId(user.getId())
            .token(TOKEN)
            .email(user.getEmail())
            .expiresAt(LocalDateTime.now().plusHours(1))
            .used(false)
            .user(user)
            .build();

        when(tokenRepository.findByTenantIdAndToken(TENANT, TOKEN)).thenReturn(Optional.of(resetToken));

        assertThat(passwordResetService.resetPassword(TOKEN, PLAIN_NEW)).isFalse();

        verify(userService, never()).changePassword(any(), any());
    }

    private static User activeUser(Long id) {
        User u = User.builder()
            .userId("u" + id)
            .email("e" + id + "@t.com")
            .password("hash")
            .name("n")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(false)
            .build();
        u.setId(id);
        u.setTenantId(TENANT);
        u.setIsDeleted(false);
        return u;
    }

    private static User inactiveUser(Long id) {
        User u = activeUser(id);
        u.setIsActive(false);
        return u;
    }
}
