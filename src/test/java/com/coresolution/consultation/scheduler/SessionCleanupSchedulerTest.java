package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import java.sql.SQLException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionCleanupScheduler")
class SessionCleanupSchedulerTest {

    @Mock
    private UserSessionService userSessionService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;
    @Mock
    private ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;

    @InjectMocks
    private SessionCleanupScheduler scheduler;

    @Test
    @DisplayName("deadlock 발생 시 cleanupExpiredSessions 재시도 후 성공")
    void cleanupExpiredSessions_retriesOnDeadlockThenSucceeds() {
        SQLException deadlock = new SQLException("Deadlock found when trying to get lock", "40001", 1213);
        when(userSessionService.cleanupExpiredSessions())
                .thenThrow(new RuntimeException(deadlock))
                .thenReturn(5);

        scheduler.cleanupExpiredSessions();

        verify(userSessionService, times(2)).cleanupExpiredSessions();
        verify(logService).saveExecutionLog(
                any(), eq("ALL"), eq("SessionCleanup"), eq("SUCCESS"), any());
    }

    @Test
    @DisplayName("deadlock 재시도 소진 시 FAILED 로그 기록")
    void cleanupExpiredSessions_logsFailedAfterRetryExhausted() {
        SQLException deadlock = new SQLException("Deadlock found when trying to get lock", "40001", 1213);
        when(userSessionService.cleanupExpiredSessions())
                .thenThrow(new RuntimeException(deadlock));

        scheduler.cleanupExpiredSessions();

        verify(userSessionService, times(3)).cleanupExpiredSessions();
        verify(logService).saveExecutionLog(
                any(), eq("ALL"), eq("SessionCleanup"), eq("FAILED"), eq(null), any());
    }
}
