package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.function.Consumer;

import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientCredentialNotificationService;
import com.coresolution.consultation.service.EmailService;
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
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 이메일 재설정은 임시 비밀번호를 문자로만 알리고 이메일은 보내지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("이메일 임시 비밀번호 재설정")
class UserServiceImplResetPasswordByEmailTest {

    private static final String TENANT_ID = "tenant-a";
    private static final String LOGIN_EMAIL = "user9@example.com";
    private static final String TEMP_PASSWORD = "Kp9@mxzw";
    private static final String ENCODED_PASSWORD = "hashed";
    private static final Long USER_PK = 9L;
    private static final String LOGIN_ID = "user-9";

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private TemporaryPasswordGenerator temporaryPasswordGenerator;
    @Mock
    private ClientCredentialNotificationService clientCredentialNotificationService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(userService, "temporaryPasswordGenerator", temporaryPasswordGenerator);
        ReflectionTestUtils.setField(userService, "clientCredentialNotificationService",
                clientCredentialNotificationService);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("같은 테넌트 이메일 재설정은 문자만 보내고 이메일은 보내지 않는다")
    void sameTenantResetsBySmsOnly() {
        User user = userInTenant("01099998888");
        stubLookupAndPassword(user);
        when(userRepository.updatePasswordRequiringCredentialChange(eq(USER_PK), eq(TENANT_ID), eq(ENCODED_PASSWORD),
                any(LocalDateTime.class))).thenReturn(1);
        org.mockito.Mockito.doAnswer(invocation -> {
            Consumer<CredentialSmsResult> sink = invocation.getArgument(0);
            CredentialSmsResult sent = new CredentialSmsResult();
            sent.setSmsSent(true);
            sink.accept(sent);
            return null;
        }).when(clientCredentialNotificationService).deliverAfterCommit(
                any(), eq("01099998888"), eq(LOGIN_ID), eq(TEMP_PASSWORD), eq(TENANT_ID), eq(USER_PK));

        userService.resetPassword(LOGIN_EMAIL);

        verify(userRepository).updatePasswordRequiringCredentialChange(eq(USER_PK), eq(TENANT_ID), eq(ENCODED_PASSWORD),
                any(LocalDateTime.class));
        verify(clientCredentialNotificationService).deliverAfterCommit(
                any(), eq("01099998888"), eq(LOGIN_ID), eq(TEMP_PASSWORD), eq(TENANT_ID), eq(USER_PK));
        verify(userRepository, never()).updatePassword(any(), any(), any(), any(LocalDateTime.class));
        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("전화번호가 없어도 이메일 폴백 없이 문자 경로를 호출한다")
    void missingPhoneStillUsesSmsPath() {
        User user = userInTenant("");
        stubLookupAndPassword(user);
        when(userRepository.updatePasswordRequiringCredentialChange(eq(USER_PK), eq(TENANT_ID), eq(ENCODED_PASSWORD),
                any(LocalDateTime.class))).thenReturn(1);
        org.mockito.Mockito.doAnswer(invocation -> {
            Consumer<CredentialSmsResult> sink = invocation.getArgument(0);
            CredentialSmsResult sent = new CredentialSmsResult();
            sent.setSmsSent(false);
            sent.setSkipReason(ClientCredentialNotificationService.REASON_PHONE_MISSING);
            sink.accept(sent);
            return null;
        }).when(clientCredentialNotificationService).deliverAfterCommit(
                any(), eq(""), eq(LOGIN_ID), eq(TEMP_PASSWORD), eq(TENANT_ID), eq(USER_PK));

        userService.resetPassword(LOGIN_EMAIL);

        verify(clientCredentialNotificationService).deliverAfterCommit(
                any(), eq(""), eq(LOGIN_ID), eq(TEMP_PASSWORD), eq(TENANT_ID), eq(USER_PK));
        verify(userRepository, never()).updatePassword(any(), any(), any(), any(LocalDateTime.class));
        verifyNoInteractions(emailService);
    }

    private static User userInTenant(String phone) {
        User user = new User();
        user.setId(USER_PK);
        user.setTenantId(TENANT_ID);
        user.setUserId(LOGIN_ID);
        user.setEmail(LOGIN_EMAIL);
        user.setPhone(phone);
        return user;
    }

    private void stubLookupAndPassword(User user) {
        when(userRepository.findByTenantIdAndEmail(TENANT_ID, LOGIN_EMAIL)).thenReturn(Optional.of(user));
        when(temporaryPasswordGenerator.generate()).thenReturn(TEMP_PASSWORD);
        when(passwordService.encodeSecret(TEMP_PASSWORD)).thenReturn(ENCODED_PASSWORD);
    }
}
