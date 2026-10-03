package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.Map;
import com.coresolution.consultation.constant.ErpRestrictedPermissions;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlFinancialService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@code /api/v1/hq/erp/**} 접근 권한 회귀 가드.
 *
 * <p>전사 재무(돈) API 이므로 ADMIN 만 통과하고, 미인증·CONSULTANT·CLIENT 는 물론
 * STAFF 도 막혀야 한다. {@code HQ_FINANCIAL_MANAGE}/{@code HQ_DASHBOARD_VIEW} 가
 * {@link ErpRestrictedPermissions} 에 없으면 STAFF 가 동적 권한 단락으로 자동 통과해
 * 전사 재무를 읽을 수 있었다.</p>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HQ ERP — 전사 재무 API 접근 권한")
class HQErpControllerAuthzTest {

    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PlSqlFinancialService plSqlFinancialService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private HttpSession session;

    private HQErpController controller;

    @BeforeEach
    void setUp() {
        controller = new HQErpController(financialTransactionService, commonCodeService,
                plSqlFinancialService, dynamicPermissionService);
    }

    @Test
    @DisplayName("HQ 재무 권한 2종은 STAFF 자동 통과 제외 집합에 있다")
    void hqPermissions_areErpRestricted() {
        assertThat(ErpRestrictedPermissions.isErpRestricted("HQ_FINANCIAL_MANAGE")).isTrue();
        assertThat(ErpRestrictedPermissions.isErpRestricted("HQ_DASHBOARD_VIEW")).isTrue();
    }

    @Test
    @DisplayName("미인증(세션에 사용자 없음) → 401, 서비스 미호출")
    void unauthenticated_returns401() {
        lenient().when(session.getAttribute("user")).thenReturn(null);

        ResponseEntity<Map<String, Object>> response =
                controller.getConsolidatedFinancialData(null, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(plSqlFinancialService, never()).getConsolidatedFinancialData(any(), any());
    }

    @ParameterizedTest(name = "{0} → HQ_FINANCIAL_MANAGE 없음 → 403")
    @EnumSource(value = UserRole.class, names = {"STAFF", "CONSULTANT", "CLIENT"})
    @DisplayName("ADMIN 이 아닌 역할은 전사 통합 재무를 조회할 수 없다")
    void lowerRoles_forbidden(UserRole role) {
        givenSessionUser(userOf(role));
        lenient().when(dynamicPermissionService.hasPermission(any(User.class),
                eq("HQ_FINANCIAL_MANAGE"))).thenReturn(false);

        ResponseEntity<Map<String, Object>> response =
                controller.getConsolidatedFinancialData(null, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("success", false);
        verify(plSqlFinancialService, never()).getConsolidatedFinancialData(any(), any());
    }

    @Test
    @DisplayName("ADMIN + HQ_FINANCIAL_MANAGE → 200, 서비스 호출")
    void admin_allowed() {
        givenSessionUser(userOf(UserRole.ADMIN));
        lenient().when(dynamicPermissionService.hasPermission(any(User.class),
                eq("HQ_FINANCIAL_MANAGE"))).thenReturn(true);
        lenient().when(plSqlFinancialService.getConsolidatedFinancialData(
                any(LocalDate.class), any(LocalDate.class))).thenReturn(Map.of("totalRevenue", 0L));

        ResponseEntity<Map<String, Object>> response =
                controller.getConsolidatedFinancialData("2026-09-01", "2026-09-30", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("success", true);
        verify(plSqlFinancialService).getConsolidatedFinancialData(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));
    }

    private void givenSessionUser(User user) {
        lenient().when(session.getAttribute("user")).thenReturn(user);
    }

    private User userOf(UserRole role) {
        User user = new User();
        user.setId(900L);
        user.setUserId("hq-authz-" + role.name().toLowerCase());
        user.setEmail("hq-authz-" + role.name().toLowerCase() + "@example.com");
        user.setName("권한테스트");
        user.setPassword("encoded-password-1234");
        user.setRole(role);
        return user;
    }
}
