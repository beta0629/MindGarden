package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.ProcedureUserFacingMessages;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ProcedureExecutionException;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlAccountingService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@code /api/v1/admin/plsql-accounting/consolidated-financial} 실패 응답 통일 가드.
 *
 * <p>프로시저가 {@code success:false} 로 끝나거나 호출이 예외로 끝나면, 바깥을
 * {@code success:true} 로 감싸지 않고 {@link ProcedureExecutionException} 으로 끝나야 한다.
 * 전역 예외 처리기가 HTTP 500 + {@code success:false} + 한글 문구로 응답하고,
 * SQL·프로시저 원문은 응답이 아니라 로그로만 남는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("전사 통합 재무 — 실패 응답 공통 포맷")
class PlSqlAccountingControllerConsolidatedFailureTest {

    private static final String SQL_DETAIL = "Parameter number 4 is not an OUT parameter";

    @Mock private PlSqlAccountingService plSqlAccountingService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private PlSqlAccountingController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        User admin = new User();
        admin.setId(1L);
        admin.setUserId("admin-consolidated");
        admin.setEmail("admin-consolidated@example.com");
        admin.setName("관리자");
        admin.setPassword("encoded-password-1234");
        admin.setRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

        controller = new PlSqlAccountingController(plSqlAccountingService, dynamicPermissionService);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("프로시저 success:false → 공통 예외 + 한글 문구, SQL 원문은 응답에 없음")
    void procedureFailure_throwsSharedException() {
        Map<String, Object> failure = new HashMap<>();
        failure.put("success", false);
        failure.put("message", "통합 재무 현황 조회 중 오류가 발생했습니다: " + SQL_DETAIL);
        when(plSqlAccountingService.getConsolidatedFinancialData(
                any(LocalDate.class), any(LocalDate.class), any())).thenReturn(failure);

        assertThatThrownBy(() -> controller.getConsolidatedFinancialData(
                "2026-09-01", "2026-09-30", null, session))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(ProcedureUserFacingMessages.CONSOLIDATED_FINANCIAL_FAILED)
                .satisfies(thrown -> {
                    ProcedureExecutionException failureException = (ProcedureExecutionException) thrown;
                    assertThat(failureException.getProcedureName())
                            .isEqualTo(ProcedureUserFacingMessages.PROC_GET_CONSOLIDATED_FINANCIAL_DATA);
                    assertThat(failureException.getMessage()).doesNotContain(SQL_DETAIL);
                    assertThat(failureException.getDetail()).contains(SQL_DETAIL);
                });
    }

    @Test
    @DisplayName("서비스가 예외를 던져도 같은 공통 예외로 끝난다")
    void serviceException_throwsSharedException() {
        when(plSqlAccountingService.getConsolidatedFinancialData(
                any(LocalDate.class), any(LocalDate.class), any()))
                .thenThrow(new IllegalStateException(SQL_DETAIL));

        assertThatThrownBy(() -> controller.getConsolidatedFinancialData(
                null, null, null, session))
                .isInstanceOf(ProcedureExecutionException.class)
                .hasMessage(ProcedureUserFacingMessages.CONSOLIDATED_FINANCIAL_FAILED);
    }

    @Test
    @DisplayName("성공 응답 본문은 그대로 유지된다")
    void successResponse_unchanged() {
        Map<String, Object> success = new HashMap<>();
        success.put("success", true);
        success.put("message", "재무 데이터 조회 완료");
        success.put("totalRevenue", 100_000L);
        when(plSqlAccountingService.getConsolidatedFinancialData(
                any(LocalDate.class), any(LocalDate.class), any())).thenReturn(success);

        ResponseEntity<Map<String, Object>> response =
                controller.getConsolidatedFinancialData("2026-09-01", "2026-09-30", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(success);
    }
}
