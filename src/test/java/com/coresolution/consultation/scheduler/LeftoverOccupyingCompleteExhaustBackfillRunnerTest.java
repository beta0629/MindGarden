package com.coresolution.consultation.scheduler;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.LeftoverOccupyingCompleteExhaustBackfillResult;
import com.coresolution.consultation.service.LeftoverOccupyingCompleteExhaustBackfillService;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import javax.sql.DataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * leftover occupying exhaust backfill Runner — Hikari ready 가드 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LeftoverOccupyingCompleteExhaustBackfillRunner")
class LeftoverOccupyingCompleteExhaustBackfillRunnerTest {

    @Mock
    private LeftoverOccupyingCompleteExhaustBackfillService backfillService;

    @Mock
    private HikariDataSource hikariDataSource;

    @Mock
    private HikariPoolMXBean hikariPoolMXBean;

    @Mock
    private DataSource nonHikariDataSource;

    @Test
    @DisplayName("Case A: Hikari isClosed=true → backfill 미호출")
    void onApplicationReady_whenHikariClosed_skipsBackfill() {
        when(hikariDataSource.isClosed()).thenReturn(true);

        LeftoverOccupyingCompleteExhaustBackfillRunner runner =
                new LeftoverOccupyingCompleteExhaustBackfillRunner(backfillService, hikariDataSource);

        runner.onApplicationReady(null);

        verify(backfillService, never()).backfillAllActiveTenants();
        verifyNoInteractions(backfillService);
    }

    @Test
    @DisplayName("Case B: Hikari ready → backfill 한 번 호출")
    void onApplicationReady_whenHikariReady_runsBackfillOnce() {
        when(hikariDataSource.isClosed()).thenReturn(false);
        when(hikariDataSource.getHikariPoolMXBean()).thenReturn(hikariPoolMXBean);
        when(backfillService.backfillAllActiveTenants())
                .thenReturn(LeftoverOccupyingCompleteExhaustBackfillResult.builder()
                        .scanned(1)
                        .applied(1)
                        .build());

        LeftoverOccupyingCompleteExhaustBackfillRunner runner =
                new LeftoverOccupyingCompleteExhaustBackfillRunner(backfillService, hikariDataSource);

        runner.onApplicationReady(null);

        verify(backfillService, times(1)).backfillAllActiveTenants();
    }

    @Test
    @DisplayName("Case C: non-Hikari DataSource → skip, backfill 미호출")
    void onApplicationReady_whenNonHikariDataSource_skipsBackfill() {
        LeftoverOccupyingCompleteExhaustBackfillRunner runner =
                new LeftoverOccupyingCompleteExhaustBackfillRunner(backfillService, nonHikariDataSource);

        runner.onApplicationReady(null);

        verify(backfillService, never()).backfillAllActiveTenants();
        verifyNoInteractions(backfillService);
    }

    @Test
    @DisplayName("HikariPoolMXBean null → skip, backfill 미호출")
    void onApplicationReady_whenPoolMxBeanNull_skipsBackfill() {
        when(hikariDataSource.isClosed()).thenReturn(false);
        when(hikariDataSource.getHikariPoolMXBean()).thenReturn(null);

        LeftoverOccupyingCompleteExhaustBackfillRunner runner =
                new LeftoverOccupyingCompleteExhaustBackfillRunner(backfillService, hikariDataSource);

        runner.onApplicationReady(null);

        verify(backfillService, never()).backfillAllActiveTenants();
        verifyNoInteractions(backfillService);
    }

    @Test
    @DisplayName("backfill RuntimeException → 삼키고 기동 실패 없음")
    void onApplicationReady_whenBackfillThrows_swallowsException() {
        when(hikariDataSource.isClosed()).thenReturn(false);
        when(hikariDataSource.getHikariPoolMXBean()).thenReturn(hikariPoolMXBean);
        when(backfillService.backfillAllActiveTenants())
                .thenThrow(new RuntimeException("pool closed during backfill"));

        LeftoverOccupyingCompleteExhaustBackfillRunner runner =
                new LeftoverOccupyingCompleteExhaustBackfillRunner(backfillService, hikariDataSource);

        runner.onApplicationReady(null);

        verify(backfillService, times(1)).backfillAllActiveTenants();
    }
}
