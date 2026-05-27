package com.coresolution.consultation.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.service.UserLifecycleService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link AnonymizeBatchService} 단위 테스트 — Phase 3 4년 만료 익명화 cron.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnonymizeBatchService — 4년 만료 익명화 배치")
class AnonymizeBatchServiceTest {

    private static final String TENANT_A = "tenant-a";

    @Mock private DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private AnonymizeBatchService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "dryRun", false);
    }

    @Test
    @DisplayName("runOnce: 익명화 후보 0건 — 호출 없음")
    void runOnce_noCandidates_skips() {
        when(dormantUserPiiVaultRepository.findDueForAnonymization(any(LocalDateTime.class)))
                .thenReturn(List.of());

        AnonymizeBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isZero();
        assertThat(result.anonymized).isZero();
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(), any(), anyString());
    }

    @Test
    @DisplayName("runOnce: 3명 vault → 각각 ANONYMIZED 전이 + vault 행 삭제")
    void runOnce_anonymizesAndDeletesVault() {
        List<DormantUserPiiVault> vaults = List.of(
                vault(11L, 101L), vault(12L, 102L), vault(13L, 103L));
        when(dormantUserPiiVaultRepository.findDueForAnonymization(any(LocalDateTime.class)))
                .thenReturn(vaults);
        when(userLifecycleService.transitionTo(anyLong(), eq(LifecycleState.ANONYMIZED),
                any(Actor.class), anyString()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());

        AnonymizeBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(3);
        assertThat(result.anonymized).isEqualTo(3);
        assertThat(result.failed).isZero();

        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(userLifecycleService, times(3))
                .transitionTo(anyLong(), eq(LifecycleState.ANONYMIZED),
                        any(Actor.class), reasonCaptor.capture());
        assertThat(reasonCaptor.getAllValues())
                .containsOnly(AnonymizeBatchService.ANONYMIZE_REASON_CODE);

        verify(dormantUserPiiVaultRepository, times(3)).deleteById(anyLong());
    }

    @Test
    @DisplayName("runOnce: 1명 실패해도 다음 후보 계속 처리 — 격리")
    void runOnce_failure_isolation() {
        List<DormantUserPiiVault> vaults = List.of(
                vault(21L, 201L), vault(22L, 202L), vault(23L, 203L));
        when(dormantUserPiiVaultRepository.findDueForAnonymization(any(LocalDateTime.class)))
                .thenReturn(vaults);
        when(userLifecycleService.transitionTo(eq(202L), any(), any(), any()))
                .thenThrow(new RuntimeException("simulated PII matrix error"));
        when(userLifecycleService.transitionTo(eq(201L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());
        when(userLifecycleService.transitionTo(eq(203L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());

        AnonymizeBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(3);
        assertThat(result.anonymized).isEqualTo(2);
        assertThat(result.failed).isEqualTo(1);
    }

    @Test
    @DisplayName("runOnce: dryRun=true — 후보 조회만, 전이/삭제 호출 없음")
    void runOnce_dryRun_skipsMutations() {
        ReflectionTestUtils.setField(service, "dryRun", true);
        when(dormantUserPiiVaultRepository.findDueForAnonymization(any(LocalDateTime.class)))
                .thenReturn(List.of(vault(31L, 301L), vault(32L, 302L)));

        AnonymizeBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(2);
        assertThat(result.anonymized).isZero();
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(), any(), anyString());
        verify(dormantUserPiiVaultRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("anonymizeSingle: ANONYMIZED 전이 + vault deleteById 호출")
    void anonymizeSingle_purgesVault() {
        when(userLifecycleService.transitionTo(anyLong(), eq(LifecycleState.ANONYMIZED),
                any(Actor.class), anyString()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());

        service.anonymizeSingle(99L, 401L, TENANT_A);

        verify(userLifecycleService).transitionTo(eq(401L),
                eq(LifecycleState.ANONYMIZED),
                any(Actor.class),
                eq(AnonymizeBatchService.ANONYMIZE_REASON_CODE));
        verify(dormantUserPiiVaultRepository).deleteById(99L);
    }

    private DormantUserPiiVault vault(Long id, Long userId) {
        DormantUserPiiVault v = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(5))
                .anonymizeScheduledAt(LocalDateTime.now().minusDays(1))
                .build();
        v.setId(id);
        v.setTenantId(TENANT_A);
        return v;
    }
}
