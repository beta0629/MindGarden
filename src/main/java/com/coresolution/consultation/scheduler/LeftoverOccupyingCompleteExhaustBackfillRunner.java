package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;
import com.coresolution.consultation.service.LeftoverOccupyingCompleteExhaustBackfillService;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 기동 시 leftover occupying 완료 rem 백필을 한 번 실행한다.
 *
 * <p>ApplicationReadyEvent 이후 Hikari 풀이 usable일 때만 실행한다.
 * 재시작·shutdown 중 pool closed/not-ready면 skip하여 closed=20 풀 고갈을 막는다.
 * 멱등이므로 재기동해도 rem=0 매칭은 다시 쓰지 않는다.
 * 비활성화: {@code mindgarden.session.leftover-occupying-exhaust-backfill.enabled=false}.</p>
 *
 * @author MindGarden
 * @since 2026-09-22
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "mindgarden.session.leftover-occupying-exhaust-backfill.enabled",
        havingValue = "true",
        matchIfMissing = false)
public class LeftoverOccupyingCompleteExhaustBackfillRunner {

    private final LeftoverOccupyingCompleteExhaustBackfillService backfillService;
    private final DataSource dataSource;

    /**
     * ApplicationReady 이후 Hikari 풀이 ready일 때만 leftover occupying exhaust backfill을 실행한다.
     *
     * @param event ApplicationReady 이벤트
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        if (!isHikariPoolReady()) {
            return;
        }
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

    /**
     * HikariDataSource가 usable이고 pool이 closed가 아닌지 확인한다.
     * non-Hikari·closed·MXBean null/실패는 not-ready로 취급해 skip한다.
     *
     * @return 백필 실행 가능하면 true
     */
    private boolean isHikariPoolReady() {
        if (!(dataSource instanceof HikariDataSource hikariDataSource)) {
            log.warn("leftover occupying exhaust backfill skipped: DataSource is not HikariDataSource "
                    + "(pool not ready for backfill)");
            return false;
        }
        if (hikariDataSource.isClosed()) {
            log.warn("leftover occupying exhaust backfill skipped: HikariDataSource is closed "
                    + "(restart/shutdown race)");
            return false;
        }
        try {
            HikariPoolMXBean poolMxBean = hikariDataSource.getHikariPoolMXBean();
            if (poolMxBean == null) {
                log.warn("leftover occupying exhaust backfill skipped: HikariPoolMXBean is null "
                        + "(pool not ready)");
                return false;
            }
        } catch (RuntimeException ex) {
            log.warn("leftover occupying exhaust backfill skipped: Hikari pool MXBean unavailable "
                    + "(pool not ready): {}", ex.getMessage());
            return false;
        }
        return true;
    }
}
