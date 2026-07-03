package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.CumulativeMissingConsultationLogsResponse;
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
 * {@link ScheduleController#getCumulativeMissingConsultationLogs()} 단위 테스트.
 *
 * <p>2026-07-03 — 어드민 대시보드 «상담일지 누락» 섹션이 현재 월만 조회하여 이전 달
 * 누락 건을 놓치던 버그 보정. 누적(전체 기간) API
 * ({@code GET /api/v1/schedules/cumulative-missing-consultation-logs}) 의 Controller 계층
 * SSOT.</p>
 *
 * <ul>
 *   <li>M1·M2: @PreAuthorize(hasAnyRole ADMIN/STAFF) 가드 존재 (reflection)</li>
 *   <li>M3: 응답 포맷 — success=true, data.items, ApiResponse 래핑</li>
 *   <li>M4: 누락 0건 (items 빈 배열) → 200 + 빈 items</li>
 *   <li>M5: 테넌트 컨텍스트 미설정 → IllegalStateException propagate</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-07-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController.getCumulativeMissingConsultationLogs — 누적 상담일지 누락")
class ScheduleControllerCumulativeMissingConsultationLogsTest {

    private static final String TENANT_ID = "tenant-controller-cumulative-missing-1";

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
    @DisplayName("M1·M2: @PreAuthorize(\"hasAnyRole('ADMIN', 'STAFF')\") 가 존재한다")
    void m1m2_preAuthorizeAnnotation_present() throws NoSuchMethodException {
        Method method = ScheduleController.class.getDeclaredMethod("getCumulativeMissingConsultationLogs");

        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
                .as("누적 상담일지 누락 엔드포인트는 @PreAuthorize 가드를 가져야 한다")
                .isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('ADMIN', 'STAFF')");
    }

    // ─── M3: 응답 포맷 ───────────────────────────────────────────────────

    @Test
    @DisplayName("M3: 응답 포맷 — success=true, data.items(월 경계 넘는 6/30·7/1 포함), timestamp 존재")
    void m3_responseFormat_success() {
        CumulativeMissingConsultationLogsResponse stub = CumulativeMissingConsultationLogsResponse.builder()
                .items(Arrays.asList(
                        ConsultantMissingLogs.builder()
                                .consultantId(3L)
                                .consultantName("조재은")
                                .missingDates(Arrays.asList(
                                        LocalDate.of(2026, 6, 30),
                                        LocalDate.of(2026, 7, 1)))
                                .build()))
                .build();
        when(scheduleService.getCumulativeMissingConsultationLogs()).thenReturn(stub);

        ResponseEntity<ApiResponse<CumulativeMissingConsultationLogsResponse>> response =
                controller.getCumulativeMissingConsultationLogs();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<CumulativeMissingConsultationLogsResponse> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getTimestamp()).isNotNull();
        CumulativeMissingConsultationLogsResponse data = body.getData();
        assertThat(data).isNotNull();
        assertThat(data.getItems()).hasSize(1);
        assertThat(data.getItems().get(0).getConsultantId()).isEqualTo(3L);
        assertThat(data.getItems().get(0).getMissingDates()).hasSize(2);
        verify(scheduleService, times(1)).getCumulativeMissingConsultationLogs();
    }

    // ─── M4: 누락 0건 ────────────────────────────────────────────────────

    @Test
    @DisplayName("M4: 누락 0건 → 200 + items=[] (UI 가 «모두 작성됨» placeholder 노출)")
    void m4_emptyItems_success() {
        CumulativeMissingConsultationLogsResponse stub = CumulativeMissingConsultationLogsResponse.builder()
                .items(Collections.emptyList())
                .build();
        when(scheduleService.getCumulativeMissingConsultationLogs()).thenReturn(stub);

        ResponseEntity<ApiResponse<CumulativeMissingConsultationLogsResponse>> response =
                controller.getCumulativeMissingConsultationLogs();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getItems()).isEmpty();
    }

    // ─── M5: 테넌트 컨텍스트 미설정 ───────────────────────────────────────

    @Test
    @DisplayName("M5: 테넌트 컨텍스트 미설정 시 IllegalStateException — 글로벌 핸들러가 401 매핑")
    void m5_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> controller.getCumulativeMissingConsultationLogs())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }
}
