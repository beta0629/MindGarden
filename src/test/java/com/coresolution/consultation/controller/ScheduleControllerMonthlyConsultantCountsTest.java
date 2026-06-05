package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.MonthlyConsultantCountsResponse;
import com.coresolution.consultation.dto.MonthlyConsultantCountsResponse.ConsultantCount;
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
 * {@link ScheduleController#getMonthlyConsultantCompletedCounts(int, int)} 단위 테스트.
 *
 * <p>2026-06-09 신규 API ({@code GET /api/v1/schedules/monthly-consultant-counts}) 의 Controller
 * 계층 SSOT. 직접 메서드 호출 방식이라 Spring Security 가드(@PreAuthorize) 의 실제 실행은
 * 우회되므로, C1/C2 는 어노테이션 reflection 으로 검증한다. C4·C5·C6 (HTTP 파라미터/검증/글로벌
 * 핸들러 매핑) 은 별도 통합 테스트가 필요하다(본 슈트의 단위 테스트 범위 밖).</p>
 *
 * <ul>
 *   <li>C1: ROLE_CLIENT/CONSULTANT 호출 시 403 — @PreAuthorize 어노테이션 값 검증</li>
 *   <li>C2: ROLE_ADMIN / ROLE_STAFF 호출 시 200 — @PreAuthorize 동일 어노테이션</li>
 *   <li>C3: 응답 포맷 — success=true, data.year/month/counts, ApiResponse 래핑</li>
 *   <li>C7: 테넌트 컨텍스트 미설정 → IllegalStateException 던짐 (글로벌 핸들러 401 매핑 보장)</li>
 *   <li>C8: 상한 가공 없이 절대값 반환 (count=120 그대로)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController.getMonthlyConsultantCompletedCounts — 월별 상담사 COMPLETED 카운트")
class ScheduleControllerMonthlyConsultantCountsTest {

    private static final String TENANT_ID = "tenant-controller-1";

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

    // ─── C1 / C2: @PreAuthorize 어노테이션 검증 ─────────────────────────

    @Test
    @DisplayName("C1·C2: @PreAuthorize(\"hasAnyRole('ADMIN', 'STAFF')\") 가 존재한다 — CLIENT/CONSULTANT 차단, ADMIN/STAFF 허용")
    void c1c2_preAuthorizeAnnotation_present() throws NoSuchMethodException {
        Method method = ScheduleController.class.getDeclaredMethod(
                "getMonthlyConsultantCompletedCounts", int.class, int.class);

        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
                .as("월별 상담사 COMPLETED 카운트 엔드포인트는 @PreAuthorize 가드를 가져야 한다")
                .isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('ADMIN', 'STAFF')");
    }

    // ─── C3: 응답 포맷 ───────────────────────────────────────────────────

    @Test
    @DisplayName("C3: 응답 포맷 — success=true, data.year/month/counts, timestamp 존재")
    void c3_responseFormat_success() {
        MonthlyConsultantCountsResponse stub = MonthlyConsultantCountsResponse.builder()
                .year(2026)
                .month(6)
                .counts(Arrays.asList(
                        ConsultantCount.builder()
                                .consultantId(101L)
                                .consultantName("홍길동")
                                .count(7L)
                                .build(),
                        ConsultantCount.builder()
                                .consultantId(102L)
                                .consultantName("김상담")
                                .count(0L)
                                .build()))
                .build();
        when(scheduleService.getMonthlyConsultantCompletedCounts(2026, 6)).thenReturn(stub);

        ResponseEntity<ApiResponse<MonthlyConsultantCountsResponse>> response =
                controller.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<MonthlyConsultantCountsResponse> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getTimestamp()).isNotNull();
        MonthlyConsultantCountsResponse data = body.getData();
        assertThat(data).isNotNull();
        assertThat(data.getYear()).isEqualTo(2026);
        assertThat(data.getMonth()).isEqualTo(6);
        assertThat(data.getCounts()).hasSize(2);
        assertThat(data.getCounts().get(0).getConsultantId()).isEqualTo(101L);
        assertThat(data.getCounts().get(0).getConsultantName()).isEqualTo("홍길동");
        assertThat(data.getCounts().get(0).getCount()).isEqualTo(7L);
        assertThat(data.getCounts().get(1).getCount()).isEqualTo(0L);
        verify(scheduleService, times(1)).getMonthlyConsultantCompletedCounts(eq(2026), eq(6));
    }

    // ─── C7: 테넌트 컨텍스트 미설정 ───────────────────────────────────────

    @Test
    @DisplayName("C7: 테넌트 컨텍스트 미설정 시 IllegalStateException — 글로벌 핸들러가 401 (TENANT_ID_NOT_SET) 매핑")
    void c7_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> controller.getMonthlyConsultantCompletedCounts(2026, 6))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }

    // ─── C8: count 절대값 ────────────────────────────────────────────────

    @Test
    @DisplayName("C8: 상한 가공 없이 절대값 반환 (count=120 그대로) — 99+ 표기는 프론트 책임")
    void c8_absoluteCountReturned() {
        MonthlyConsultantCountsResponse stub = MonthlyConsultantCountsResponse.builder()
                .year(2026)
                .month(6)
                .counts(Collections.singletonList(
                        ConsultantCount.builder()
                                .consultantId(201L)
                                .consultantName("다건상담사")
                                .count(120L)
                                .build()))
                .build();
        when(scheduleService.getMonthlyConsultantCompletedCounts(2026, 6)).thenReturn(stub);

        ResponseEntity<ApiResponse<MonthlyConsultantCountsResponse>> response =
                controller.getMonthlyConsultantCompletedCounts(2026, 6);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getCounts()).hasSize(1);
        assertThat(response.getBody().getData().getCounts().get(0).getCount()).isEqualTo(120L);
    }

    // ─── C6: service IllegalArgumentException → 컨트롤러는 그대로 throw ──

    @Test
    @DisplayName("C6: service 가 IllegalArgumentException 을 던지면 컨트롤러는 가공 없이 propagate (글로벌 핸들러 400 매핑)")
    void c6_serviceIllegalArgument_propagated() {
        when(scheduleService.getMonthlyConsultantCompletedCounts(2026, 13))
                .thenThrow(new IllegalArgumentException("month 는 1~12 범위여야 합니다. month=13"));

        assertThatThrownBy(() -> controller.getMonthlyConsultantCompletedCounts(2026, 13))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("month");
    }
}
