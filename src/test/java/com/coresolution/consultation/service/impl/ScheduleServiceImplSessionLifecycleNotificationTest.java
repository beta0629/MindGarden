package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Task 7 — {@code ScheduleServiceImpl#dispatchSessionLifecycleNotification} 분기 단위 검증.
 *
 * <p>2026-05-23 라운드 정책 정정:
 * <ul>
 *   <li>{@code total <= 1} → 모든 라이프사이클 알림 제외(기존).</li>
 *   <li>{@code total == 2 && remaining == 1} → SESSION_ENDING_SOON 제외(신규).
 *       사유: 2회기 패키지 첫상담 안내와 마지막 회기 안내가 거의 동시 발송되어 UX 저해.</li>
 *   <li>{@code total >= 3 && remaining == 1} → SESSION_ENDING_SOON 호출(회귀 보호).</li>
 *   <li>{@code total == 2 && remaining == 0} → SESSION_RENEW_PROMPT 호출(옵션 A — 회기 종료 후 자연 발화).</li>
 * </ul>
 *
 * <p>{@code dispatchSessionLifecycleNotification} 은 private 메서드라 reflection 으로 invoke 한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl#dispatchSessionLifecycleNotification — 회기 라이프사이클 알림 분기")
class ScheduleServiceImplSessionLifecycleNotificationTest {

    private static final String TENANT_ID = "tenant-lifecycle-1";
    private static final Long MAPPING_ID = 4242L;

    @Mock private com.coresolution.consultation.repository.ScheduleRepository scheduleRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private com.coresolution.consultation.repository.ConsultantClientMappingRepository mappingRepository;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.repository.VacationRepository vacationRepository;
    @Mock private com.coresolution.consultation.repository.BranchRepository branchRepository;
    @Mock private com.coresolution.consultation.service.CommonCodeService commonCodeService;
    @Mock private com.coresolution.consultation.service.ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private SessionSyncService sessionSyncService;
    @Mock private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    @Mock private NotificationService notificationService;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("total=null → 라이프사이클 알림 호출 0 (기존 동작 보존)")
    void totalNull_noDispatch() throws Exception {
        invokeLifecycle(mapping(null, null));

        verifyNoInteractions(batchNotificationDispatchService);
    }

    @Test
    @DisplayName("total=1 (단발성) → 라이프사이클 알림 호출 0 (기존 동작 보존)")
    void singleSession_noDispatch() throws Exception {
        invokeLifecycle(mapping(1, 0));

        verifyNoInteractions(batchNotificationDispatchService);
    }

    @Test
    @DisplayName("total=2, remaining=1 → SESSION_ENDING_SOON 호출 0 (Task 7 신규 가드)")
    void twoSessions_remainingOne_skipsEndingSoon() throws Exception {
        invokeLifecycle(mapping(2, 1));

        verify(batchNotificationDispatchService, never()).dispatchSessionEndingSoon(MAPPING_ID);
        verify(batchNotificationDispatchService, never()).dispatchSessionRenewPrompt(MAPPING_ID);
    }

    @Test
    @DisplayName("total=2, remaining=0 → SESSION_RENEW_PROMPT 호출 (옵션 A — 회기 종료 후 자연 발화)")
    void twoSessions_remainingZero_dispatchesRenewPrompt() throws Exception {
        invokeLifecycle(mapping(2, 0));

        verify(batchNotificationDispatchService, times(1)).dispatchSessionRenewPrompt(MAPPING_ID);
        verify(batchNotificationDispatchService, never()).dispatchSessionEndingSoon(MAPPING_ID);
    }

    @Test
    @DisplayName("total=3, remaining=1 → SESSION_ENDING_SOON 호출 (회귀 보호)")
    void threeSessions_remainingOne_dispatchesEndingSoon() throws Exception {
        invokeLifecycle(mapping(3, 1));

        verify(batchNotificationDispatchService, times(1)).dispatchSessionEndingSoon(MAPPING_ID);
        verify(batchNotificationDispatchService, never()).dispatchSessionRenewPrompt(MAPPING_ID);
    }

    @Test
    @DisplayName("total=3, remaining=0 → SESSION_RENEW_PROMPT 호출 (회귀 보호)")
    void threeSessions_remainingZero_dispatchesRenewPrompt() throws Exception {
        invokeLifecycle(mapping(3, 0));

        verify(batchNotificationDispatchService, times(1)).dispatchSessionRenewPrompt(MAPPING_ID);
        verify(batchNotificationDispatchService, never()).dispatchSessionEndingSoon(MAPPING_ID);
    }

    @Test
    @DisplayName("total=10, remaining=2 → 라이프사이클 알림 호출 0 (중간 회기는 무동작)")
    void midSession_noDispatch() throws Exception {
        invokeLifecycle(mapping(10, 2));

        verifyNoInteractions(batchNotificationDispatchService);
    }

    private ConsultantClientMapping mapping(Integer total, Integer remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setTotalSessions(total);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }

    /**
     * private 메서드 {@code dispatchSessionLifecycleNotification(ConsultantClientMapping)} 을
     * reflection 으로 호출한다.
     */
    private void invokeLifecycle(ConsultantClientMapping mapping) throws Exception {
        Method m = ScheduleServiceImpl.class.getDeclaredMethod(
                "dispatchSessionLifecycleNotification", ConsultantClientMapping.class);
        m.setAccessible(true);
        m.invoke(scheduleService, mapping);
    }
}
