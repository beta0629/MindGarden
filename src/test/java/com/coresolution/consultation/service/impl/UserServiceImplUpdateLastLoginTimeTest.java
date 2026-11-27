package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P0: 동시 로그인 시 users.@Version 엔티티 save 낙관적 락(BatchUpdateException) 방지.
 * updateLastLoginTime 은 bulk JPQL UPDATE 만 사용해야 한다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl updateLastLoginTime 동시성 안전")
class UserServiceImplUpdateLastLoginTimeTest {

    private static final String TENANT = "tll-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);

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
    @Mock
    private UserLifecycleService userLifecycleService;

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
    @DisplayName("updateLastLoginTime: 엔티티 load/save 없이 tenant-scoped bulk UPDATE 호출")
    void updateLastLoginTime_usesBulkUpdate_notEntitySave() {
        when(userRepository.updateLastLoginAt(eq(42L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(1);

        userService.updateLastLoginTime(42L);

        ArgumentCaptor<LocalDateTime> loginAt = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> updatedAt = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(userRepository).updateLastLoginAt(eq(42L), eq(TENANT), loginAt.capture(), updatedAt.capture());
        assertThat(loginAt.getValue()).isEqualTo(updatedAt.getValue());
        verify(userRepository, never()).save(any());
        verify(userRepository, never()).findByTenantIdAndId(any(), any());
    }

    @Test
    @DisplayName("updateLastLoginTime: 0행 갱신이어도 예외 없이 반환(로그인 핫패스 비차단)")
    void updateLastLoginTime_zeroRows_doesNotThrow() {
        when(userRepository.updateLastLoginAt(eq(99L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(0);

        userService.updateLastLoginTime(99L);

        verify(userRepository).updateLastLoginAt(eq(99L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(userRepository, never()).save(any());
    }
}
