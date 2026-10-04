package com.coresolution.consultation.integration;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CounselorTrainingService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.EmotionAnalysisService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.integrationtest.support.ErrorBodyContract;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * 5xx·400 응답 공통 계약 — 대표 엔드포인트를 한 테스트로 묶어 검증한다.
 *
 * <p>5xx 는 경로와 무관하게 공통 한글 문구 + {@code errorCode} + {@code traceId} 이고
 * SQL·클래스명·스택 문구가 없어야 한다. 잘못된 입력(날짜 형식 등)은 500 이 아니라 400 이어야 한다.</p>
 *
 * <p>엔드포인트를 추가할 때는 {@link ServerErrorCase} 에 항목을 더한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("공통 오류 응답 계약 — 5xx 정리 / 잘못된 입력 400")
class CommonErrorContractMvcTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    /** 응답에 새어 나오면 안 되는 기술 문구 — 테스트 픽스처 전용 (실제 접속 정보 아님) */
    private static final String SQL_LEAK =
            "PreparedStatementCallback; bad SQL grammar [SELECT b.branch_name FROM branches b WHERE b.tenant_id = ?];"
                    + " nested exception is java.sql.SQLSyntaxErrorException: Access denied for the application user";

    /** 대표 5xx 경로 — 컨트롤러 catch 가 아니라 전역 처리기가 본문을 만든다. */
    private enum ServerErrorCase {
        ERP_FINANCE_DASHBOARD("/api/v1/erp/finance/dashboard"),
        PERMISSION_GROUPS_MY("/api/v1/permissions/groups/my"),
        HQ_BRANCH_MANAGEMENT_BRANCHES("/api/v1/hq/branch-management/branches"),
        HQ_BRANCHES("/api/v1/hq/branches"),
        EMOTION_ANALYSIS_TREND("/api/v1/emotion-analysis/trend/1?emotionType=ANXIETY"),
        TRAINING_FEEDBACK_HISTORY("/api/v1/training/feedback/1");

        private final String path;

        ServerErrorCase(String path) {
            this.path = path;
        }
    }

    /**
     * 잘못된 입력 대표 경로 — 날짜·숫자 파라미터가 한쪽만 와도 400 이어야 하고,
     * 본문에 {@code For input string} 같은 예외 원문이 없어야 한다.
     */
    private enum BadInputCase {
        DASHBOARD_START_ONLY("/api/v1/erp/finance/dashboard", "startDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        DASHBOARD_END_ONLY("/api/v1/erp/finance/dashboard", "endDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        STATISTICS_START_ONLY("/api/v1/erp/finance/statistics", "startDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        CATEGORY_ANALYSIS_END_ONLY("/api/v1/erp/finance/category-analysis", "endDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        DAILY_REPORT_DATE("/api/v1/erp/finance/daily-report", "reportDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        INCOME_STATEMENT_START_ONLY("/api/v1/erp/finance/income-statement", "startDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        BALANCE_SHEET_DATE("/api/v1/erp/finance/balance-sheet", "reportDate", "bad",
                ApiRequestErrorMessages.INVALID_DATE_FORMAT, ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT),
        MONTHLY_REPORT_YEAR("/api/v1/erp/finance/monthly-report", "year", "abc",
                ApiRequestErrorMessages.INVALID_PARAMETER_TYPE, ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE),
        MONTHLY_REPORT_MONTH("/api/v1/erp/finance/monthly-report", "month", "99",
                ApiRequestErrorMessages.INVALID_PARAMETER_TYPE, ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE),
        YEARLY_REPORT_YEAR("/api/v1/erp/finance/yearly-report", "year", "abc",
                ApiRequestErrorMessages.INVALID_PARAMETER_TYPE, ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE),
        TAX_MONTHLY_SERIES_YEAR("/api/v1/erp/finance/tax-monthly-series", "year", "abc",
                ApiRequestErrorMessages.INVALID_PARAMETER_TYPE, ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE);

        private final String path;
        private final String param;
        private final String value;
        private final String message;
        private final String errorCode;

        BadInputCase(String path, String param, String value, String message, String errorCode) {
            this.path = path;
            this.param = param;
            this.value = value;
            this.message = message;
            this.errorCode = errorCode;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ErpService erpService;

    @MockBean
    private PermissionGroupService permissionGroupService;

    @MockBean
    private BranchService branchService;

    @MockBean
    private DynamicPermissionService dynamicPermissionService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private EmotionAnalysisService emotionAnalysisService;

    @MockBean
    private CounselorTrainingService counselorTrainingService;

    @ParameterizedTest(name = "{0} → 500 · 공통 문구 · errorCode · traceId · 기술 문구 없음")
    @EnumSource(ServerErrorCase.class)
    @DisplayName("대표 경로의 서버 오류는 모두 같은 5xx 본문")
    void serverErrors_shareSanitizedBody(ServerErrorCase testCase) throws Exception {
        stubCommonBeans();
        RuntimeException leak = new InvalidDataAccessResourceUsageException(SQL_LEAK);
        when(erpService.getBranchFinanceDashboard(any())).thenThrow(leak);
        when(permissionGroupService.getUserPermissionGroupCodes(anyString(), anyString())).thenThrow(leak);
        when(branchService.getAllActiveBranches()).thenThrow(leak);
        when(emotionAnalysisService.getEmotionTrend(any(), anyString())).thenThrow(leak);
        when(counselorTrainingService.getFeedbackHistory(any(), any())).thenThrow(leak);

        ErrorBodyContract.assertSanitizedServerError(perform(testCase.path));
    }

    @ParameterizedTest(name = "{0} → 400 · 공통 문구 · 예외 원문/내부 식별자 없음")
    @EnumSource(BadInputCase.class)
    @DisplayName("잘못된 날짜·숫자 파라미터는 한쪽만 와도 400 (200·raw 문구 금지)")
    void badInputs_shareClientSafeBody(BadInputCase testCase) throws Exception {
        stubCommonBeans();

        ResultActions actions = mockMvc.perform(get(testCase.path)
                .param(testCase.param, testCase.value)
                .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID));

        ErrorBodyContract.assertBadRequest(actions, testCase.message, testCase.errorCode);
    }

    @Test
    @DisplayName("ERP 재무 대시보드 — 두 날짜가 모두 와도 범위 밖이면 400 · 날짜 안내 문구")
    void financeDashboard_outOfRangeDate_returnsBadRequest() throws Exception {
        stubCommonBeans();

        ResultActions actions = mockMvc.perform(get("/api/v1/erp/finance/dashboard")
                .param("startDate", "2026-01-01")
                .param("endDate", "2026-13-45")
                .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID));

        ErrorBodyContract.assertBadRequest(actions,
                ApiRequestErrorMessages.INVALID_DATE_FORMAT,
                ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT);
    }

    @Test
    @DisplayName("권한 그룹 조회 — 역할 할당이 없으면 400 이 아니라 200 · 빈 목록 (세션 값 노출 없음)")
    void permissionGroupsMy_noRoleAssignment_returnsEmptyList() throws Exception {
        stubCommonBeans();

        ResultActions actions = mockMvc.perform(get("/api/v1/permissions/groups/my")
                .sessionAttr(SessionConstants.USER_OBJECT, clientUser())
                .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID));

        actions.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.success").value(true))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.data").isArray())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.data").isEmpty());
        ErrorBodyContract.assertNoSensitiveLeak(actions);
    }

    @Test
    @DisplayName("권한 그룹 조회 — 로그인 사용자가 없으면 400 (세션 값 노출 없음)")
    void permissionGroupsMy_noSessionUser_returnsBadRequest() throws Exception {
        ResultActions actions = mockMvc.perform(get("/api/v1/permissions/groups/my"));

        actions.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                .status().isBadRequest());
        ErrorBodyContract.assertNoSensitiveLeak(actions);
    }

    @Test
    @DisplayName("자원 id 가드 — 없는 리포트 id 는 실제 가드·리포지토리 경로로도 403 (500 아님)")
    void multimodalReport_missingId_forbiddenThroughRealBeans() throws Exception {
        ResultActions actions = mockMvc.perform(get("/api/v1/emotion-analysis/multimodal/999999")
                .sessionAttr(SessionConstants.USER_OBJECT, clientUser())
                .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID));

        actions.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isForbidden())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.data").doesNotExist());
        ErrorBodyContract.assertNoSensitiveLeak(actions);
    }

    @Test
    @DisplayName("지점 목록 — 사용 중단된 저장소 접근 불가여도 200 · 빈 목록 (500 아님)")
    void branchManagement_deprecatedStoreUnavailable_returnsEmptyList() throws Exception {
        stubCommonBeans();
        when(branchService.getAllActiveBranches()).thenReturn(List.of());

        perform("/api/v1/hq/branch-management/branches")
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.success").value(true))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.totalCount").value(0));
    }

    private ResultActions perform(String path) throws Exception {
        return mockMvc.perform(get(path)
                .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                .sessionAttr(SessionConstants.ROLE_ID, UserRole.ADMIN.name()));
    }

    private void stubCommonBeans() {
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);
        when(userRepository.findByTenantIdAndId(anyString(), any()))
                .thenReturn(Optional.of(adminUser()));
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-error-contract");
        user.setEmail("admin-error-contract@test.com");
        user.setName("테스트관리자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    /** 자원 id 가드를 실제 빈(@Transactional 프록시 + 리포지토리)으로 통과시키기 위한 내담자 세션 사용자. */
    private User clientUser() {
        User user = new User();
        user.setId(20L);
        user.setUserId("client-error-contract");
        user.setEmail("client-error-contract@test.com");
        user.setName("테스트내담자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.CLIENT);
        return user;
    }
}
