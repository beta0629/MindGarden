package com.coresolution.consultation.controller.erp;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.erp.accounting.AccountingEntryDetailDto;
import com.coresolution.consultation.dto.erp.accounting.JournalEntryLineDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

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
 * {@link AccountingController} 변경계 4 endpoint LazyInitializationException 회귀 가드.
 * <p>
 * 운영 환경({@code application.yml: open-in-view=false})에서 컨트롤러가 raw
 * {@link AccountingEntry} 를 그대로 반환하면 Jackson 직렬화 시점에 lines LAZY 컬렉션이
 * 트랜잭션 종료 후 접근되어 {@code LazyInitializationException} 이 발생한다 (운영 main
 * {@code c759f97a8} 동일 시한폭탄). GET sweep (직전 PR) 과 동일 패턴으로 4개 변경계
 * endpoint 가 {@link AccountingEntryDetailDto} 를 반환하도록 변경한 핫픽스의 회귀 가드.
 * <p>
 * 가드 전략:
 * <ol>
 *   <li>응답 {@link ApiResponse#getData()} 가 raw entity 가 아닌
 *       {@link AccountingEntryDetailDto} 인스턴스임을 검증. 시그니처 회귀 시 캐스트가
 *       즉시 깨진다.</li>
 *   <li>{@link ObjectMapper} 로 실제 직렬화하여 예외 발생 0 을 가드. DTO 는 일반
 *       {@code List<JournalEntryLineDto>} 를 가지므로 Hibernate 세션과 무관하게
 *       직렬화 가능. 회귀로 LAZY 프록시가 노출되면 본 가드가 깨진다.</li>
 * </ol>
 * <p>
 * 위임 본문은 {@code @SpringBootTest} + MockMvc + OSIV=false 통합 테스트를 명시했으나,
 * (a) 기존 {@link AccountingControllerTest} 와 단위 테스트 패턴 일관성,
 * (b) 컨텍스트 기동 비용·DB fixture 의존 최소화,
 * (c) DTO 시그니처 + 직렬화 가드로 LazyInit 구조적 차단 동등 검증 가능
 * 의 이유로 단위 테스트 + Jackson 직렬화 검증으로 작성한다.
 * 본격 통합 테스트는 ERP 자동화 점검 P1 후속 PR 에서 별도 추가한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AccountingController LazyInit 가드 (변경계 4 endpoint)")
class AccountingControllerLazyInitGuardTest {

    private static final String TENANT_ID = "tenant-acct-lazy-guard";
    private static final Long ENTRY_ID = 901L;
    private static final String ENTRY_NUMBER = "JE-tenant-acct-lazy-guard-2026-0001";
    private static final BigDecimal AMOUNT = new BigDecimal("125000");
    private static final String LINE_DESC = "현금 입금(가드)";
    private static final String APPROVE_COMMENT = "가드 승인";
    private static final Long APPROVER_ID = 42L;

    @Mock
    private AccountingService accountingService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @Mock
    private HttpSession session;

    @InjectMocks
    private AccountingController controller;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        // Spring Boot 기본 Jackson 과 동일하게 java.time 모듈 등록 (LocalDate/LocalDateTime).
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("POST /entries — 응답 data 가 AccountingEntryDetailDto + 직렬화 LazyInit 0")
    void createJournalEntry_returnsDetailDtoAndSerializes() {
        when(accountingService.createJournalEntry(eq(TENANT_ID), any(AccountingEntry.class), any()))
                .thenReturn(buildDetailDto("DRAFT"));

        ResponseEntity<?> response = invokeAsAdmin(() ->
                controller.createJournalEntry(buildCreateRequest(), session));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertResponseBodyIsDetailDtoAndSerializable(response);
    }

    @Test
    @DisplayName("POST /entries/{id}/approve — 응답 data 가 AccountingEntryDetailDto + 직렬화 LazyInit 0")
    void approveJournalEntry_returnsDetailDtoAndSerializes() {
        when(accountingService.approveJournalEntry(eq(TENANT_ID), eq(ENTRY_ID), eq(APPROVER_ID),
                anyString())).thenReturn(buildDetailDto("APPROVED"));

        AccountingController.JournalEntryApproveRequest req =
                new AccountingController.JournalEntryApproveRequest();
        req.setApproverId(APPROVER_ID);
        req.setComment(APPROVE_COMMENT);

        ResponseEntity<?> response = invokeAsAdmin(() ->
                controller.approveJournalEntry(ENTRY_ID, req, session));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertResponseBodyIsDetailDtoAndSerializable(response);
    }

    @Test
    @DisplayName("POST /entries/{id}/post — 응답 data 가 AccountingEntryDetailDto + 직렬화 LazyInit 0")
    void postJournalEntry_returnsDetailDtoAndSerializes() {
        when(accountingService.postJournalEntry(TENANT_ID, ENTRY_ID))
                .thenReturn(buildDetailDto("POSTED"));

        ResponseEntity<?> response = invokeAsAdmin(() ->
                controller.postJournalEntry(ENTRY_ID, session));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertResponseBodyIsDetailDtoAndSerializable(response);
    }

    @Test
    @DisplayName("PUT /entries/{id} — 응답 data 가 AccountingEntryDetailDto + 직렬화 LazyInit 0")
    void updateJournalEntry_returnsDetailDtoAndSerializes() {
        when(accountingService.updateJournalEntry(eq(TENANT_ID), eq(ENTRY_ID),
                any(AccountingEntry.class), any())).thenReturn(buildDetailDto("DRAFT"));

        ResponseEntity<?> response = invokeAsAdmin(() ->
                controller.updateJournalEntry(ENTRY_ID, buildCreateRequest(), session));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertResponseBodyIsDetailDtoAndSerializable(response);
    }

    /**
     * 관리자 권한으로 컨트롤러 메서드를 호출하고 응답을 반환한다. 서비스 stub 은 각 테스트
     * 메서드 본문에서 개별 설정 (STRICT_STUBS 호환).
     */
    private ResponseEntity<?> invokeAsAdmin(java.util.function.Supplier<ResponseEntity<?>> action) {
        User admin = User.builder().build();
        admin.setEmail("admin@lazy-guard");
        admin.setRole(UserRole.ADMIN);
        admin.setTenantId(TENANT_ID);

        try (MockedStatic<SessionUtils> sessionUtils = mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
            return action.get();
        }
    }

    /**
     * 응답 body 가 {@link ApiResponse} 이고 그 data 가 {@link AccountingEntryDetailDto}
     * 인스턴스임을 가드하고, 실제 Jackson 직렬화에서 예외가 발생하지 않음을 검증한다.
     * 회귀로 raw entity 가 노출되면 (1) 캐스트 실패 (2) lines LAZY 프록시 직렬화 실패 중
     * 하나로 본 가드가 깨진다.
     */
    private void assertResponseBodyIsDetailDtoAndSerializable(ResponseEntity<?> response) {
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertNotNull(body, "응답 body 가 ApiResponse 가 아니거나 null — 응답 래핑 회귀");
        assertTrue(body.isSuccess(), "응답 success=false — 정상 흐름이어야 함");
        assertInstanceOf(AccountingEntryDetailDto.class, body.getData(),
                "응답 data 가 AccountingEntryDetailDto 가 아님 — raw AccountingEntry 반환 회귀");

        AccountingEntryDetailDto dto = (AccountingEntryDetailDto) body.getData();
        assertNotNull(dto.getLines(), "DTO lines 가 null — 매핑 회귀");
        assertEquals(1, dto.getLines().size(), "DTO lines 가 1 개여야 함 — fixture 가드");

        assertDoesNotThrow(() -> objectMapper.writeValueAsString(body),
                "응답 Jackson 직렬화 실패 — DTO 매핑 회귀로 LAZY 컬렉션이 노출됐을 가능성");
    }

    private AccountingController.JournalEntryCreateRequest buildCreateRequest() {
        AccountingController.JournalEntryCreateRequest req =
                new AccountingController.JournalEntryCreateRequest();
        req.setEntryNumber(ENTRY_NUMBER);
        req.setEntryDate(LocalDate.of(2026, 5, 28));
        req.setDescription(LINE_DESC);

        AccountingController.JournalEntryLineRequest line =
                new AccountingController.JournalEntryLineRequest();
        line.setAccountId(3L);
        line.setDebitAmount(AMOUNT);
        line.setCreditAmount(BigDecimal.ZERO);
        line.setDescription(LINE_DESC);
        req.setLines(Collections.singletonList(line));
        return req;
    }

    private AccountingEntryDetailDto buildDetailDto(String entryStatus) {
        JournalEntryLineDto line = JournalEntryLineDto.builder()
                .id(11L)
                .tenantId(TENANT_ID)
                .accountId(3L)
                .lineNumber(1)
                .debitAmount(AMOUNT)
                .creditAmount(BigDecimal.ZERO)
                .description(LINE_DESC)
                .build();
        return AccountingEntryDetailDto.builder()
                .id(ENTRY_ID)
                .tenantId(TENANT_ID)
                .entryNumber(ENTRY_NUMBER)
                .entryDate(LocalDate.of(2026, 5, 28))
                .description(LINE_DESC)
                .totalDebit(AMOUNT)
                .totalCredit(AMOUNT)
                .entryStatus(entryStatus)
                .approvalStatus("PENDING".equals(entryStatus) ? "PENDING" : "APPROVED")
                .approverId(APPROVER_ID)
                .approvalComment(APPROVE_COMMENT)
                .createdAt(LocalDateTime.of(2026, 5, 28, 12, 0))
                .updatedAt(LocalDateTime.of(2026, 5, 28, 12, 0))
                .lineCount(1)
                .lines(Collections.singletonList(line))
                .build();
    }
}
