package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.CumulativeConsultantCountsResponse;
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
 * {@link ScheduleController#getCumulativeConsultantCompletedCounts()} 단위 테스트.
 *
 * <p>R6 (2026-06-06) 신규 API ({@code GET /api/v1/schedules/cumulative-consultant-counts})
 * 의 Controller 계층 SSOT. 직접 메서드 호출 방식이라 Spring Security 가드(@PreAuthorize) 의
 * 실제 실행은 우회되므로, C1/C2/C3 는 어노테이션 reflection 으로 검증한다. (HTTP 시큐리티
 * 통합 검증은 별도 통합 테스트가 필요 — 본 슈트 범위 밖.)</p>
 *
 * <ul>
 *   <li>C1: ADMIN 호출 시 200 — @PreAuthorize 어노테이션에 ADMIN 포함</li>
 *   <li>C2: STAFF 호출 시 200 — @PreAuthorize 어노테이션에 STAFF 포함</li>
 *   <li>C3: 일반 사용자(CLIENT/CONSULTANT) 호출 시 403 — @PreAuthorize 가드 존재 + ADMIN/STAFF 외 차단</li>
 *   <li>C4: 테넌트 컨텍스트 미설정 → IllegalStateException (글로벌 핸들러 401 매핑 보장)</li>
 *   <li>C5: 정상 응답 스키마 — success=true, data.counts 정확</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController.getCumulativeConsultantCompletedCounts — 누적 상담사 COMPLETED 카운트")
class ScheduleControllerCumulativeConsultantCountsTest {

    private static final String TENANT_ID = "tenant-controller-cumulative-1";

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

    // ─── C1/C2/C3: @PreAuthorize 어노테이션 검증 ────────────────────────

    @Test
    @DisplayName("C1·C2·C3: @PreAuthorize(\"hasAnyRole('ADMIN', 'STAFF')\") — ADMIN·STAFF 허용, CLIENT/CONSULTANT 차단")
    void c1c2c3_preAuthorizeAnnotation_present() throws NoSuchMethodException {
        Method method = ScheduleController.class.getDeclaredMethod(
                "getCumulativeConsultantCompletedCounts");

        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation)
                .as("누적 상담사 COMPLETED 카운트 엔드포인트는 @PreAuthorize 가드를 가져야 한다")
                .isNotNull();
        assertThat(annotation.value())
                .as("ADMIN/STAFF 만 허용 — CLIENT·CONSULTANT 는 403 으로 차단")
                .isEqualTo("hasAnyRole('ADMIN', 'STAFF')");
    }

    // ─── C4: 테넌트 컨텍스트 미설정 ───────────────────────────────────────

    @Test
    @DisplayName("C4: 테넌트 컨텍스트 미설정 → IllegalStateException (글로벌 핸들러 401 매핑)")
    void c4_noTenantContext_throwsIllegalState() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> controller.getCumulativeConsultantCompletedCounts())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }

    // ─── C5: 정상 응답 스키마 ────────────────────────────────────────────

    @Test
    @DisplayName("C5: 정상 응답 스키마 — success=true, data.counts 정확, ApiResponse 래핑")
    void c5_responseFormat_success() {
        CumulativeConsultantCountsResponse stub = CumulativeConsultantCountsResponse.builder()
                .counts(Arrays.asList(
                        ConsultantCount.builder()
                                .consultantId(101L)
                                .consultantName("홍길동")
                                .count(125L)
                                .build(),
                        ConsultantCount.builder()
                                .consultantId(102L)
                                .consultantName("김상담")
                                .count(7L)
                                .build(),
                        ConsultantCount.builder()
                                .consultantId(103L)
                                .consultantName("신입상담사")
                                .count(0L)
                                .build()))
                .build();
        when(scheduleService.getCumulativeConsultantCompletedCounts(eq(TENANT_ID))).thenReturn(stub);

        ResponseEntity<ApiResponse<CumulativeConsultantCountsResponse>> response =
                controller.getCumulativeConsultantCompletedCounts();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ApiResponse<CumulativeConsultantCountsResponse> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getTimestamp()).isNotNull();
        CumulativeConsultantCountsResponse data = body.getData();
        assertThat(data).isNotNull();
        assertThat(data.getCounts()).hasSize(3);
        assertThat(data.getCounts().get(0).getConsultantId()).isEqualTo(101L);
        assertThat(data.getCounts().get(0).getConsultantName()).isEqualTo("홍길동");
        // 상한 표기 없이 절대값 그대로 (125L) — 99+ 표기는 프론트 책임.
        assertThat(data.getCounts().get(0).getCount()).isEqualTo(125L);
        assertThat(data.getCounts().get(1).getCount()).isEqualTo(7L);
        assertThat(data.getCounts().get(2).getCount()).isEqualTo(0L);
        verify(scheduleService, times(1)).getCumulativeConsultantCompletedCounts(eq(TENANT_ID));
    }

    // ─── C5(보강): 빈 카운트 응답 ────────────────────────────────────────

    @Test
    @DisplayName("C5(보강): 빈 카운트 — counts=[] 응답도 정상 (활성 상담사 0명 가정)")
    void c5_emptyCounts_success() {
        CumulativeConsultantCountsResponse stub = CumulativeConsultantCountsResponse.builder()
                .counts(Collections.emptyList())
                .build();
        when(scheduleService.getCumulativeConsultantCompletedCounts(eq(TENANT_ID))).thenReturn(stub);

        ResponseEntity<ApiResponse<CumulativeConsultantCountsResponse>> response =
                controller.getCumulativeConsultantCompletedCounts();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getCounts()).isNotNull().isEmpty();
    }
}
