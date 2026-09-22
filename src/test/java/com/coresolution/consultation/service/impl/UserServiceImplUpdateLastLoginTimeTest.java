package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link UserServiceImpl#updateLastLoginTime} 가 엔티티 save 가 아닌
 * {@link UserRepository#updateLastLoginAt} JPQL 경로를 쓰는지 검증한다.
 *
 * <p>JPQL UPDATE 는 {@code @Version} WHERE 술어가 없어 동시 로그인 OCC(HTTP 500)를 피한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 최종 로그인 시각 갱신 (OCC 방지)")
class UserServiceImplUpdateLastLoginTimeTest {

    // tenant_id 컬럼 길이(36) 한도. UUID(no-dash) 32자 + prefix 4자 = 36자.
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
    @DisplayName("updateLastLoginTime: updateLastLoginAt 호출, save 미호출")
    void updateLastLoginTime_invokesJpqlUpdate_notSave() {
        when(userRepository.updateLastLoginAt(eq(42L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(1);

        userService.updateLastLoginTime(42L);

        verify(userRepository).updateLastLoginAt(eq(42L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(userRepository, never()).save(any());
        verify(userRepository, never()).findByTenantIdAndId(any(), any());
    }

    @Test
    @DisplayName("updateLastLoginTime: 갱신 0행이어도 예외 없이 반환")
    void updateLastLoginTime_zeroRows_doesNotThrow() {
        when(userRepository.updateLastLoginAt(eq(99L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(0);

        userService.updateLastLoginTime(99L);

        verify(userRepository).updateLastLoginAt(eq(99L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateLastLoginTime: DataAccessException 시 삼키고 로그인 경로 유지")
    void updateLastLoginTime_dataAccessException_swallowed() {
        when(userRepository.updateLastLoginAt(eq(7L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenThrow(new ObjectOptimisticLockingFailureException("User", 7L));

        userService.updateLastLoginTime(7L);

        verify(userRepository).updateLastLoginAt(eq(7L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateLastLoginTime: 일반 DataAccessException 도 삼킴")
    void updateLastLoginTime_genericDataAccess_swallowed() {
        when(userRepository.updateLastLoginAt(eq(8L), eq(TENANT), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenThrow(new DataAccessResourceFailureException("db down"));

        userService.updateLastLoginTime(8L);

        verify(userRepository, never()).save(any());
    }
}
