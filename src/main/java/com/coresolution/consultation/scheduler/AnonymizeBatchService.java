package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
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
 * 4년 안정 보관 만료 사용자 ANONYMIZED 자동 전환 배치 —
 * USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 (Q9).
 *
 * <p>매일 04:30 KST (휴면 배치 30분 후) 실행. {@code dormant_user_pii_vault} 에서
 * {@code anonymize_scheduled_at &lt; now} 인 행을 조회하여 (a)
 * {@link UserLifecycleService#transitionTo} 로 ANONYMIZED 전이 (PII 매트릭스 + email
 * tombstone + destruction log 자동 처리), (b) vault 행 hard delete (PII 영구 파기) 를
 * 단일 트랜잭션으로 수행한다.</p>
 *
 * <p>운영 가드: {@code mindgarden.scheduler.anonymize-batch.enabled=true} 일 때만 cron 등록.
 * {@code dry-run=true} 인 경우 조회 + 로그만 출력.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "mindgarden.scheduler.anonymize-batch.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class AnonymizeBatchService {

    private static final String SCHEDULER_NAME = "AnonymizeBatch";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** ANONYMIZED 진입 사유 — UserAnonymizationServiceImpl.resolveLegalBasis 매핑 키워드. */
    static final String ANONYMIZE_REASON_CODE = "DORMANT_AUTO_4Y";

    private final DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    private final UserLifecycleService userLifecycleService;

    @Value("${mindgarden.scheduler.anonymize-batch.dry-run:true}")
    private boolean dryRun;

    /**
     * 매일 04:30 KST 익명화 배치.
     */
    @Scheduled(
        cron = "${mindgarden.scheduler.anonymize-batch.cron:0 30 4 * * *}",
        zone = "Asia/Seoul"
    )
    public void runScheduled() {
        BatchResult result = runOnce();
        log.info("[{}] executed: candidates={}, anonymized={}, failed={}, dryRun={}, runAt={}",
                SCHEDULER_NAME, result.candidates, result.anonymized, result.failed,
                dryRun, LocalDateTime.now(KST));
    }

    /**
     * cron 외 직접 호출 가능한 단일 회차 처리.
     *
     * @return 배치 처리 결과 ({@link BatchResult})
     */
    public BatchResult runOnce() {
        LocalDateTime cutoff = LocalDateTime.now(KST);
        List<DormantUserPiiVault> candidates =
                dormantUserPiiVaultRepository.findDueForAnonymization(cutoff);
        if (candidates.isEmpty()) {
            log.debug("[{}] no anonymization candidates (cutoff={})", SCHEDULER_NAME, cutoff);
            return new BatchResult(0, 0, 0);
        }

        if (dryRun) {
            log.info("[{}] dry-run: candidates={}, cutoff={}",
                    SCHEDULER_NAME, candidates.size(), cutoff);
            return new BatchResult(candidates.size(), 0, 0);
        }

        int anonymized = 0;
        int failed = 0;
        for (DormantUserPiiVault vault : candidates) {
            try {
                anonymizeSingle(vault.getId(), vault.getUserId(), vault.getTenantId());
                anonymized++;
            } catch (Exception e) {
                failed++;
                log.error("[{}] failed to anonymize userId={} (tenantId={}) — continuing: {}",
                        SCHEDULER_NAME, vault.getUserId(), vault.getTenantId(),
                        e.getMessage(), e);
            }
        }
        return new BatchResult(candidates.size(), anonymized, failed);
    }

    /**
     * 단일 사용자 ANONYMIZED 전이 + vault 행 hard delete — REQUIRES_NEW 격리.
     *
     * @param vaultId  vault 행 PK
     * @param userId   대상 users.id
     * @param tenantId 테넌트 ID
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void anonymizeSingle(Long vaultId, Long userId, String tenantId) {
        userLifecycleService.transitionTo(
                userId,
                LifecycleState.ANONYMIZED,
                Actor.system(),
                ANONYMIZE_REASON_CODE);

        // vault 행 영구 파기 — PII 보관 의무 만료
        dormantUserPiiVaultRepository.deleteById(vaultId);

        log.info("[{}] ANONYMIZED + vault purged: userId={}, tenantId={}, vaultId={}",
                SCHEDULER_NAME, userId, tenantId, vaultId);
    }

    /** 배치 처리 결과 VO. */
    public static final class BatchResult {
        public final int candidates;
        public final int anonymized;
        public final int failed;

        public BatchResult(int candidates, int anonymized, int failed) {
            this.candidates = candidates;
            this.anonymized = anonymized;
            this.failed = failed;
        }
    }
}
