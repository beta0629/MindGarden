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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 어드민 강제 종료 7일 보존 윈도우 만료 cron — USER_LIFECYCLE_TERMINATION_POLICY Q5 + §2.
 *
 * <p>매일 03:30 KST 실행 ({@link WithdrawalGracePeriodScheduler} 와 30분 시차로 분리).
 * {@code lifecycle_state=DELETED_BY_ADMIN AND deleted_at < now() - 7 days} 인 사용자를
 * 검색하여 SYSTEM 행위자로 ANONYMIZED 전이를 수행한다.</p>
 *
 * <p>전이 자체는 {@link UserLifecycleService#transitionTo(Long, LifecycleState, Actor, String)}
 * 단일 진입점을 통해 수행되므로 audit_logs / personal_data_destruction_logs / W3 email
 * tombstone 모두 자동 적재된다. 본 scheduler 는 검색·반복·트랜잭션 격리·예외 격리만 담당.</p>
 *
 * <p>각 사용자별 처리는 {@link Propagation#REQUIRES_NEW} 로 트랜잭션을 분리하여 한 명이
 * 실패해도 다음 사용자 처리가 중단되지 않도록 한다.</p>
 *
 * <p>{@code mindgarden.scheduler.admin-delete-retention.dry-run=true} 로 설정하면 후보 조회만
 * 수행하고 anonymize 호출은 하지 않는다 (운영 검증용).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "mindgarden.scheduler.admin-delete-retention.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class AdminDeleteRetentionScheduler {

    private static final String SCHEDULER_NAME = "AdminDeleteRetention";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** Q5 결정 — 어드민 강제 종료 7일 보존 윈도우. */
    static final int RETENTION_WINDOW_DAYS = 7;

    /** anonymize reason metadata — destruction_logs 에 적재된다. */
    static final String ANONYMIZE_REASON = "Q5 7-day window expired (ADMIN_FORCED_DELETE_ANONYMIZED)";

    private final UserRepository userRepository;
    private final UserLifecycleService userLifecycleService;

    @Value("${mindgarden.scheduler.admin-delete-retention.dry-run:false}")
    private boolean dryRun;

    /**
     * 매일 03:30 KST DELETED_BY_ADMIN + 7일 경과 후보 자동 ANONYMIZE.
     */
    @Scheduled(
        cron = "${mindgarden.scheduler.admin-delete-retention.cron:0 30 3 * * *}",
        zone = "Asia/Seoul"
    )
    public void anonymizeExpiredAdminDeletes() {
        int processed = runOnce();
        if (processed > 0) {
            // 1건 이상 처리되면 WARN 로 운영 감사 추적 (정상 cron 결과지만 발생 빈도 추적용).
            log.warn("[{}] executed: anonymized={}, retentionDays={}, dryRun={}, runAt={}",
                    SCHEDULER_NAME, processed, RETENTION_WINDOW_DAYS, dryRun,
                    LocalDateTime.now(KST));
        } else {
            log.info("[{}] executed: anonymized=0, retentionDays={}, dryRun={}, runAt={}",
                    SCHEDULER_NAME, RETENTION_WINDOW_DAYS, dryRun, LocalDateTime.now(KST));
        }
    }

    /**
     * cron 외 직접 호출 가능한 단일 회차 처리. 테스트·운영 수동 트리거 호환.
     *
     * @return ANONYMIZED 로 전이된 사용자 수 (dry-run 모드에서는 후보 수)
     */
    public int runOnce() {
        LocalDateTime cutoff = LocalDateTime.now(KST).minusDays(RETENTION_WINDOW_DAYS);
        List<User> candidates = userRepository.findExpiredDeletedByAdminUsers(cutoff);
        if (candidates.isEmpty()) {
            log.debug("[{}] no expired DELETED_BY_ADMIN users (cutoff={})",
                    SCHEDULER_NAME, cutoff);
            return 0;
        }

        if (dryRun) {
            log.warn("[{}] DRY-RUN — would anonymize {} users (cutoff={})",
                    SCHEDULER_NAME, candidates.size(), cutoff);
            for (User user : candidates) {
                log.warn("[{}] DRY-RUN candidate: userId={}, deletedAt={}, deletedByAdminId={}",
                        SCHEDULER_NAME, user.getId(), user.getDeletedAt(),
                        user.getDeletedByAdminId());
            }
            return candidates.size();
        }

        int anonymized = 0;
        for (User user : candidates) {
            try {
                anonymizeSingle(user.getId());
                anonymized++;
            } catch (Exception e) {
                // 사용자별 트랜잭션 분리(REQUIRES_NEW)로 인해 한 명 실패는 다음 처리에 영향 없음.
                log.error("[{}] failed to anonymize user {} — continuing: {}",
                        SCHEDULER_NAME, user.getId(), e.getMessage(), e);
            }
        }
        return anonymized;
    }

    /**
     * 사용자 1명 anonymize — 신규 트랜잭션으로 격리.
     *
     * <p>{@link Propagation#REQUIRES_NEW} 로 인해 한 명의 실패가 다른 사용자 처리를
     * 롤백시키지 않는다. 호출자 ({@link #runOnce()}) 는 트랜잭션 없이 반복문만 수행한다.</p>
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void anonymizeSingle(Long userId) {
        userLifecycleService.transitionTo(
                userId,
                LifecycleState.ANONYMIZED,
                Actor.system(),
                ANONYMIZE_REASON);
    }

    /** 테스트 용 dry-run 토글 setter. */
    void setDryRunForTest(boolean dryRun) {
        this.dryRun = dryRun;
    }
}
