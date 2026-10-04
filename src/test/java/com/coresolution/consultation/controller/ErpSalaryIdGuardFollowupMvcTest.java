package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.controller.erp.AccountingController;
import com.coresolution.consultation.controller.erp.ErpController;
import com.coresolution.consultation.controller.erp.LedgerController;
import com.coresolution.consultation.entity.Account;
import com.coresolution.consultation.entity.Budget;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.Item;
import com.coresolution.consultation.entity.PurchaseOrder;
import com.coresolution.consultation.entity.PurchaseRequest;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.AccountRepository;
import com.coresolution.consultation.repository.BudgetRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ItemRepository;
import com.coresolution.consultation.repository.PurchaseOrderRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository;
import com.coresolution.consultation.service.DiscountAccountingService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.RecurringExpenseService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.consultation.service.impl.RecurringExpenseServiceImpl;
import com.coresolution.consultation.service.impl.SalaryManagementServiceImpl;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * ERP 조달(승인·취소·주문 생성 포함)·예산·반복 지출·분개·원장·할인 회계, 급여 프로필 수정·세금 상세·승인·지급 —
 * 자원 id 공통 가드 매트릭스.
 *
 * <p>엔드포인트마다 미인증 401 · 역할 없음 403 · 다른 테넌트 공통 403(데이터 없음, 서비스 미호출) ·
 * 같은 테넌트 200 을 확인한다. 실제 서비스 구현으로 다른 테넌트 id 를 보내던 경로(반복 지출 수정·삭제 500,
 * 급여 프로필 수정 500, 세금 상세 404)도 같은 403 으로 수렴하는지 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ERP·급여 자원 id — 공통 가드 매트릭스")
class ErpSalaryIdGuardFollowupMvcTest {

    private static final String TENANT_A = "tenant-id-guard-a";
    private static final String TENANT_B = "tenant-id-guard-b";
    private static final long ADMIN_A = 1L;
    private static final long CLIENT_A = 2L;
    private static final long ADMIN_B = 900L;
    private static final long CONSULTANT_A = 30L;
    private static final long ID = 501L;
    private static final String ERP = "/api/v1/erp";
    private static final String SALARY = "/api/v1/admin/salary";
    private static final String ENTRIES = "/api/v1/erp/accounting/entries";
    private static final String LEDGERS = "/api/v1/erp/accounting/ledgers";
    private static final String DISCOUNT = "/api/v1/admin/discount-accounting";
    private static final String ITEM_BODY = "{\"name\":\"n\",\"category\":\"c\",\"unitPrice\":1000,\"stockQuantity\":1}";
    private static final String PROFILE_BODY = "{\"consultantId\":" + CONSULTANT_A + ",\"salaryType\":\"FREELANCE\"}";
    private static final String RECORD_MONTH_BODY = "{\"yearMonth\":\"2026-10\",\"amount\":1000}";

