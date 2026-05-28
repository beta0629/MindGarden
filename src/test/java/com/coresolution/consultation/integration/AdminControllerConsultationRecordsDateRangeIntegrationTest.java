package com.coresolution.consultation.integration;

import java.time.LocalDate;
import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AdminController GET {@code /api/v1/admin/consultation-records} —
 * P0 핫픽스 (2026-05-29) 회귀 가드 통합 테스트.
 *
 * <p>검증 항목 (4):
 * <ol>
 *   <li>{@code startDate}/{@code endDate} (ISO-8601) 가 Repository 까지 그대로 전달된다.</li>
 *   <li>{@code size=500} 요청 시 본 엔드포인트 한정 200 캡이 적용된다
 *       (기존 {@link com.coresolution.core.util.PaginationUtils#MAX_PAGE_SIZE}=20 우회).</li>
 *   <li>날짜 필터 미지정 시 기존 전체 조회 Repository 메서드를 호출한다 (backward compatibility).</li>
 *   <li>{@link TenantContextHolder} 가 세션 tenantId 로 보존된다 (멀티테넌트 격리).</li>
 * </ol>
 *
 * <p>참고: {@code docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md}.
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController /consultation-records — 기간 필터 & 200 캡 (P0 핫픽스 2026-05-29)")
class AdminControllerConsultationRecordsDateRangeIntegrationTest {

    private static final String TEST_TENANT_ID = "tenant-records-" + UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultationRecordRepository consultationRecordRepository;

    @MockBean
    private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUserId("admin-records");
        adminUser.setEmail("admin@records.test");
        adminUser.setName("테스트관리자");
        adminUser.setTenantId(TEST_TENANT_ID);
        adminUser.setRole(UserRole.ADMIN);

        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(any(UserRole.class)))
                .thenReturn(true);

        when(consultationRecordRepository
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(anyString(), any(Pageable.class)))
                .thenReturn(emptyPage());
        when(consultationRecordRepository
                .findByTenantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        anyString(), any(LocalDate.class), any(LocalDate.class), any(Pageable.class)))
                .thenReturn(emptyPage());
        when(consultationRecordRepository
                .findByTenantIdAndConsultantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        anyString(), anyLong(), any(LocalDate.class), any(LocalDate.class), any(Pageable.class)))
                .thenReturn(emptyPage());
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    private static Page<ConsultationRecord> emptyPage() {
        return new PageImpl<>(java.util.Collections.emptyList());
    }

    @Test
    @DisplayName("startDate/endDate (ISO-8601) 가 Repository 로 그대로 전달된다 — 4월 1일~30일")
    void startEndDate_passedThroughToRepository() throws Exception {
        mockMvc.perform(get("/api/v1/admin/consultation-records")
                        .param("startDate", "2026-04-01")
                        .param("endDate", "2026-04-30")
                        .param("page", "0")
                        .param("size", "100")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser)
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        ArgumentCaptor<LocalDate> startCaptor = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> endCaptor = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);

        verify(consultationRecordRepository)
                .findByTenantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TEST_TENANT_ID),
                        startCaptor.capture(),
                        endCaptor.capture(),
                        pageableCaptor.capture());

        assertThat(startCaptor.getValue()).isEqualTo(LocalDate.of(2026, 4, 1));
        assertThat(endCaptor.getValue()).isEqualTo(LocalDate.of(2026, 4, 30));
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    @DisplayName("size=500 요청 시 본 엔드포인트 한정 200 캡 적용 (전역 MAX_PAGE_SIZE=20 우회)")
    void sizeOverCap_isCappedAt200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/consultation-records")
                        .param("size", "500")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser)
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(consultationRecordRepository)
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TEST_TENANT_ID), pageableCaptor.capture());

        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(200);
    }

    @Test
    @DisplayName("startDate/endDate 미지정 시 기존 전체 조회 Repository 메서드를 호출한다 (backward compat)")
    void noDateRange_callsLegacyRepository() throws Exception {
        mockMvc.perform(get("/api/v1/admin/consultation-records")
                        .param("size", "50")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser)
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk());

        verify(consultationRecordRepository)
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TEST_TENANT_ID), any(Pageable.class));
    }

    @Test
    @DisplayName("consultantId + 기간 — 4-인자 Repository (Consultant + sessionDate BETWEEN) 호출")
    void consultantPlusDateRange_callsConsultantBetweenRepository() throws Exception {
        Long consultantId = 77L;

        mockMvc.perform(get("/api/v1/admin/consultation-records")
                        .param("consultantId", String.valueOf(consultantId))
                        .param("startDate", "2026-04-01")
                        .param("endDate", "2026-04-30")
                        .param("size", "100")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser)
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk());

        verify(consultationRecordRepository)
                .findByTenantIdAndConsultantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TEST_TENANT_ID),
                        eq(consultantId),
                        eq(LocalDate.of(2026, 4, 1)),
                        eq(LocalDate.of(2026, 4, 30)),
                        any(Pageable.class));
    }
}
