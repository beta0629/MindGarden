package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.IllegalStateTransitionException;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;
import com.coresolution.consultation.service.UserAnonymizationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UserLifecycleServiceImpl#reactivate(Long, String, Actor)} 단위 테스트 —
 * Phase 3 DORMANT → ACTIVE 활성 복귀 + PII vault 복호화/원복.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserLifecycleServiceImpl.reactivate — DORMANT 활성 복귀 + vault 복호화")
class UserLifecycleServiceImplReactivateTest {

    private static final String TENANT_ID = "tenant-reactivate";
    private static final Long USER_ID = 3003L;

    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserAnonymizationService userAnonymizationService;
    @Mock private DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    @Mock private DormantPiiVaultService dormantPiiVaultService;

    @InjectMocks
    private UserLifecycleServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
        user.setUserId("u-dormant");
        user.setEmail("anon-deleted@anonymized.local");  // DORMANT 단계 surrogate
        user.setName("이용종료-12345");
        user.setRole(UserRole.CLIENT);
        user.setLifecycleState(LifecycleState.DORMANT);
        user.setIsActive(true);
    }

    @Test
    @DisplayName("reactivate: DORMANT → ACTIVE + vault 복호화 + PII 원복 + audit_logs PII_VAULT_RESTORE")
    void reactivate_dormant_to_active() {
        DormantUserPiiVault vault = DormantUserPiiVault.builder()
                .userId(USER_ID)
                .encryptedPii("{\"v\":1,\"nonce\":\"x\",\"ciphertext\":\"x\",\"tag\":\"x\"}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(2))
                .anonymizeScheduledAt(LocalDateTime.now().plusYears(2))
                .build();
        vault.setTenantId(TENANT_ID);

        DormantUserPiiSnapshot restoredSnapshot = DormantUserPiiSnapshot.builder()
                .email("original@example.com")
                .name("홍길동")
                .phone("010-1111-2222")
                .build();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(vault));
        when(dormantPiiVaultService.decrypt(anyString())).thenReturn(restoredSnapshot);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenAnswer(inv -> {
                    AuditLog a = inv.getArgument(0);
                    a.setId(800L);
                    return a;
                });

        TransitionResult result = service.reactivate(USER_ID, TENANT_ID,
                Actor.user(USER_ID, "CLIENT"));

        assertThat(result.getFromState()).isEqualTo(LifecycleState.DORMANT);
        assertThat(result.getToState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(result.getAuditLogId()).isEqualTo(800L);
        assertThat(user.getEmail()).isEqualTo("original@example.com");
        assertThat(user.getName()).isEqualTo("홍길동");
        assertThat(user.getPhone()).isEqualTo("010-1111-2222");
        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.ACTIVE);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getAction())
                .isEqualTo(AuditAction.PII_VAULT_RESTORE);

        verify(dormantUserPiiVaultRepository, times(1)).delete(vault);
    }

    @Test
    @DisplayName("reactivate: vault 행 없음 — IllegalArgumentException")
    void reactivate_vaultMissing_throws() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reactivate(USER_ID, TENANT_ID,
                Actor.user(USER_ID, "CLIENT")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DormantUserPiiVault not found");

        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("reactivate: 복호화 실패 — IllegalArgumentException 전파 + audit/save 호출 없음")
    void reactivate_decryptFailure_propagates() {
        DormantUserPiiVault vault = DormantUserPiiVault.builder()
                .userId(USER_ID)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(2))
                .anonymizeScheduledAt(LocalDateTime.now().plusYears(2))
                .build();
        vault.setTenantId(TENANT_ID);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(vault));
        when(dormantPiiVaultService.decrypt(anyString()))
                .thenThrow(new IllegalArgumentException("key mismatch"));

        assertThatThrownBy(() -> service.reactivate(USER_ID, TENANT_ID, Actor.system()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("key mismatch");

        verify(userRepository, never()).save(any(User.class));
        verify(auditLogRepository, never()).save(any());
        verify(dormantUserPiiVaultRepository, never()).delete(any(DormantUserPiiVault.class));
    }

    @Test
    @DisplayName("reactivate: 이미 ACTIVE — idempotent (vault 없으면 no-op, 있으면 정리)")
    void reactivate_alreadyActive_idempotent_withVault() {
        user.setLifecycleState(LifecycleState.ACTIVE);
        DormantUserPiiVault staleVault = DormantUserPiiVault.builder()
                .userId(USER_ID)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(2))
                .anonymizeScheduledAt(LocalDateTime.now().plusYears(2))
                .build();
        staleVault.setTenantId(TENANT_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(staleVault));

        TransitionResult result = service.reactivate(USER_ID, TENANT_ID,
                Actor.user(USER_ID, "CLIENT"));

        assertThat(result.getFromState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(result.getToState()).isEqualTo(LifecycleState.ACTIVE);
        verify(dormantUserPiiVaultRepository).delete(staleVault);
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("reactivate: DORMANT 도 ACTIVE 도 아닌 ANONYMIZED — IllegalStateTransitionException")
    void reactivate_terminalState_throws() {
        user.setLifecycleState(LifecycleState.ANONYMIZED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.reactivate(USER_ID, TENANT_ID, Actor.system()))
                .isInstanceOf(IllegalStateTransitionException.class);

        verify(dormantPiiVaultService, never()).decrypt(anyString());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("reactivate: null 인자 가드 — userId / tenantId / actor 각각 IllegalArgumentException")
    void reactivate_nullArgs_guard() {
        assertThatThrownBy(() -> service.reactivate(null, TENANT_ID, Actor.system()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.reactivate(USER_ID, null, Actor.system()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.reactivate(USER_ID, "", Actor.system()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.reactivate(USER_ID, TENANT_ID, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("reactivate: 존재하지 않는 userId — IllegalArgumentException")
    void reactivate_userNotFound_throws() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reactivate(USER_ID, TENANT_ID, Actor.system()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }
}
