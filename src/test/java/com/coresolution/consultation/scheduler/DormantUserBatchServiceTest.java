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
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;
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
 * {@link DormantUserBatchService} 단위 테스트 — Phase 3 1년 비활성 휴면 전환 cron.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DormantUserBatchService — 1년 비활성 휴면 전환 배치")
class DormantUserBatchServiceTest {

    private static final String TENANT_A = "tenant-a";

    @Mock private UserRepository userRepository;
    @Mock private DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    @Mock private DormantPiiVaultService dormantPiiVaultService;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private DormantUserBatchService service;

    @BeforeEach
    void setUp() {
        // 기본은 production-like (dryRun=false) — 각 테스트가 필요 시 dryRun=true 로 변경
        ReflectionTestUtils.setField(service, "dryRun", false);
        ReflectionTestUtils.setField(service, "dormantPeriodYears", 1);
        ReflectionTestUtils.setField(service, "anonymizeAfterDormantYears", 4);
    }

    @Test
    @DisplayName("runOnce: 1년 비활성 후보 0건 — 전이/vault 호출 없음")
    void runOnce_noCandidates_skips() {
        when(userRepository.findDormantBatchCandidates(any(LocalDateTime.class)))
                .thenReturn(List.of());

        DormantUserBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isZero();
        assertThat(result.transitioned).isZero();
        verify(dormantUserPiiVaultRepository, never()).save(any());
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(), any(), anyString());
    }

    @Test
    @DisplayName("runOnce: 5명 후보 → 각각 vault save + lifecycle 전이 호출")
    void runOnce_transitions_eachCandidate() {
        List<User> candidates = List.of(
                userWith(101L), userWith(102L), userWith(103L), userWith(104L), userWith(105L));
        when(userRepository.findDormantBatchCandidates(any(LocalDateTime.class)))
                .thenReturn(candidates);
        candidates.forEach(u -> when(userRepository.findById(u.getId()))
                .thenReturn(java.util.Optional.of(u)));
        when(dormantPiiVaultService.encrypt(any())).thenReturn("{\"v\":1}");
        when(userLifecycleService.transitionTo(anyLong(), eq(LifecycleState.DORMANT),
                any(Actor.class), anyString()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.DORMANT).build());

        DormantUserBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(5);
        assertThat(result.transitioned).isEqualTo(5);
        assertThat(result.failed).isZero();

        verify(dormantUserPiiVaultRepository, times(5))
                .save(any(DormantUserPiiVault.class));
        ArgumentCaptor<Actor> actorCaptor = ArgumentCaptor.forClass(Actor.class);
        verify(userLifecycleService, times(5))
                .transitionTo(anyLong(), eq(LifecycleState.DORMANT),
                        actorCaptor.capture(), eq("ONE_YEAR_INACTIVE_DORMANT"));
        assertThat(actorCaptor.getAllValues()).allMatch(Actor::isSystem);
    }

    @Test
    @DisplayName("runOnce: 1명 실패해도 다음 후보 계속 처리 — 격리 (REQUIRES_NEW 효과 모킹)")
    void runOnce_failure_isolation() {
        User u1 = userWith(201L);
        User u2 = userWith(202L);
        User u3 = userWith(203L);
        when(userRepository.findDormantBatchCandidates(any(LocalDateTime.class)))
                .thenReturn(List.of(u1, u2, u3));
        when(userRepository.findById(201L)).thenReturn(java.util.Optional.of(u1));
        when(userRepository.findById(202L)).thenReturn(java.util.Optional.of(u2));
        when(userRepository.findById(203L)).thenReturn(java.util.Optional.of(u3));
        when(dormantPiiVaultService.encrypt(any())).thenReturn("{\"v\":1}");
        when(userLifecycleService.transitionTo(eq(202L), any(), any(), any()))
                .thenThrow(new RuntimeException("simulated DB error"));
        when(userLifecycleService.transitionTo(eq(201L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.DORMANT).build());
        when(userLifecycleService.transitionTo(eq(203L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.DORMANT).build());

        DormantUserBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(3);
        assertThat(result.transitioned).isEqualTo(2);
        assertThat(result.failed).isEqualTo(1);
        verify(userLifecycleService, times(3))
                .transitionTo(anyLong(), eq(LifecycleState.DORMANT), any(), anyString());
    }

    @Test
    @DisplayName("runOnce: dryRun=true — 후보 조회만, vault save / 전이 호출 없음")
    void runOnce_dryRun_skipsMutations() {
        ReflectionTestUtils.setField(service, "dryRun", true);
        when(userRepository.findDormantBatchCandidates(any(LocalDateTime.class)))
                .thenReturn(List.of(userWith(301L), userWith(302L)));

        DormantUserBatchService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(2);
        assertThat(result.transitioned).isZero();
        verify(dormantUserPiiVaultRepository, never()).save(any());
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(), any(), anyString());
    }

    @Test
    @DisplayName("runOnce: cutoff 는 now - dormantPeriodYears 년")
    void runOnce_cutoff_is_now_minus_dormantYears() {
        when(userRepository.findDormantBatchCandidates(any(LocalDateTime.class)))
                .thenReturn(List.of());

        service.runOnce();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(userRepository).findDormantBatchCandidates(captor.capture());
        LocalDateTime cutoff = captor.getValue();
        LocalDateTime expected = LocalDateTime.now().minusYears(1);
        assertThat(java.time.Duration.between(cutoff, expected).abs().toMinutes())
                .isLessThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("transitionSingle: vault save + transitionTo 호출 + anonymizeScheduledAt = now + 4년")
    void transitionSingle_setsAnonymizeScheduledAt_4yearsFromNow() {
        User u = userWith(401L);
        when(userRepository.findById(401L)).thenReturn(java.util.Optional.of(u));
        when(dormantPiiVaultService.encrypt(any())).thenReturn("{\"v\":1}");
        when(userLifecycleService.transitionTo(anyLong(), any(), any(), anyString()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.DORMANT).build());

        service.transitionSingle(401L, TENANT_A);

        ArgumentCaptor<DormantUserPiiVault> vaultCaptor =
                ArgumentCaptor.forClass(DormantUserPiiVault.class);
        verify(dormantUserPiiVaultRepository).save(vaultCaptor.capture());
        DormantUserPiiVault vault = vaultCaptor.getValue();
        assertThat(vault.getUserId()).isEqualTo(401L);
        assertThat(vault.getTenantId()).isEqualTo(TENANT_A);
        LocalDateTime expected = LocalDateTime.now().plusYears(4);
        assertThat(java.time.Duration
                .between(vault.getAnonymizeScheduledAt(), expected).abs().toMinutes())
                .isLessThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("transitionSingle: 사용자가 이미 ACTIVE 가 아니면 skip — vault save 없음")
    void transitionSingle_alreadyTransitioned_skips() {
        User u = userWith(501L);
        u.setLifecycleState(LifecycleState.DORMANT);  // 다른 cron 회차가 먼저 처리
        when(userRepository.findById(501L)).thenReturn(java.util.Optional.of(u));

        service.transitionSingle(501L, TENANT_A);

        verify(dormantUserPiiVaultRepository, never()).save(any());
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(), any(), anyString());
    }

    private User userWith(Long id) {
        User u = new User();
        u.setId(id);
        u.setTenantId(TENANT_A);
        u.setUserId("u-" + id);
        u.setEmail("u" + id + "@example.com");
        u.setName("이름" + id);
        u.setLifecycleState(LifecycleState.ACTIVE);
        u.setLastLoginAt(LocalDateTime.now().minusYears(2));
        return u;
    }
}
