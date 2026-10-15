package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientCredentialNotificationService;
import com.coresolution.consultation.service.support.TemporaryPasswordGenerator;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 관리자 초기화는 임시 비밀번호와 {@code isPasswordChanged=false} 쿼리를 쓴다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("관리자 임시 비밀번호 초기화")
class UserServiceImplResetPasswordByAdminTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private TemporaryPasswordGenerator temporaryPasswordGenerator;
    @Mock
    private ClientCredentialNotificationService clientCredentialNotificationService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId("tenant-a");
        ReflectionTestUtils.setField(userService, "temporaryPasswordGenerator", temporaryPasswordGenerator);
        ReflectionTestUtils.setField(userService, "clientCredentialNotificationService",
                clientCredentialNotificationService);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("같은 테넌트는 false 저장 쿼리와 문자를 호출한다")
    void sameTenantResetsAndSendsSms() {
        User user = new User();
        user.setId(9L);
        user.setTenantId("tenant-a");
        user.setUserId("user-9");
        user.setPhone("01099998888");
        when(userRepository.findByTenantIdAndId("tenant-a", 9L)).thenReturn(Optional.of(user));
        when(temporaryPasswordGenerator.generate()).thenReturn("Kp9@mxzw");
        when(passwordService.encodeSecret("Kp9@mxzw")).thenReturn("hashed");
        when(userRepository.updatePasswordRequiringCredentialChange(eq(9L), eq("tenant-a"), eq("hashed"),
                any(LocalDateTime.class))).thenReturn(1);
        org.mockito.Mockito.doAnswer(inv -> {
            java.util.function.Consumer<CredentialSmsResult> sink = inv.getArgument(0);
            CredentialSmsResult sent = new CredentialSmsResult();
            sent.setSmsSent(true);
            sink.accept(sent);
            return null;
        }).when(clientCredentialNotificationService).deliverAfterCommit(
                any(), eq("01099998888"), eq("user-9"), eq("Kp9@mxzw"), eq("tenant-a"), eq(9L));

        CredentialSmsResult result = userService.resetPasswordByAdmin(9L);

        assertThat(result.isSmsSent()).isTrue();
        verify(userRepository).updatePasswordRequiringCredentialChange(eq(9L), eq("tenant-a"), eq("hashed"),
                any(LocalDateTime.class));
    }

    @Test
    @DisplayName("다른 테넌트 사용자는 403")
    void otherTenantIsForbidden() {
        User other = new User();
        other.setId(9L);
        other.setTenantId("tenant-b");
        when(userRepository.findByTenantIdAndId("tenant-a", 9L)).thenReturn(Optional.empty());
        when(userRepository.findById(9L)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> userService.resetPasswordByAdmin(9L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
