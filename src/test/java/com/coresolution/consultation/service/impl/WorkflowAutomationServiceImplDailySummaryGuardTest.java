package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.WorkflowAutomationCopy;
import com.coresolution.consultation.entity.ConsultantPerformance;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
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
 * 일일 성과 요약 본문 매출 라인 차단 회귀 가드.
 *
 * <p>P1 보안 라운드 2 (2026-06-03): 상담사(CONSULTANT) 메시지함에 매출/수익 정보가 노출되지 않도록
 * {@link WorkflowAutomationServiceImpl#sendDailyPerformanceSummary()} 본문에서 매출 라인을 제거한 변경을
 * 회귀 테스트로 고정한다. 본문은 {@link WorkflowAutomationCopy#DAILY_SUMMARY_BODY_FMT} 템플릿만 사용하며
 * 매출/수익 키워드를 포함하지 않아야 한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WorkflowAutomationServiceImpl — 일일 성과 요약 매출 라인 가드")
class WorkflowAutomationServiceImplDailySummaryGuardTest {

    private static final String TENANT_ID = "tenant-daily-summary-guard";
    private static final Long CONSULTANT_USER_ID = 4001L;

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private StatisticsService statisticsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private SystemConfigService systemConfigService;

    private WorkflowAutomationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WorkflowAutomationServiceImpl(
                scheduleRepository, userRepository, consultationMessageService,
                statisticsService, commonCodeService, mobilePushDispatchService,
                systemConfigService);
        TenantContextHolder.setTenantId(TENANT_ID);
        lenient().when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED), anyBoolean()))
                .thenReturn(true);
        lenient().when(commonCodeService.getCodeValue(anyString(), anyString())).thenReturn(null);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("일일 성과 요약 본문은 매출/수익 키워드를 포함하지 않는다")
    void dailySummary_bodyExcludesRevenueLine() {
        User consultant = User.builder()
                .userId("kim.consultant")
                .email("kim@example.com")
                .role(UserRole.CONSULTANT)
                .build();
        consultant.setId(CONSULTANT_USER_ID);
        consultant.setTenantId(TENANT_ID);

        when(userRepository.findByRoleAndIsDeletedFalse(eq(TENANT_ID), anyString()))
                .thenReturn(List.of(consultant));
        when(statisticsService.getConsultantPerformance(eq(CONSULTANT_USER_ID), any(LocalDate.class)))
                .thenReturn(ConsultantPerformance.builder()
                        .consultantId(CONSULTANT_USER_ID)
                        .performanceDate(LocalDate.now())
                        .completedSchedules(7)
                        .avgRating(new BigDecimal("4.5"))
                        // totalRevenue 가 응답 본문에 포함되지 않아야 함을 강하게 확정하려고 일부러 큰 값으로 설정한다.
                        .totalRevenue(new BigDecimal("987654321"))
                        .build());

        service.sendDailyPerformanceSummary();

        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(consultationMessageService, atLeastOnce()).sendMessage(
                eq(CONSULTANT_USER_ID),
                eq(null),
                eq(null),
                anyString(),
                titleCaptor.capture(),
                bodyCaptor.capture(),
                anyString(),
                anyBoolean(),
                anyBoolean());

        assertThat(titleCaptor.getValue()).isEqualTo(WorkflowAutomationCopy.DAILY_SUMMARY_TITLE);

        String body = bodyCaptor.getValue();
        assertThat(body)
                .as("상담사 일일 성과 요약 본문에는 매출/수익 라인이 절대 포함되지 않아야 한다")
                .doesNotContain("총 수익")
                .doesNotContain("총 수입")
                .doesNotContain("매출")
                .doesNotContain("987654321")
                .doesNotContain("원");
        assertThat(body)
                .contains("오늘의 상담 성과 요약")
                .contains("완료된 상담: 7건")
                .contains("평균 평점: 4.5점");
    }
}
