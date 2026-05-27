package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserLifecycleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 자발 탈퇴 30일 유예 만료 cron — USER_LIFECYCLE_TERMINATION_POLICY Q3 + §6.2.
 *
 * <p>매일 03:00 KST 실행. {@code lifecycle_state=WITHDRAWAL_PENDING AND
 * withdrawal_requested_at < now() - 30 days} 인 사용자를 검색하여 SYSTEM 행위자로
 * ANONYMIZED 전이를 수행한다.</p>
 *
 * <p>전이 자체는 {@link UserLifecycleService#transitionTo(Long, LifecycleState, Actor, String)}
 * 단일 진입점을 통해 수행되므로 audit_logs / personal_data_destruction_logs / W3 email
 * tombstone 모두 자동 적재된다. 본 scheduler 는 검색·반복·예외 격리만 담당.</p>
 *
 * <p>{@code @ConditionalOnProperty} {@code matchIfMissing=true} — 기본 활성화. 운영 가드
 * 차원 비활성화 토글 가능 ({@code mindgarden.scheduler.withdrawal-grace.enabled=false}).
 * 레거시 키 {@code app.lifecycle.withdrawal.scheduler.enabled} 는 폐기되고
 * {@link AdminDeleteRetentionScheduler} 와 네임스페이스를 일치시켰다.</p>
 *
 * <p>{@code mindgarden.scheduler.withdrawal-grace.dry-run=true} 로 설정하면 후보 조회만
 * 수행하고 anonymize 호출은 하지 않는다 (운영 검증용 — tester M2 권고,
 * {@link AdminDeleteRetentionScheduler} 와 동일 패턴).</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "mindgarden.scheduler.withdrawal-grace.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class WithdrawalGracePeriodScheduler {

    private static final String SCHEDULER_NAME = "WithdrawalGracePeriod";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** Q3 결정 — 30일 유예. */
    static final int GRACE_PERIOD_DAYS = 30;

    private final UserRepository userRepository;
    private final UserLifecycleService userLifecycleService;

    @Value("${mindgarden.scheduler.withdrawal-grace.dry-run:false}")
    private boolean dryRun;

    /**
     * 매일 03:00 KST 30일 만료 후보 자동 ANONYMIZE.
     */
    @Scheduled(
        cron = "${app.lifecycle.withdrawal.scheduler.cron:0 0 3 * * *}",
        zone = "Asia/Seoul"
    )
    public void anonymizeExpiredWithdrawals() {
        int processed = runOnce();
        log.info("[{}] executed: anonymized={}, graceDays={}, dryRun={}, runAt={}",
                SCHEDULER_NAME, processed, GRACE_PERIOD_DAYS, dryRun, LocalDateTime.now(KST));
    }

    /**
     * cron 외 직접 호출 가능한 단일 회차 처리. 테스트·운영 수동 트리거 호환.
     *
     * @return ANONYMIZED 로 전이된 사용자 수 (dry-run 모드에서는 후보 수)
     */
    public int runOnce() {
        LocalDateTime cutoff = LocalDateTime.now(KST).minusDays(GRACE_PERIOD_DAYS);
        List<User> candidates = userRepository.findExpiredWithdrawalPendingUsers(cutoff);
        if (candidates.isEmpty()) {
            log.debug("[{}] no expired WITHDRAWAL_PENDING users (cutoff={})",
                    SCHEDULER_NAME, cutoff);
            return 0;
        }

        if (dryRun) {
            log.warn("[{}] DRY-RUN — would anonymize {} users (cutoff={})",
                    SCHEDULER_NAME, candidates.size(), cutoff);
            for (User user : candidates) {
                log.warn("[{}] DRY-RUN candidate: userId={}, withdrawalRequestedAt={}",
                        SCHEDULER_NAME, user.getId(), user.getWithdrawalRequestedAt());
            }
            return candidates.size();
        }

        int anonymized = 0;
        for (User user : candidates) {
            try {
                userLifecycleService.transitionTo(
                        user.getId(),
                        LifecycleState.ANONYMIZED,
                        Actor.system(),
                        "WITHDRAWAL_GRACE_EXPIRED");
                anonymized++;
            } catch (Exception e) {
                log.error("[{}] failed to anonymize user {} — continuing: {}",
                        SCHEDULER_NAME, user.getId(), e.getMessage(), e);
            }
        }
        return anonymized;
    }

    /** 테스트 용 dry-run 토글 setter. */
    void setDryRunForTest(boolean dryRun) {
        this.dryRun = dryRun;
    }
}
