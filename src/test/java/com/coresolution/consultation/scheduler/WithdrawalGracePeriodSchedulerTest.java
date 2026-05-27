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
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserLifecycleService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link WithdrawalGracePeriodScheduler} 단위 테스트 — Phase 2-α §6.2 30일 만료 cron.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WithdrawalGracePeriodScheduler — 30일 만료 cron")
class WithdrawalGracePeriodSchedulerTest {

    @Mock private UserRepository userRepository;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private WithdrawalGracePeriodScheduler scheduler;

    @Test
    @DisplayName("runOnce: 30일 만료 후보가 0건이면 anonymize 호출 없음")
    void runOnce_noCandidates_skips() {
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        int processed = scheduler.runOnce();

        assertThat(processed).isZero();
        verify(userLifecycleService, never()).transitionTo(any(), any(), any(), any());
    }

    @Test
    @DisplayName("runOnce: 만료 후보 N명에 대해 ANONYMIZED 전이 호출 — Actor.system + 사유 WITHDRAWAL_GRACE_EXPIRED")
    void runOnce_anonymizes_eachCandidate() {
        User u1 = userWith(101L);
        User u2 = userWith(102L);
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(u1, u2));
        when(userLifecycleService.transitionTo(any(), any(), any(), any()))
                .thenReturn(TransitionResult.builder()
                        .toState(LifecycleState.ANONYMIZED)
                        .build());

        int processed = scheduler.runOnce();

        assertThat(processed).isEqualTo(2);

        ArgumentCaptor<Actor> actorCaptor = ArgumentCaptor.forClass(Actor.class);
        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(userLifecycleService, times(2))
                .transitionTo(any(Long.class),
                        eq(LifecycleState.ANONYMIZED),
                        actorCaptor.capture(),
                        reasonCaptor.capture());
        assertThat(actorCaptor.getAllValues())
                .allMatch(Actor::isSystem);
        assertThat(reasonCaptor.getAllValues())
                .containsOnly("WITHDRAWAL_GRACE_EXPIRED");
    }

    @Test
    @DisplayName("runOnce: 한 명 실패해도 다음 후보는 계속 처리 (예외 격리)")
    void runOnce_failure_isolation() {
        User u1 = userWith(201L);
        User u2 = userWith(202L);
        User u3 = userWith(203L);
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(u1, u2, u3));
        when(userLifecycleService.transitionTo(eq(202L), any(), any(), any()))
                .thenThrow(new RuntimeException("simulated failure"));
        when(userLifecycleService.transitionTo(eq(201L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());
        when(userLifecycleService.transitionTo(eq(203L), any(), any(), any()))
                .thenReturn(TransitionResult.builder().toState(LifecycleState.ANONYMIZED).build());

        int processed = scheduler.runOnce();

        assertThat(processed)
                .as("실패 1건 격리 — 3명 중 2명만 처리")
                .isEqualTo(2);
        verify(userLifecycleService, times(3))
                .transitionTo(any(), eq(LifecycleState.ANONYMIZED), any(), any());
    }

    @Test
    @DisplayName("runOnce: cutoff 는 now-30일")
    void runOnce_cutoff_is_now_minus_30days() {
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        scheduler.runOnce();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(userRepository).findExpiredWithdrawalPendingUsers(captor.capture());
        LocalDateTime cutoff = captor.getValue();
        LocalDateTime expected = LocalDateTime.now().minusDays(30);
        // 1분 안의 차이만 허용 (테스트 시각 허용 오차)
        assertThat(java.time.Duration.between(cutoff, expected).abs().toMinutes())
                .isLessThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("anonymizeExpiredWithdrawals: cron entry 가 runOnce 를 위임")
    void cron_entry_invokes_runOnce() {
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        scheduler.anonymizeExpiredWithdrawals();

        verify(userRepository).findExpiredWithdrawalPendingUsers(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("runOnce dry-run: 후보가 있어도 transitionTo 호출되지 않음 (tester M2 권고)")
    void runOnce_dryRun_doesNotCallTransition() {
        scheduler.setDryRunForTest(true);
        User u1 = userWith(301L);
        User u2 = userWith(302L);
        when(userRepository.findExpiredWithdrawalPendingUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(u1, u2));

        int processed = scheduler.runOnce();

        assertThat(processed)
                .as("dry-run 모드에서는 후보 수를 반환")
                .isEqualTo(2);
        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    private User userWith(Long id) {
        User u = new User();
        u.setId(id);
        u.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        u.setWithdrawalRequestedAt(LocalDateTime.now().minusDays(40));
        return u;
    }
}
