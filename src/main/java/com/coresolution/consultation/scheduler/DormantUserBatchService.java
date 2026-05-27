package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;
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
 * 1년 비활성 사용자 DORMANT 자동 전환 배치 — USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 (Q9).
 *
 * <p>매일 04:00 KST 에 실행. {@code lifecycle_state=ACTIVE AND last_login_at &lt; now-1year}
 * 인 사용자에 대해 (a) PII 를 AES-256-GCM 으로 vault 에 격리, (b) users.lifecycle_state=DORMANT
 * 전이, (c) anonymize_scheduled_at = now + 4 YEAR stamp 를 단일 트랜잭션으로 수행한다.</p>
 *
 * <p>운영 가드: {@code mindgarden.scheduler.dormant-batch.enabled=true} 일 때만 cron 등록.
 * {@code dry-run=true} 인 경우 후보 조회 + 로그만 출력하고 vault INSERT/state UPDATE 는
 * 생략한다 (Phase 3 초기 1주 dry-run 권장).</p>
 *
 * <p>격리(REQUIRES_NEW): 단일 사용자 실패가 배치 전체를 중단하지 않도록 사용자당 별도
 * 트랜잭션을 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "mindgarden.scheduler.dormant-batch.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class DormantUserBatchService {

    private static final String SCHEDULER_NAME = "DormantUserBatch";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** Q9 — 1년 비활성 기준 (mindgarden.lifecycle.dormant-period-years 와 정합). */
    static final int DORMANT_INACTIVE_YEARS = 1;

    /** Q9 — DORMANT → ANONYMIZED 4년 안정 보관. */
    static final int ANONYMIZE_AFTER_DORMANT_YEARS = 4;

    private final UserRepository userRepository;
    private final DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    private final DormantPiiVaultService dormantPiiVaultService;
    private final UserLifecycleService userLifecycleService;

    @Value("${mindgarden.scheduler.dormant-batch.dry-run:true}")
    private boolean dryRun;

    @Value("${mindgarden.lifecycle.dormant-period-years:1}")
    private int dormantPeriodYears;

    @Value("${mindgarden.lifecycle.anonymize-after-dormant-years:4}")
    private int anonymizeAfterDormantYears;

    /**
     * 매일 04:00 KST 휴면 전환 배치.
     */
    @Scheduled(
        cron = "${mindgarden.scheduler.dormant-batch.cron:0 0 4 * * *}",
        zone = "Asia/Seoul"
    )
    public void runScheduled() {
        BatchResult result = runOnce();
        log.info("[{}] executed: candidates={}, dormantTransitioned={}, failed={}, dryRun={}, "
                        + "runAt={}",
                SCHEDULER_NAME, result.candidates, result.transitioned, result.failed,
                dryRun, LocalDateTime.now(KST));
    }

    /**
     * cron 외 직접 호출 가능한 단일 회차 처리 — 테스트·운영 수동 트리거 호환.
     *
     * @return 배치 처리 결과 ({@link BatchResult})
     */
    public BatchResult runOnce() {
        LocalDateTime cutoff = LocalDateTime.now(KST).minusYears(resolveDormantPeriodYears());
        List<User> candidates = userRepository.findDormantBatchCandidates(cutoff);
        if (candidates.isEmpty()) {
            log.debug("[{}] no DORMANT candidates (cutoff={})", SCHEDULER_NAME, cutoff);
            return new BatchResult(0, 0, 0);
        }

        if (dryRun) {
            log.info("[{}] dry-run: candidates={}, cutoff={}, anonymizeAfter={}years",
                    SCHEDULER_NAME, candidates.size(), cutoff, resolveAnonymizeAfterYears());
            return new BatchResult(candidates.size(), 0, 0);
        }

        int transitioned = 0;
        int failed = 0;
        for (User candidate : candidates) {
            try {
                transitionSingle(candidate.getId(), candidate.getTenantId());
                transitioned++;
            } catch (Exception e) {
                failed++;
                log.error("[{}] failed to transition userId={} (tenantId={}) — continuing: {}",
                        SCHEDULER_NAME, candidate.getId(), candidate.getTenantId(),
                        e.getMessage(), e);
            }
        }
        return new BatchResult(candidates.size(), transitioned, failed);
    }

    /**
     * 단일 사용자 DORMANT 전이 — REQUIRES_NEW 격리.
     *
     * @param userId   대상 users.id
     * @param tenantId 테넌트 ID
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void transitionSingle(Long userId, String tenantId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found in DORMANT batch: " + userId));

        if (user.getLifecycleState() != LifecycleState.ACTIVE) {
            log.warn("[{}] skip userId={} — state changed to {} between query and transition",
                    SCHEDULER_NAME, userId, user.getLifecycleState());
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime anonymizeScheduledAt = now.plusYears(resolveAnonymizeAfterYears());

        // 1. PII 스냅샷 추출 + AES-256-GCM 암호화
        DormantUserPiiSnapshot snapshot = DormantUserPiiSnapshot.fromUser(user);
        String encryptedPii = dormantPiiVaultService.encrypt(snapshot);

        // 2. vault 행 적재 (UNIQUE 위반 시 — 이전 회차에서 이미 처리된 멱등 케이스)
        DormantUserPiiVault vault = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii(encryptedPii)
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(anonymizeScheduledAt)
                .build();
        vault.setTenantId(tenantId);
        dormantUserPiiVaultRepository.save(vault);

        // 3. lifecycle_state 전이 (audit_logs 자동 기록 by UserLifecycleService)
        userLifecycleService.transitionTo(
                userId,
                LifecycleState.DORMANT,
                Actor.system(),
                "ONE_YEAR_INACTIVE_DORMANT");

        log.info("[{}] DORMANT transitioned: userId={}, tenantId={}, "
                        + "anonymizeScheduledAt={}",
                SCHEDULER_NAME, userId, tenantId, anonymizeScheduledAt);
    }

    int resolveDormantPeriodYears() {
        return dormantPeriodYears > 0 ? dormantPeriodYears : DORMANT_INACTIVE_YEARS;
    }

    int resolveAnonymizeAfterYears() {
        return anonymizeAfterDormantYears > 0 ? anonymizeAfterDormantYears
                : ANONYMIZE_AFTER_DORMANT_YEARS;
    }

    /** 배치 처리 결과 VO — 후속 모니터링/로그 용. */
    public static final class BatchResult {
        public final int candidates;
        public final int transitioned;
        public final int failed;

        public BatchResult(int candidates, int transitioned, int failed) {
            this.candidates = candidates;
            this.transitioned = transitioned;
            this.failed = failed;
        }
    }
}
