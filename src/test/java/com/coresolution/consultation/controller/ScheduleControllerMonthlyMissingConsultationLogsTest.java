package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.MonthlyMissingConsultationLogsResponse;
import com.coresolution.consultation.dto.MonthlyMissingConsultationLogsResponse.ConsultantMissingLogs;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantDashboardService;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * {@link ScheduleController#getMonthlyMissingConsultationLogs(int, int)} 단위 테스트.
 *
 * <p>2026-06-09 R4 신규 API ({@code GET /api/v1/schedules/monthly-missing-consultation-logs})
 * 의 Controller 계층 SSOT. C1/C2 는 @PreAuthorize reflection 으로 검증한다.</p>
 *
 * <ul>
 *   <li>M1: ROLE_CLIENT/CONSULTANT 호출 시 403 — @PreAuthorize 어노테이션 값 검증</li>
 *   <li>M2: ROLE_ADMIN / ROLE_STAFF 호출 시 200 — @PreAuthorize 동일 어노테이션</li>
 *   <li>M3: 응답 포맷 — success=true, data.year/month/items, ApiResponse 래핑</li>
 *   <li>M4: 누락 0건 (items 빈 배열) → 200 + 빈 items 응답</li>
 *   <li>M5: 테넌트 컨텍스트 미설정 → IllegalStateException 던짐 (글로벌 핸들러 401 매핑 보장)</li>
 *   <li>M6: service IllegalArgumentException → 가공 없이 propagate (글로벌 핸들러 400 매핑)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController.getMonthlyMissingConsultationLogs — 월별 상담일지 누락")
class ScheduleControllerMonthlyMissingConsultationLogsTest {

    private static final String TENANT_ID = "tenant-controller-missing-1";

    @Mock private ScheduleService scheduleService;
    @Mock private AdminService adminService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private ConsultationRecordDraftService consultationRecordDraftService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserRepository userRepository;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ObjectMapper objectMapper;
    @Mock private ConsultantDashboardService consultantDashboardService;
    @Mock private ClientScheduleNoteRepository clientScheduleNoteRepository;
    @Mock private ConsultantClientMappingRepository consultantClientMappingRepository;
    @Mock private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ScheduleController controller;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ─── M1 / M2: @PreAuthorize 어노테이션 검증 ─────────────────────────

    @Test
    @DisplayName("M1·M2: @PreAuthorize(\"hasAnyRole('ADMIN', 'STAFF')\") 가 존재한다 — CLIENT/CONSULTANT 차단, ADMIN/STAFF 허용")
    void m1m2_preAuthorizeAnnotation_present() throws NoSuchMethodException {
        Method method = ScheduleController.class.getDeclaredMethod(
                "getMonthlyMissingConsultationLogs", int.class, int.class);

        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
                .as("상담일지 누락 엔드포인트는 @PreAuthorize 가드를 가져야 한다")
                .isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('ADMIN', 'STAFF')");
    }

    // ─── M3: 응답 포맷 ───────────────────────────────────────────────────

    @Test
    @DisplayName("M3: 응답 포맷 — success=true, data.year/month/items, timestamp 존재")
    void m3_responseFormat_success() {
        MonthlyMissingConsultationLogsResponse stub = MonthlyMissingConsultationLogsResponse.builder()
                .year(2026)
                .month(4)
                .items(Arrays.asList(
                        ConsultantMissingLogs.builder()
                                .consultantId(3L)
                                .consultantName("이혁진")
                                .missingDates(Arrays.asList(
                                        LocalDate.of(2026, 4, 15),
                                        LocalDate.of(2026, 4, 22)))
                                .build()))
                .build();
        when(scheduleService.getMonthlyMissingConsultationLogs(2026, 4)).thenReturn(stub);

        ResponseEntity<ApiResponse<MonthlyMissingConsultationLogsResponse>> response =
                controller.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<MonthlyMissingConsultationLogsResponse> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getTimestamp()).isNotNull();
        MonthlyMissingConsultationLogsResponse data = body.getData();
        assertThat(data).isNotNull();
        assertThat(data.getYear()).isEqualTo(2026);
        assertThat(data.getMonth()).isEqualTo(4);
        assertThat(data.getItems()).hasSize(1);
        assertThat(data.getItems().get(0).getConsultantId()).isEqualTo(3L);
        assertThat(data.getItems().get(0).getMissingDates()).hasSize(2);
        verify(scheduleService, times(1)).getMonthlyMissingConsultationLogs(eq(2026), eq(4));
    }

    // ─── M4: 누락 0건 ────────────────────────────────────────────────────

    @Test
    @DisplayName("M4: 누락 0건 → 200 + items=[] (UI 가 «모두 작성됨» placeholder 노출)")
    void m4_emptyItems_success() {
        MonthlyMissingConsultationLogsResponse stub = MonthlyMissingConsultationLogsResponse.builder()
                .year(2026)
                .month(4)
                .items(Collections.emptyList())
                .build();
        when(scheduleService.getMonthlyMissingConsultationLogs(2026, 4)).thenReturn(stub);

        ResponseEntity<ApiResponse<MonthlyMissingConsultationLogsResponse>> response =
                controller.getMonthlyMissingConsultationLogs(2026, 4);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getItems()).isEmpty();
    }

    // ─── M5: 테넌트 컨텍스트 미설정 ───────────────────────────────────────

    @Test
    @DisplayName("M5: 테넌트 컨텍스트 미설정 시 IllegalStateException — 글로벌 핸들러가 401 매핑")
    void m5_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> controller.getMonthlyMissingConsultationLogs(2026, 4))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }

    // ─── M6: service IllegalArgumentException → propagate ────────────────

    @Test
    @DisplayName("M6: service 가 IllegalArgumentException 을 던지면 컨트롤러는 가공 없이 propagate")
    void m6_serviceIllegalArgument_propagated() {
        when(scheduleService.getMonthlyMissingConsultationLogs(2026, 13))
                .thenThrow(new IllegalArgumentException("month 는 1~12 범위여야 합니다. month=13"));

        assertThatThrownBy(() -> controller.getMonthlyMissingConsultationLogs(2026, 13))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }
}