    /** 메서드 · 경로 · 본문 */
    private static final List<String[]> ENDPOINTS = List.of(
        new String[] {"GET", ERP + "/items/" + ID, null},
        new String[] {"PUT", ERP + "/items/" + ID, ITEM_BODY},
        new String[] {"DELETE", ERP + "/items/" + ID, null},
        new String[] {"PUT", ERP + "/items/" + ID + "/stock?quantity=5", null},
        new String[] {"GET", ERP + "/purchase-requests/" + ID, null},
        new String[] {"GET", ERP + "/purchase-orders/" + ID, null},
        new String[] {"PUT", ERP + "/purchase-orders/" + ID + "/status?status=ORDERED", null},
        new String[] {"POST", ERP + "/purchase-orders/" + ID + "/deliver", null},
        new String[] {"GET", ERP + "/budgets/" + ID, null},
        new String[] {"PUT", ERP + "/recurring-expenses/" + ID, "{}"},
        new String[] {"DELETE", ERP + "/recurring-expenses/" + ID, null},
        new String[] {"POST", ERP + "/recurring-expenses/" + ID + "/record-month", RECORD_MONTH_BODY},
        new String[] {"POST", ERP + "/recurring-expenses/" + ID + "/process", null},
        new String[] {"PUT", SALARY + "/profiles/" + ID, PROFILE_BODY},
        new String[] {"GET", SALARY + "/tax/" + ID, null},
        new String[] {"POST", ERP + "/purchase-requests/" + ID + "/approve-admin?adminId=" + ADMIN_A, null},
        new String[] {"POST", ERP + "/purchase-requests/" + ID + "/reject-admin?adminId=" + ADMIN_A, null},
        new String[] {"POST", ERP + "/purchase-requests/" + ID + "/approve-super-admin?superAdminId=" + ADMIN_A, null},
        new String[] {"POST", ERP + "/purchase-requests/" + ID + "/reject-super-admin?superAdminId=" + ADMIN_A, null},
        new String[] {"POST", ERP + "/purchase-requests/" + ID + "/cancel?requesterId=" + ADMIN_A, null},
        new String[] {"POST", ERP + "/purchase-orders?requestId=" + ID + "&purchaserId=" + ADMIN_A + "&supplier=s", null},
        new String[] {"GET", ENTRIES + "/" + ID, null},
        new String[] {"POST", ENTRIES + "/" + ID + "/approve", "{\"approverId\":" + ADMIN_A + "}"},
        new String[] {"POST", ENTRIES + "/" + ID + "/post", null},
        new String[] {"PUT", ENTRIES + "/" + ID, "{\"lines\":[]}"},
        new String[] {"GET", LEDGERS + "/account/" + ID, null},
        new String[] {"GET", LEDGERS + "/balance/" + ID, null},
        new String[] {"GET", DISCOUNT + "/" + ID, null},
        new String[] {"GET", DISCOUNT + "/" + ID + "/validate", null},
        new String[] {"POST", DISCOUNT + "/" + ID + "/cancel", "{\"reason\":\"r\"}"},
        new String[] {"PUT", DISCOUNT + "/" + ID, "{\"newFinalAmount\":1000}"},
        new String[] {"POST", SALARY + "/approve/" + ID, null},
        new String[] {"POST", SALARY + "/pay/" + ID, null},
        new String[] {"POST", SALARY + "/recalc/" + ID, null},
        new String[] {"POST", SALARY + "/adjustment/" + ID, null});

