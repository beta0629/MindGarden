package com.coresolution.consultation.scheduler;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ScheduleChangeNotificationScheduler} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleChangeNotificationScheduler")
class ScheduleChangeNotificationSchedulerTest {

    @Mock
    private ScheduleChangeNotificationDebounceService debounceService;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;

    private ScheduleChangeNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new ScheduleChangeNotificationScheduler(debounceService, logService, alertService);
    }

    @Test
    @DisplayName("폴링 시 processDuePending 위임")
    void processDue_delegatesToDebounceService() {
        when(debounceService.processDuePending()).thenReturn(2);

        scheduler.processDueScheduleChangeNotifications();

        verify(debounceService).processDuePending();
    }
}
