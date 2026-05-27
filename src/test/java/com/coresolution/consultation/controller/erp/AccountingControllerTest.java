package com.coresolution.consultation.controller.erp;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.erp.accounting.AccountingEntryDetailDto;
import com.coresolution.consultation.dto.erp.accounting.AccountingEntryListDto;
import com.coresolution.consultation.dto.erp.accounting.JournalEntryLineDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link AccountingController} 단위 테스트.
 * <p>
 * GET /api/v1/erp/accounting/entries 의 LazyInitializationException 핫픽스 회귀 가드:
 * - 인증 실패 401
 * - 권한 없음 403
 * - DTO 응답 200 (목록·상세)
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AccountingController")
class AccountingControllerTest {

    private static final String TENANT_ID = "tenant-acct-ctrl-test";

    @Mock
    private AccountingService accountingService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AccountingController controller;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET /entries — 비로그인 401 + 로그인 필요 메시지")
    void getJournalEntries_noUser_returns401() {
        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            ResponseEntity<?> response = controller.getJournalEntries(session);

            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("GET /entries — 비관리자·ERP_ACCESS 미보유 시 403")
    void getJournalEntries_noErpPermission_returns403() {
        User nonAdmin = User.builder().build();
        nonAdmin.setEmail("client@test");
        nonAdmin.setRole(UserRole.CLIENT);
        nonAdmin.setTenantId(TENANT_ID);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(nonAdmin);
            when(dynamicPermissionService.hasPermission(nonAdmin, "ERP_ACCESS")).thenReturn(false);

            ResponseEntity<?> response = controller.getJournalEntries(session);

            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("GET /entries — 관리자 200 + DTO 목록 (lines 포함, LazyInit 회귀 가드)")
    void getJournalEntries_admin_returns200WithDtoList() {
        User admin = User.builder().build();
        admin.setEmail("admin@test");
        admin.setRole(UserRole.ADMIN);
        admin.setTenantId(TENANT_ID);

        JournalEntryLineDto line = JournalEntryLineDto.builder()
                .id(1001L)
                .accountId(3L)
                .lineNumber(1)
                .debitAmount(new BigDecimal("100000"))
                .creditAmount(BigDecimal.ZERO)
                .description("현금 입금")
                .build();
        AccountingEntryListDto entry = AccountingEntryListDto.builder()
                .id(2001L)
                .tenantId(TENANT_ID)
                .entryNumber("JE-test-2026-0001")
                .entryDate(LocalDate.of(2026, 5, 27))
                .totalDebit(new BigDecimal("100000"))
                .totalCredit(new BigDecimal("100000"))
                .entryStatus("POSTED")
                .approvalStatus("APPROVED")
                .createdAt(LocalDateTime.of(2026, 5, 27, 10, 0))
                .lineCount(1)
                .lines(Collections.singletonList(line))
                .build();
        when(accountingService.getJournalEntries(TENANT_ID))
                .thenReturn(Collections.singletonList(entry));

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<?> response = controller.getJournalEntries(session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            assertTrue(body.isSuccess());
            @SuppressWarnings("unchecked")
            List<AccountingEntryListDto> data = (List<AccountingEntryListDto>) body.getData();
            assertEquals(1, data.size());
            AccountingEntryListDto dto = data.get(0);
            assertEquals(Long.valueOf(2001L), dto.getId());
            assertEquals("POSTED", dto.getEntryStatus());
            assertEquals(Integer.valueOf(1), dto.getLineCount());
            assertEquals(1, dto.getLines().size());
            assertEquals(Long.valueOf(3L), dto.getLines().get(0).getAccountId());
            verify(accountingService).getJournalEntries(TENANT_ID);
        }
    }

    @Test
    @DisplayName("GET /entries — 빈 목록 200 + 빈 DTO 리스트 (회귀 가드)")
    void getJournalEntries_admin_emptyResultReturns200() {
        User admin = User.builder().build();
        admin.setEmail("admin@test");
        admin.setRole(UserRole.ADMIN);
        admin.setTenantId(TENANT_ID);
        when(accountingService.getJournalEntries(TENANT_ID)).thenReturn(Collections.emptyList());

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<?> response = controller.getJournalEntries(session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            @SuppressWarnings("unchecked")
            List<AccountingEntryListDto> data = (List<AccountingEntryListDto>) body.getData();
            assertNotNull(data);
            assertTrue(data.isEmpty());
        }
    }

    @Test
    @DisplayName("GET /entries/{id} — 관리자 200 + 상세 DTO 반환")
    void getJournalEntry_admin_returns200WithDetail() {
        User admin = User.builder().build();
        admin.setEmail("admin@test");
        admin.setRole(UserRole.ADMIN);
        admin.setTenantId(TENANT_ID);

        JournalEntryLineDto line = JournalEntryLineDto.builder()
                .id(11L)
                .accountId(2L)
                .lineNumber(1)
                .debitAmount(new BigDecimal("55000"))
                .creditAmount(BigDecimal.ZERO)
                .description("비용")
                .build();
        AccountingEntryDetailDto detail = AccountingEntryDetailDto.builder()
                .id(602L)
                .tenantId(TENANT_ID)
                .entryNumber("JE-test-2026-0002")
                .entryDate(LocalDate.of(2026, 5, 27))
                .totalDebit(new BigDecimal("55000"))
                .totalCredit(new BigDecimal("55000"))
                .entryStatus("APPROVED")
                .approvalStatus("APPROVED")
                .approverId(7L)
                .approvalComment("자동승인")
                .lineCount(1)
                .lines(Collections.singletonList(line))
                .build();
        when(accountingService.getJournalEntry(TENANT_ID, 602L)).thenReturn(detail);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<?> response = controller.getJournalEntry(602L, session);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            ApiResponse<?> body = (ApiResponse<?>) response.getBody();
            assertNotNull(body);
            assertTrue(body.isSuccess());
            AccountingEntryDetailDto data = (AccountingEntryDetailDto) body.getData();
            assertEquals(Long.valueOf(602L), data.getId());
            assertEquals("APPROVED", data.getEntryStatus());
            assertEquals(Long.valueOf(7L), data.getApproverId());
            assertEquals(1, data.getLines().size());
            verify(accountingService).getJournalEntry(TENANT_ID, 602L);
        }
    }
}
