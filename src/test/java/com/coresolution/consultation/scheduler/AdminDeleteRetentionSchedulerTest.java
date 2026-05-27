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
import static org.mockito.Mockito.doThrow;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserLifecycleService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminDeleteRetentionScheduler} 단위 테스트 — Q5 7일 윈도우 cron 검증.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminDeleteRetentionScheduler — Q5 7일 윈도우 만료 후보 anonymize")
class AdminDeleteRetentionSchedulerTest {

    @Mock private UserRepository userRepository;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private AdminDeleteRetentionScheduler scheduler;

    private User expiredUser1;
    private User expiredUser2;

    @BeforeEach
    void setUp() {
        expiredUser1 = new User();
        expiredUser1.setId(1001L);
        expiredUser1.setLifecycleState(LifecycleState.DELETED_BY_ADMIN);
        expiredUser1.setDeletedAt(LocalDateTime.now().minusDays(8));
        expiredUser1.setDeletedByAdminId(99L);

        expiredUser2 = new User();
        expiredUser2.setId(1002L);
        expiredUser2.setLifecycleState(LifecycleState.DELETED_BY_ADMIN);
        expiredUser2.setDeletedAt(LocalDateTime.now().minusDays(10));
        expiredUser2.setDeletedByAdminId(99L);
    }

    @Test
    @DisplayName("runOnce: 후보 0건이면 anonymize 호출 없이 0 반환")
    void runOnce_noCandidates_returnsZero() {
        when(userRepository.findExpiredDeletedByAdminUsers(any(LocalDateTime.class)))
                .thenReturn(List.of());

        int result = scheduler.runOnce();

        assertThat(result).isEqualTo(0);
        verify(userLifecycleService, never())
                .transitionTo(anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("runOnce: 만료 후보 2건 모두 ANONYMIZED 전이 호출")
    void runOnce_twoExpired_callsAnonymizeTwice() {
        when(userRepository.findExpiredDeletedByAdminUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredUser1, expiredUser2));
        when(userLifecycleService.transitionTo(anyLong(), eq(LifecycleState.ANONYMIZED),
                any(Actor.class), anyString()))
                .thenAnswer(inv -> TransitionResult.builder()
                        .userId(inv.getArgument(0))
                        .fromState(LifecycleState.DELETED_BY_ADMIN)
                        .toState(LifecycleState.ANONYMIZED)
                        .auditLogId(7000L)
                        .build());

        int result = scheduler.runOnce();

        assertThat(result).isEqualTo(2);
        verify(userLifecycleService, times(1))
                .transitionTo(eq(1001L), eq(LifecycleState.ANONYMIZED),
                        any(Actor.class), eq(AdminDeleteRetentionScheduler.ANONYMIZE_REASON));
        verify(userLifecycleService, times(1))
                .transitionTo(eq(1002L), eq(LifecycleState.ANONYMIZED),
                        any(Actor.class), eq(AdminDeleteRetentionScheduler.ANONYMIZE_REASON));
    }

    @Test
    @DisplayName("runOnce: 한 명 실패해도 다음 사용자 계속 처리 (REQUIRES_NEW 격리)")
    void runOnce_oneFails_continuesNext() {
        when(userRepository.findExpiredDeletedByAdminUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredUser1, expiredUser2));
        when(userLifecycleService.transitionTo(eq(1001L), eq(LifecycleState.ANONYMIZED),
                any(Actor.class), anyString()))
                .thenThrow(new RuntimeException("anonymize 실패"));
        when(userLifecycleService.transitionTo(eq(1002L), eq(LifecycleState.ANONYMIZED),
                any(Actor.class), anyString()))
                .thenAnswer(inv -> TransitionResult.builder()
                        .userId(inv.getArgument(0))
                        .fromState(LifecycleState.DELETED_BY_ADMIN)
                        .toState(LifecycleState.ANONYMIZED)
                        .auditLogId(7001L)
                        .build());

        int result = scheduler.runOnce();

        // 1건만 성공, 다른 1건은 실패 → 정상 케이스 1
        assertThat(result).isEqualTo(1);
        verify(userLifecycleService, times(2))
                .transitionTo(anyLong(), eq(LifecycleState.ANONYMIZED),
                        any(Actor.class), anyString());
    }

    @Test
    @DisplayName("runOnce dry-run: 후보가 있어도 transitionTo 호출되지 않음")
    void runOnce_dryRun_doesNotCallTransition() {
        scheduler.setDryRunForTest(true);
        when(userRepository.findExpiredDeletedByAdminUsers(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredUser1, expiredUser2));

        int result = scheduler.runOnce();

        assertThat(result).isEqualTo(2);
        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }
}
