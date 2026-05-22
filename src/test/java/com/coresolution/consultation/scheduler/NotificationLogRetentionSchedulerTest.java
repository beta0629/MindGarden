package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import com.coresolution.consultation.config.NotificationRetentionProperties;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link NotificationLogRetentionScheduler} 단위 테스트.
 *
 * <p>커버 영역:
 * <ul>
 *   <li>dry-run=true 시 delete 미호출, count 만 호출.</li>
 *   <li>enabled=true 정상 동작 — 두 repo {@code deleteOlderThan} 모두 호출,
 *       cutoff ≈ now - retentionDays.</li>
 *   <li>batchSize 인자 전달 / 누적 카운트 / 반환값 < batchSize 시 반복 종료.</li>
 *   <li>한 테이블 예외 시 다른 테이블 cleanup 계속 진행.</li>
 *   <li>retention-days 커스텀(30일) 설정 반영.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("알림 로그 보관기간 스케줄러 — 90일 cleanup / dry-run / 배치 / 예외 격리")
class NotificationLogRetentionSchedulerTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int DEFAULT_BATCH_SIZE = 5000;
    private static final int DEFAULT_RETENTION_DAYS = 90;

    @Mock
    private AdminTestNotificationLogRepository testNotificationLogRepository;
    @Mock
    private NotificationBatchSendLogRepository batchSendLogRepository;

    private NotificationRetentionProperties properties;
    private NotificationLogRetentionScheduler scheduler;

    @BeforeEach
    void setUp() {
        properties = new NotificationRetentionProperties();
        properties.setEnabled(true);
        properties.setRetentionDays(DEFAULT_RETENTION_DAYS);
        properties.setBatchSize(DEFAULT_BATCH_SIZE);
        properties.setCron("0 30 3 * * *");
        properties.setDryRun(false);
        scheduler = new NotificationLogRetentionScheduler(
            testNotificationLogRepository, batchSendLogRepository, properties);
    }

    @Test
    @DisplayName("dry-run=true — delete 미호출, count 만 호출")
    void cleanupExpiredLogs_dryRunSkipsDelete() {
        properties.setDryRun(true);
        when(testNotificationLogRepository.countOlderThan(any())).thenReturn(123L);
        when(batchSendLogRepository.countOlderThan(any())).thenReturn(456L);

        scheduler.cleanupExpiredLogs();

        verify(testNotificationLogRepository, never()).deleteOlderThan(any(), anyInt());
        verify(batchSendLogRepository, never()).deleteOlderThan(any(), anyInt());
        verify(testNotificationLogRepository).countOlderThan(any());
        verify(batchSendLogRepository).countOlderThan(any());
    }

    @Test
    @DisplayName("정상 동작 — 두 repo deleteOlderThan 모두 호출, cutoff ≈ now - 90d")
    void cleanupExpiredLogs_invokesBothRepositoriesWithCutoff() {
        when(testNotificationLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(0);
        when(batchSendLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(0);
        LocalDateTime expectedCutoff = LocalDateTime.now(KST).minusDays(DEFAULT_RETENTION_DAYS);

        scheduler.cleanupExpiredLogs();

        ArgumentCaptor<LocalDateTime> testCutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> batchCutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(testNotificationLogRepository).deleteOlderThan(testCutoff.capture(), eq(DEFAULT_BATCH_SIZE));
        verify(batchSendLogRepository).deleteOlderThan(batchCutoff.capture(), eq(DEFAULT_BATCH_SIZE));
        assertThat(ChronoUnit.SECONDS.between(testCutoff.getValue(), expectedCutoff))
            .as("admin_test_notification_logs cutoff은 now-90d 와 5초 이내")
            .isBetween(-5L, 5L);
        assertThat(ChronoUnit.SECONDS.between(batchCutoff.getValue(), expectedCutoff))
            .as("notification_batch_send_log cutoff은 now-90d 와 5초 이내")
            .isBetween(-5L, 5L);
    }

    @Test
    @DisplayName("배치 사이즈 — batchSize 만큼 반복 호출, 반환 < batchSize 면 종료, 누적 합산")
    void cleanupExpiredLogs_loopsUntilUnderBatchSize() {
        when(testNotificationLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(DEFAULT_BATCH_SIZE)
            .thenReturn(DEFAULT_BATCH_SIZE)
            .thenReturn(1234);
        when(batchSendLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(DEFAULT_BATCH_SIZE)
            .thenReturn(0);

        scheduler.cleanupExpiredLogs();

        verify(testNotificationLogRepository, times(3))
            .deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE));
        verify(batchSendLogRepository, times(2))
            .deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE));
    }

    @Test
    @DisplayName("한 테이블 예외 — 다른 테이블 cleanup 계속 진행")
    void cleanupExpiredLogs_continuesWhenOneTableFails() {
        when(testNotificationLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenThrow(new RuntimeException("admin_test_notification_logs down"));
        when(batchSendLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(42);

        scheduler.cleanupExpiredLogs();

        verify(testNotificationLogRepository).deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE));
        verify(batchSendLogRepository).deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE));
    }

    @Test
    @DisplayName("retention-days=30 커스텀 — cutoff ≈ now - 30d")
    void cleanupExpiredLogs_customRetentionDaysReflected() {
        int customRetentionDays = 30;
        properties.setRetentionDays(customRetentionDays);
        when(testNotificationLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(0);
        when(batchSendLogRepository.deleteOlderThan(any(), eq(DEFAULT_BATCH_SIZE)))
            .thenReturn(0);
        LocalDateTime expectedCutoff = LocalDateTime.now(KST).minusDays(customRetentionDays);

        scheduler.cleanupExpiredLogs();

        ArgumentCaptor<LocalDateTime> cutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(testNotificationLogRepository).deleteOlderThan(cutoffCaptor.capture(), eq(DEFAULT_BATCH_SIZE));
        assertThat(ChronoUnit.SECONDS.between(cutoffCaptor.getValue(), expectedCutoff))
            .as("retention-days=30 적용 cutoff 은 now-30d 와 5초 이내")
            .isBetween(-5L, 5L);
    }

    @Test
    @DisplayName("커스텀 batchSize — properties.batchSize 값이 그대로 LIMIT 인자로 전달")
    void cleanupExpiredLogs_customBatchSizePassedThrough() {
        int customBatchSize = 1000;
        properties.setBatchSize(customBatchSize);
        when(testNotificationLogRepository.deleteOlderThan(any(), eq(customBatchSize)))
            .thenReturn(0);
        when(batchSendLogRepository.deleteOlderThan(any(), eq(customBatchSize)))
            .thenReturn(0);

        scheduler.cleanupExpiredLogs();

        verify(testNotificationLogRepository).deleteOlderThan(any(), eq(customBatchSize));
        verify(batchSendLogRepository).deleteOlderThan(any(), eq(customBatchSize));
    }
}
