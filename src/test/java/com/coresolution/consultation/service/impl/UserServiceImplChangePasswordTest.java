package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link UserServiceImpl#changePassword}가 엔티티 정책과 동일하게
 * {@link UserRepository#updatePasswordCompletingCredentialChange}를 호출하는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-04-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 비밀번호 변경 정책")
class UserServiceImplChangePasswordTest {

    private static final String TENANT = "tenant-chgpw-" + UUID.randomUUID();

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private EmailService emailService;
    @Mock
    private BranchService branchService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("changePassword(old,new): 기존 비밀번호 검증 후 완료용 UPDATE 호출")
    void changePassword_withOld_invokesCompletingUpdate() {
        User u = activeUser(10L, "old-hash");
        when(userRepository.findByTenantIdAndId(TENANT, 10L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.matches("plain-old", "old-hash")).thenReturn(true);
        when(passwordService.encodePassword("plain-new")).thenReturn("new-hash");

        userService.changePassword(10L, "plain-old", "plain-new");

        verify(userRepository).updatePasswordCompletingCredentialChange(eq(10L), eq(TENANT), eq("new-hash"),
            any(LocalDateTime.class));
        verify(userRepository, never()).updatePassword(any(), any(), any(), any());
    }

    @Test
    @DisplayName("changePassword(null old,new): 재설정 토큰 경로 — matches 생략, 완료용 UPDATE만")
    void changePassword_nullOld_skipsMatch_invokesCompletingUpdate() {
        User u = activeUser(11L, "any-hash");
        when(userRepository.findByTenantIdAndId(TENANT, 11L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.encodePassword("plain-new")).thenReturn("new-hash");

        userService.changePassword(11L, null, "plain-new");

        verify(passwordService, never()).matches(any(), any());
        verify(userRepository).updatePasswordCompletingCredentialChange(eq(11L), eq(TENANT), eq("new-hash"),
            any(LocalDateTime.class));
    }

    @Test
    @DisplayName("changePassword(new): 관리자 단일 인자 오버로드도 완료용 UPDATE")
    void changePassword_newOnly_invokesCompletingUpdate() {
        User u = activeUser(12L, "stored");
        when(userRepository.findByTenantIdAndId(TENANT, 12L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.encodePassword("admin-new")).thenReturn("admin-hash");

        userService.changePassword(12L, "admin-new");

        verify(userRepository).updatePasswordCompletingCredentialChange(eq(12L), eq(TENANT), eq("admin-hash"),
            any(LocalDateTime.class));
    }

    @Test
    @DisplayName("changePassword(빈 문자열 old): null과 달리 검증 경로 — 불일치 시 UPDATE 없음")
    void changePassword_blankOld_validatesAndFails_noUpdate() {
        User u = activeUser(14L, "stored");
        when(userRepository.findByTenantIdAndId(TENANT, 14L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.matches("", "stored")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(14L, "", "new"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("기존 비밀번호");

        verify(userRepository, never()).updatePasswordCompletingCredentialChange(any(), any(), any(), any());
    }

    @Test
    @DisplayName("changePassword: 기존 비밀번호 불일치 시 UPDATE 호출 없음")
    void changePassword_wrongOld_throws_noUpdate() {
        User u = activeUser(13L, "stored");
        when(userRepository.findByTenantIdAndId(TENANT, 13L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.matches("bad", "stored")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(13L, "bad", "new"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("기존 비밀번호");

        verify(userRepository, never()).updatePasswordCompletingCredentialChange(any(), any(), any(), any());
        verify(userRepository, never()).updatePassword(any(), any(), any(), any());
    }

    @Test
    @DisplayName("partialUpdate: password 포함 시 save 후 완료용 UPDATE 호출")
    void partialUpdate_withPassword_saveThenCompletingUpdate() {
        User u = activeUser(20L, "old-hash");
        u.setVersion(5L);
        when(userRepository.findByTenantIdAndId(TENANT, 20L)).thenReturn(Optional.of(u));
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.encodePassword("plain-new")).thenReturn("new-hash");

        User patch = new User();
        patch.setPassword("plain-new");

        User result = userService.partialUpdate(20L, patch);

        verify(userRepository).save(u);
        verify(userRepository).updatePasswordCompletingCredentialChange(eq(20L), eq(TENANT), eq("new-hash"),
            any(LocalDateTime.class));
        verify(userRepository, times(3)).findByTenantIdAndId(TENANT, 20L);
        assertThat(result).isSameAs(u);
    }

    @Test
    @DisplayName("partialUpdate: password 없으면 완료용 UPDATE 미호출")
    void partialUpdate_withoutPassword_noCompletingUpdate() {
        User u = activeUser(21L, "stored-hash");
        when(userRepository.findByTenantIdAndId(TENANT, 21L)).thenReturn(Optional.of(u));

        User patch = new User();
        patch.setName("only-name");

        userService.partialUpdate(21L, patch);

        verify(userRepository).save(u);
        verify(userRepository, never()).updatePasswordCompletingCredentialChange(any(), any(), any(), any());
        verify(userRepository, times(1)).findByTenantIdAndId(TENANT, 21L);
    }

    private static User activeUser(Long id, String passwordHash) {
        User u = User.builder()
            .userId("u" + id)
            .email("e" + id + "@t.com")
            .password(passwordHash)
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
}
