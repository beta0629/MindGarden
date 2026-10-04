package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.core.LockConfiguration;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.core.SimpleLock;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * 수동 자동완료(with-reminder 포함) — 서버 여러 대에서 한 번만 실행 (ShedLock DB 락).
 *
 * <p>서버마다 JVM 락이 따로라서 예전에는 서버 두 대가 같은 일정을 동시에 완료·차감할 수 있었다.
 * 두 인스턴스(서로 다른 서비스 객체·서로 다른 {@code locked_by})가 같은 {@code shedlock} 테이블을 쓰게 해 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ScheduleAutoCompleteService 수동 실행 — 다중 인스턴스 DB 락")
class ScheduleAutoCompleteServiceClusterLockTest {

    private JdbcTemplate jdbc;
    private LockProvider blueProvider;
    private LockProvider greenProvider;
    private ScheduleAutoCompleteService blue;
    private ScheduleAutoCompleteService green;
    private ExecutorService pool;

    @BeforeEach
    void setUp() {
        DataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:shedlock-" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1");
        jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("CREATE TABLE shedlock (name VARCHAR(64) NOT NULL, lock_until TIMESTAMP(3) NOT NULL,"
                + " locked_at TIMESTAMP(3) NOT NULL, locked_by VARCHAR(255) NOT NULL, PRIMARY KEY (name))");
        blueProvider = provider(dataSource, "blue");
        greenProvider = provider(dataSource, "green");
        blue = newInstance(blueProvider);
        green = newInstance(greenProvider);
        pool = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void tearDown() {
        pool.shutdownNow();
    }

    @Test
    @DisplayName("한 서버가 실행 중이면 다른 서버의 수동 실행은 작업을 돌리지 않고 거부, 끝나면 다시 가능")
    void secondInstance_isRejectedWhileFirstRuns_thenAllowed() throws Exception {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger runs = new AtomicInteger();

        Future<Integer> first = pool.submit(() -> blue.runExclusively("withReminder", () -> {
            runs.incrementAndGet();
            started.countDown();
            await(release);
            return 1;
        }));
        assertTrue(started.await(5, TimeUnit.SECONDS));

        IllegalStateException rejected = assertThrows(IllegalStateException.class,
                () -> green.runExclusively("withReminder", runs::incrementAndGet));
        assertEquals(ScheduleAutoCompleteService.ALREADY_RUNNING, rejected.getMessage());
        assertEquals(1, runs.get());

        release.countDown();
        assertEquals(1, first.get(5, TimeUnit.SECONDS));
        assertEquals(2, green.runExclusively("withReminder", runs::incrementAndGet));
    }

    @Test
    @DisplayName("동시에 두 서버가 시작해도 작업은 정확히 한 번")
    void concurrentStart_runsExactlyOnce() throws Exception {
        CountDownLatch go = new CountDownLatch(1);
        CountDownLatch hold = new CountDownLatch(1);
        AtomicInteger runs = new AtomicInteger();
        Future<String> a = pool.submit(() -> attempt(blue, go, hold, runs));
        Future<String> b = pool.submit(() -> attempt(green, go, hold, runs));
        go.countDown();
        Thread.sleep(Duration.ofMillis(1500).toMillis());
        hold.countDown();
        String ra = a.get(5, TimeUnit.SECONDS);
        String rb = b.get(5, TimeUnit.SECONDS);

        assertEquals(1, runs.get());
        assertTrue(("ran".equals(ra) && "rejected".equals(rb)) || ("rejected".equals(ra) && "ran".equals(rb)),
                ra + "/" + rb);
    }

    @Test
    @DisplayName("다른 서버의 주기 배치가 DB 락을 잡고 있으면 수동 실행 거부")
    void otherServerBatchHoldsLock_manualRejected() {
        Optional<SimpleLock> batch = greenProvider.lock(new LockConfiguration(Instant.now(),
                ScheduleAutoCompleteService.PERIODIC_LOCK_NAME, Duration.ofMinutes(5), Duration.ZERO));
        assertTrue(batch.isPresent());
        AtomicInteger runs = new AtomicInteger();

        assertThrows(IllegalStateException.class, () -> blue.runExclusively("withReminder", runs::incrementAndGet));
        assertEquals(0, runs.get());
        assertEquals(0, lockedRows(ScheduleAutoCompleteService.DAILY_LOCK_NAME),
                "거부 시 먼저 잡은 락이 없어야 한다");

        batch.get().unlock();
        assertEquals(1, blue.runExclusively("withReminder", runs::incrementAndGet));
    }

    @Test
    @DisplayName("작업이 예외로 끝나도 DB 락이 풀려 다른 서버가 실행 가능")
    void actionThrows_locksReleased() {
        assertThrows(IllegalArgumentException.class, () -> blue.runExclusively("withReminder", () -> {
            throw new IllegalArgumentException("boom");
        }));
        assertEquals(1, green.runExclusively("withReminder", () -> 1));
    }

    private String attempt(ScheduleAutoCompleteService instance, CountDownLatch go, CountDownLatch hold,
            AtomicInteger runs) throws InterruptedException {
        go.await();
        try {
            instance.runExclusively("withReminder", () -> {
                runs.incrementAndGet();
                await(hold);
                return null;
            });
            return "ran";
        } catch (IllegalStateException e) {
            return "rejected";
        }
    }

    private int lockedRows(String name) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM shedlock WHERE name = ? AND lock_until > CURRENT_TIMESTAMP(3)", Integer.class, name);
        return count == null ? 0 : count;
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static LockProvider provider(DataSource dataSource, String lockedBy) {
        return new JdbcTemplateLockProvider(JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .withLockedByValue(lockedBy)
                .build());
    }

    private static ScheduleAutoCompleteService newInstance(LockProvider lockProvider) {
        ConfigurableApplicationContext context = mock(ConfigurableApplicationContext.class);
        lenient().when(context.isActive()).thenReturn(true);
        ScheduleAutoCompleteService service = new ScheduleAutoCompleteService(mock(ScheduleService.class),
                mock(ScheduleRepository.class), mock(ConsultationLogExistenceSsot.class),
                mock(RealTimeStatisticsService.class), mock(PlSqlScheduleValidationService.class),
                mock(SalaryLateSessionAutoSyncService.class), mock(TenantService.class), context);
        service.useManualLockWaitSeconds(1);
        service.useLockProvider(lockProvider);
        return service;
    }
}
