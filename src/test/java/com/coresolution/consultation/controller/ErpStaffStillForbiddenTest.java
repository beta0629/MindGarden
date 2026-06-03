package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.erp.AccountingController;
import com.coresolution.consultation.controller.erp.ErpController;
import com.coresolution.consultation.controller.erp.FinancialStatementController;
import com.coresolution.consultation.controller.erp.LedgerController;
import com.coresolution.consultation.controller.erp.SettlementController;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RecurringExpenseService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * ERP 영역 STAFF 차단 절대 회귀 방어 테스트 (1.0.5).
 *
 * <p>⚠️ 본 테스트가 그린이 아니면 변경 ①·② 의 ERP 우회 회귀가 발생한 것입니다.
 * 즉시 작업을 중단하고 보고하세요.</p>
 *
 * <p>검증 항목:</p>
 * <ul>
 *   <li>SettlementController — ERP_ACCESS 없는 STAFF → 403</li>
 *   <li>AccountingController — ERP_ACCESS 없는 STAFF → 403</li>
 *   <li>LedgerController — ERP_ACCESS 없는 STAFF → 403</li>
 *   <li>FinancialStatementController — ERP_ACCESS 없는 STAFF → 403</li>
 *   <li>ErpController — ERP_ACCESS 없는 STAFF → 403</li>
 *   <li>SalaryBatchController — SALARY_MANAGE 없는 STAFF → 403</li>
 *   <li>FinancialTransaction 거래는 ErpController 내부에서 ERP_ACCESS 게이트로 차단됨</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ERP 영역 — STAFF 차단 절대 회귀 방어 (1.0.5)")
class ErpStaffStillForbiddenTest {

    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private HttpSession session;
    @Mock private SettlementService settlementService;
    @Mock private AccountingService accountingService;
    @Mock private LedgerService ledgerService;
    @Mock private FinancialStatementService financialStatementService;
    @Mock private ErpService erpService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private RecurringExpenseService recurringExpenseService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private UserRepository userRepository;
    @Mock private Environment environment;
    @Mock private SalaryBatchService salaryBatchService;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private User staff;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        staff = new User();
        staff.setId(500L);
        staff.setUserId("staff-erp");
        staff.setEmail("staff-erp@example.com");
        staff.setName("스태프");
        staff.setPassword("encoded-password-1234");
        staff.setRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        // STAFF 단락은 ERP 권한들을 통과시키지 않음 (ErpRestrictedPermissions).
        // 따라서 동적 권한 호출까지 떨어지고, DB 시드 없음으로 false.
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("ERP_ACCESS")))
                .thenReturn(false);
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("SettlementController — STAFF + ERP_ACCESS 없음 → 403")
    void settlement_staff_forbidden() {
        SettlementController controller =
                new SettlementController(settlementService, dynamicPermissionService);

        ResponseEntity<?> response = controller.getRules(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("AccountingController — STAFF + ERP_ACCESS 없음 → 403")
    void accounting_staff_forbidden() {
        AccountingController controller =
                new AccountingController(accountingService, dynamicPermissionService);

        ResponseEntity<?> response = controller.getJournalEntries(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("LedgerController — STAFF + ERP_ACCESS 없음 → 403")
    void ledger_staff_forbidden() {
        LedgerController controller =
                new LedgerController(ledgerService, dynamicPermissionService);

        ResponseEntity<?> response = controller.getLedgersByAccount(1L, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("FinancialStatementController — STAFF + ERP_ACCESS 없음 → 403")
    void financialStatement_staff_forbidden() {
        FinancialStatementController controller = new FinancialStatementController(
                financialStatementService, dynamicPermissionService);

        ResponseEntity<?> response = controller.getIncomeStatement(
                java.time.LocalDate.now().minusDays(30), java.time.LocalDate.now(), null, null,
                session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("ErpController — STAFF + ERP_ACCESS 없음 → 403")
    void erp_staff_forbidden() {
        // environment.acceptsProfiles 는 stub 하지 않음 — Mockito 기본값 false 로
        // local/dev 분기를 건너뛰고 동적 ERP_ACCESS 체크로 떨어진다.
        ErpController controller = new ErpController(erpService, financialTransactionService,
                recurringExpenseService, commonCodeService, dynamicPermissionService,
                userRepository, environment);

        ResponseEntity<Map<String, Object>> response = controller.getAllItems(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("SalaryBatchController — STAFF + SALARY_MANAGE 없음 → 403")
    void salaryBatch_staff_forbidden() {
        SalaryBatchController controller =
                new SalaryBatchController(salaryBatchService, dynamicPermissionService);

        ResponseEntity<Map<String, Object>> response =
                controller.executeBatch(new HashMap<>(), session);

        // PermissionCheckUtils.checkPermission 이 403 반환
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