    private ErpService erpService;
    private RecurringExpenseService recurringExpenseService;
    private SalaryManagementService salaryManagementService;
    private DynamicPermissionService dynamicPermissionService;
    private ItemRepository itemRepository;
    private PurchaseRequestRepository purchaseRequestRepository;
    private PurchaseOrderRepository purchaseOrderRepository;
    private BudgetRepository budgetRepository;
    private RecurringExpenseRepository recurringExpenseRepository;
    private ConsultantSalaryProfileRepository salaryProfileRepository;
    private SalaryCalculationRepository salaryCalculationRepository;
    private UserRepository userRepository;
    private AccountingService accountingService;
    private LedgerService ledgerService;
    private DiscountAccountingService discountAccountingService;
    private PlSqlSalaryManagementService plSqlSalaryManagementService;
    private AccountingEntryRepository accountingEntryRepository;
    private AccountRepository accountRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private ResourceOwnerAccessGuard ownerGuard;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        erpService = mock(ErpService.class);
        recurringExpenseService = mock(RecurringExpenseService.class);
        salaryManagementService = mock(SalaryManagementService.class);
        dynamicPermissionService = mock(DynamicPermissionService.class);
        itemRepository = mock(ItemRepository.class);
        purchaseRequestRepository = mock(PurchaseRequestRepository.class);
        purchaseOrderRepository = mock(PurchaseOrderRepository.class);
        budgetRepository = mock(BudgetRepository.class);
        recurringExpenseRepository = mock(RecurringExpenseRepository.class);
        salaryProfileRepository = mock(ConsultantSalaryProfileRepository.class);
        salaryCalculationRepository = mock(SalaryCalculationRepository.class);
        userRepository = mock(UserRepository.class);
        accountingService = mock(AccountingService.class);
        ledgerService = mock(LedgerService.class);
        discountAccountingService = mock(DiscountAccountingService.class);
        plSqlSalaryManagementService = mock(PlSqlSalaryManagementService.class);
        accountingEntryRepository = mock(AccountingEntryRepository.class);
        accountRepository = mock(AccountRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ownerGuard = build(ResourceOwnerAccessGuard.class, clientGuard, itemRepository, purchaseRequestRepository,
            purchaseOrderRepository, budgetRepository, recurringExpenseRepository, salaryProfileRepository,
            salaryCalculationRepository, userRepository, accountingEntryRepository, accountRepository,
            mappingRepository);
        mockMvc = standalone(recurringExpenseService, salaryManagementService);

        stubTenantAResources();
        stubServices();
        when(dynamicPermissionService.hasPermission(any(User.class), anyString()))
            .thenAnswer(inv -> ((User) inv.getArgument(0)).getRole().isAdmin());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 — 모든 엔드포인트 401, 데이터 없음, 서비스 미호출")
    void anonymous_unauthorized() throws Exception {
        for (String[] e : ENDPOINTS) {
            mockMvc.perform(req(e, null))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data").doesNotExist());
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("역할 없음(같은 테넌트 내담자·ERP/급여 권한 없는 상담사) — 모든 엔드포인트 403, 서비스 미호출")
    void client_forbidden() throws Exception {
        for (User caller : List.of(user(CLIENT_A, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A))) {
            for (String[] e : ENDPOINTS) {
                mockMvc.perform(req(e, caller))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.data").doesNotExist());
            }
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("다른 테넌트 관리자 — 모든 엔드포인트 공통 403, 데이터 없음, 서비스 미호출")
    void otherTenantAdmin_sharedDenial() throws Exception {
        for (String[] e : ENDPOINTS) {
            assertSharedDenial(mockMvc.perform(req(e, user(ADMIN_B, UserRole.ADMIN, TENANT_B))));
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("같은 테넌트 관리자 — 모든 엔드포인트 200")
    void ownTenantAdmin_ok() throws Exception {
        for (String[] e : ENDPOINTS) {
            mockMvc.perform(req(e, user(ADMIN_A, UserRole.ADMIN, TENANT_A)))
                .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("같은 테넌트 관리자라도 테넌트에 없는 id — 공통 403 (404 로 갈리지 않음)")
    void ownTenantAdmin_unknownId_sharedDenial() throws Exception {
        long unknown = 999_999L;
        for (String[] e : ENDPOINTS) {
            String[] unknownEndpoint = {e[0], e[1].replace(String.valueOf(ID), String.valueOf(unknown)), e[2]};
            assertSharedDenial(mockMvc.perform(req(unknownEndpoint, user(ADMIN_A, UserRole.ADMIN, TENANT_A))));
        }
        verifyNoServiceCalls();
    }

    @Test
    @DisplayName("급여 프로필 수정 — 같은 테넌트 프로필이라도 본문 상담사가 다른 테넌트면 공통 403")
    void salaryProfilePut_bodyConsultantOtherTenant_sharedDenial() throws Exception {
        String body = "{\"consultantId\":77777,\"salaryType\":\"FREELANCE\"}";
        assertSharedDenial(mockMvc.perform(req(new String[] {"PUT", SALARY + "/profiles/" + ID, body},
            user(ADMIN_A, UserRole.ADMIN, TENANT_A))));
        verifyNoInteractions(salaryManagementService);
    }

    @Test
    @DisplayName("실제 서비스 구현 — 다른 테넌트 반복 지출 수정: 500 대신 공통 403")
    void realService_recurringPut_otherTenant_sharedDenial() throws Exception {
        assertRealServiceSharedDenial(new String[] {"PUT", ERP + "/recurring-expenses/" + ID, "{}"});
    }

    @Test
    @DisplayName("실제 서비스 구현 — 다른 테넌트 반복 지출 삭제: 500 대신 공통 403")
    void realService_recurringDelete_otherTenant_sharedDenial() throws Exception {
        assertRealServiceSharedDenial(new String[] {"DELETE", ERP + "/recurring-expenses/" + ID, null});
    }

    @Test
    @DisplayName("실제 서비스 구현 — 다른 테넌트 급여 프로필 수정: 500 대신 공통 403")
    void realService_salaryProfilePut_otherTenant_sharedDenial() throws Exception {
        assertRealServiceSharedDenial(new String[] {"PUT", SALARY + "/profiles/" + ID, PROFILE_BODY});
    }

    @Test
    @DisplayName("실제 서비스 구현 — 다른 테넌트 세금 상세: 404 대신 공통 403")
    void realService_taxDetails_otherTenant_sharedDenial() throws Exception {
        assertRealServiceSharedDenial(new String[] {"GET", SALARY + "/tax/" + ID, null});
    }

    private void assertRealServiceSharedDenial(String[] endpoint) throws Exception {
        RecurringExpenseServiceImpl realRecurring = build(RecurringExpenseServiceImpl.class, recurringExpenseRepository);
        SalaryManagementServiceImpl realSalary = build(SalaryManagementServiceImpl.class, salaryProfileRepository,
            salaryCalculationRepository, userRepository);
        assertSharedDenial(standalone(realRecurring, realSalary)
            .perform(req(endpoint, user(ADMIN_B, UserRole.ADMIN, TENANT_B))));
    }

    private MockMvc standalone(Object recurring, Object salary) throws Exception {
        Object[] provided = {ownerGuard, erpService, recurring, salary, userRepository, dynamicPermissionService,
            mock(Environment.class), accountingService, ledgerService, discountAccountingService,
            plSqlSalaryManagementService, salaryCalculationRepository};
        return MockMvcBuilders.standaloneSetup(
                build(ErpController.class, provided),
                build(SalaryManagementController.class, provided),
                build(AccountingController.class, provided),
                build(LedgerController.class, provided),
                build(DiscountAccountingController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    private void stubTenantAResources() {
        when(itemRepository.findByTenantIdAndIdAndActive(TENANT_A, ID)).thenReturn(Optional.of(new Item()));
        when(purchaseRequestRepository.findByTenantIdAndIdWithDetails(TENANT_A, ID))
            .thenReturn(Optional.of(new PurchaseRequest()));
        when(purchaseOrderRepository.findByTenantIdAndIdWithDetails(TENANT_A, ID))
            .thenReturn(Optional.of(new PurchaseOrder()));
        when(budgetRepository.findByTenantIdAndIdWithManager(TENANT_A, ID)).thenReturn(Optional.of(new Budget()));
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_A, ID))
            .thenReturn(Optional.of(new RecurringExpense()));
        ConsultantSalaryProfile profile = new ConsultantSalaryProfile();
        profile.setId(ID);
        profile.setTenantId(TENANT_A);
        profile.setConsultantId(CONSULTANT_A);
        when(salaryProfileRepository.findByTenantIdAndId(TENANT_A, ID)).thenReturn(Optional.of(profile));
        SalaryCalculation calculation = new SalaryCalculation();
        calculation.setConsultant(user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A));
        when(salaryCalculationRepository.findByTenantIdAndId(TENANT_A, ID)).thenReturn(Optional.of(calculation));
        when(userRepository.findByTenantIdAndId(TENANT_A, CONSULTANT_A))
            .thenReturn(Optional.of(user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A)));
        when(accountingEntryRepository.findByTenantIdAndId(TENANT_A, ID))
            .thenReturn(Optional.of(mock(AccountingEntry.class)));
        when(accountRepository.findByTenantIdAndId(TENANT_A, ID)).thenReturn(Optional.of(mock(Account.class)));
        when(mappingRepository.findByTenantIdAndId(TENANT_A, ID))
            .thenReturn(Optional.of(mock(ConsultantClientMapping.class)));
    }

    private void stubServices() {
        when(erpService.getItemById(ID)).thenReturn(Optional.of(new Item()));
        when(erpService.updateItem(eq(ID), any())).thenReturn(new Item());
        when(erpService.deleteItem(ID)).thenReturn(true);
        when(erpService.updateItemStock(eq(ID), any())).thenReturn(true);
        when(erpService.getPurchaseRequestById(ID)).thenReturn(Optional.of(new PurchaseRequest()));
        when(erpService.getPurchaseOrderById(ID)).thenReturn(Optional.of(new PurchaseOrder()));
        when(erpService.updateOrderStatus(eq(ID), any())).thenReturn(true);
        when(erpService.markAsDelivered(ID)).thenReturn(true);
        when(erpService.getBudgetById(ID)).thenReturn(Optional.of(new Budget()));
        when(recurringExpenseService.updateRecurringExpense(eq(ID), any())).thenReturn(new RecurringExpense());
        when(recurringExpenseService.deleteRecurringExpense(ID)).thenReturn(true);
        when(recurringExpenseService.recordRecurringExpenseMonth(eq(ID), any(), any())).thenReturn(true);
        when(salaryManagementService.updateSalaryProfile(any(), any())).thenReturn(new ConsultantSalaryProfile());
        when(salaryManagementService.getTaxDetails(anyLong())).thenReturn(Map.of());
        when(erpService.approveByAdmin(eq(ID), anyLong(), any())).thenReturn(true);
        when(erpService.rejectByAdmin(eq(ID), anyLong(), any())).thenReturn(true);
        when(erpService.approveBySuperAdmin(eq(ID), anyLong(), any())).thenReturn(true);
        when(erpService.rejectBySuperAdmin(eq(ID), anyLong(), any())).thenReturn(true);
        when(erpService.cancelPurchaseRequest(eq(ID), anyLong())).thenReturn(true);
        when(erpService.createPurchaseOrder(eq(ID), anyLong(), any(), any(), any(), any()))
            .thenReturn(new PurchaseOrder());
        DiscountAccountingService.DiscountAccountingResult discount = new DiscountAccountingService.DiscountAccountingResult();
        discount.setSuccess(true);
        discount.setMessage("ok");
        when(discountAccountingService.getDiscountAccounting(ID)).thenReturn(discount);
        when(discountAccountingService.validateDiscountAccounting(ID)).thenReturn(Map.of());
        when(discountAccountingService.cancelDiscountAccounting(eq(ID), any())).thenReturn(Map.of("success", true));
        when(discountAccountingService.updateDiscountAccounting(eq(ID), any(), any()))
            .thenReturn(Map.of("success", true));
        Map<String, Object> procedureOk = Map.of("success", true);
        when(plSqlSalaryManagementService.approveSalaryWithErpSync(eq(ID), eq(TENANT_A), any())).thenReturn(procedureOk);
        when(plSqlSalaryManagementService.processSalaryPaymentWithErpSync(eq(ID), eq(TENANT_A), any()))
            .thenReturn(procedureOk);
        when(plSqlSalaryManagementService.recalcUnpaidSalaryCalculation(eq(ID), eq(TENANT_A), any()))
            .thenReturn(procedureOk);
        when(plSqlSalaryManagementService.insertSalaryAdjustmentForLateSessions(eq(ID), eq(TENANT_A), any()))
            .thenReturn(procedureOk);
    }

    private void verifyNoServiceCalls() {
        verifyNoInteractions(erpService, recurringExpenseService, salaryManagementService, accountingService,
            ledgerService, discountAccountingService, plSqlSalaryManagementService);
    }

    private ResultActions assertSharedDenial(ResultActions result) throws Exception {
        return result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    private static MockHttpServletRequestBuilder req(String[] endpoint, User caller) {
        MockHttpServletRequestBuilder builder = request(HttpMethod.valueOf(endpoint[0]), endpoint[1]);
        if (caller != null) {
            MockHttpSession session = new MockHttpSession();
            session.setAttribute(SessionConstants.USER_OBJECT, caller);
            session.setAttribute(SessionConstants.TENANT_ID, caller.getTenantId());
            builder.session(session).with(r -> {
                TenantContextHolder.setTenantId(caller.getTenantId());
                return r;
            });
        }
        if (endpoint[2] != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(endpoint[2]);
        }
        return builder;
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        Object[] args = Arrays.stream(ctor.getParameterTypes())
            .map(p -> Arrays.stream(provided).filter(p::isInstance).findFirst().orElseGet(() -> mock(p)))
            .toArray();
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args));
    }
}
