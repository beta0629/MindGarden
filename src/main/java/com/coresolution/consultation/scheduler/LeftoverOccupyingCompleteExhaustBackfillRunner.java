package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;
import com.coresolution.consultation.service.LeftoverOccupyingCompleteExhaustBackfillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 기동 시 leftover occupying 완료 rem 백필을 한 번 실행한다.
 *
 * <p>멱등이므로 재기동해도 rem=0 매칭은 다시 쓰지 않는다.
 * 비활성화: {@code mindgarden.session.leftover-occupying-exhaust-backfill.enabled=false}.</p>
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "mindgarden.session.leftover-occupying-exhaust-backfill.enabled",
        havingValue = "true",
        matchIfMissing = false)
public class LeftoverOccupyingCompleteExhaustBackfillRunner implements ApplicationRunner {

    private final LeftoverOccupyingCompleteExhaustBackfillService backfillService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            LeftoverOccupyingCompleteExhaustBackfillResult result = backfillService.backfillAllActiveTenants();
            log.info("leftover occupying exhaust backfill startup: scanned={}, applied={}, "
                            + "skipOccupying={}, skipCancelled={}, skipTrueRemaining={}, skipOther={}",
                    result.getScanned(),
                    result.getApplied(),
                    result.getSkippedOccupyingInProgress(),
                    result.getSkippedCancelled(),
                    result.getSkippedTrueRemaining(),
                    result.getSkippedOther());
        } catch (RuntimeException ex) {
            log.error("leftover occupying exhaust backfill startup failed: {}", ex.getMessage());
        }
    }
}
