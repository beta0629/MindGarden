package com.coresolution.consultation.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.WellnessTemplate;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DailyHealingContentGenerator;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WellnessTemplateService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import java.lang.reflect.Method;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 웰니스 스케줄러가 SystemNotification 을 저장하기 전에 본문을 정화하는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-21
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WellnessNotificationScheduler — 본문 정화")
class WellnessNotificationSchedulerSanitizeTest {

    @Mock private SystemNotificationRepository systemNotificationRepository;
    @Mock private SystemNotificationReadRepository systemNotificationReadRepository;
    @Mock private UserRepository userRepository;
    @Mock private WellnessTemplateService wellnessTemplateService;
    @Mock private DailyHealingContentGenerator dailyHealingContentGenerator;
    @Mock private TenantService tenantService;
    @Mock private SchedulerExecutionLogService logService;
    @Mock private SchedulerAlertService alertService;
    @Mock private SystemConfigService systemConfigService;

    private WellnessNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new WellnessNotificationScheduler(
                systemNotificationRepository, systemNotificationReadRepository, userRepository,
                wellnessTemplateService, dailyHealingContentGenerator,
                tenantService, logService, alertService, systemConfigService);
    }

    @Test
    @DisplayName("템플릿 본문의 script 를 제거한 뒤 웰니스 공지를 저장한다")
    void sendWellnessTipForTenantSanitizesContent() throws Exception {
        WellnessTemplate template = WellnessTemplate.builder()
                .title("오늘의 팁")
                .content("<p>안녕</p><script>alert(1)</script>")
                .isImportant(false)
                .build();
        when(wellnessTemplateService.getTodayTemplate(any(), any())).thenReturn(template);
        when(systemNotificationRepository.save(any(SystemNotification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByRoleAndIsActiveTrue(any(), any())).thenReturn(List.of());
        when(userRepository.findByTenantIdAndRolesInAndIsActiveTrueAndIsDeletedFalse(any(), any()))
                .thenReturn(List.of());

        Method method = WellnessNotificationScheduler.class
                .getDeclaredMethod("sendWellnessTipForTenant", String.class);
        method.setAccessible(true);
        method.invoke(scheduler, "tenant-wellness-xss");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        SystemNotification saved = captor.getValue();
        assertThat(saved.getNotificationType()).isEqualTo("WELLNESS");
        assertThat(saved.getContent()).contains("안녕");
        assertThat(saved.getContent().toLowerCase()).doesNotContain("<script", "alert(1)");
    }
}
