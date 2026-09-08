package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 회기 추가 입금 확인 → 원장(FinancialTransaction) 기록 회귀.
 *
 * <p>결제 성공 시 모의 ERP만 호출하던 경로가 원장·이력 목록에 행을 만들지 않던 버그 방지.</p>
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionServiceImpl confirmPayment 원장 기록")
class SessionExtensionServiceImplConfirmPaymentLedgerTest {

    private static final String TENANT_ID = "tenant-ext-ledger";
    private static final Long REQUEST_ID = 501L;
    private static final Long MAPPING_ID = 601L;
    private static final Long ADMIN_ID = 701L;
    private static final Long TX_ID = 801L;
    private static final int ADDITIONAL_SESSIONS = 10;
    private static final BigDecimal PACKAGE_PRICE = new BigDecimal("800000");

    @Mock
    private SessionExtensionRequestRepository requestRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private UserService userService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private EmailService emailService;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private FinancialTransactionService financialTransactionService;
    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private SalaryTaxRateLookupService salaryTaxRateLookupService;

    @InjectMocks
    private SessionExtensionServiceImpl sessionExtensionService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("confirmPayment 성공 시 FinancialTransaction INCOME이 SESSION_EXTENSION_REQUEST로 생성·완료된다")
    void confirmPayment_writesCompletedIncomeLedgerRow() {
        SessionExtensionRequest request = buildPendingRequest();
        User admin = new User();
        admin.setId(ADMIN_ID);

        when(requestRepository.findByTenantIdAndIdForUpdate(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(userService.findActiveById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(salaryTaxRateLookupService.getVatRate(TENANT_ID)).thenReturn(new BigDecimal("0.10"));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(false);

        FinancialTransactionResponse created = FinancialTransactionResponse.builder()
                .id(TX_ID)
                .build();
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(created);

        FinancialTransaction persisted = new FinancialTransaction();
        persisted.setId(TX_ID);
        persisted.setTenantId(TENANT_ID);
        persisted.setStatus(FinancialTransaction.TransactionStatus.PENDING);
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_ID, TX_ID))
                .thenReturn(Optional.of(persisted));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(emailService.sendTemplateEmail(any(), any(), any(), any()))
                .thenReturn(EmailResponse.builder().success(true).build());

        SessionExtensionRequest saved = sessionExtensionService.confirmPayment(
                REQUEST_ID,
                ADMIN_ID,
                "BANK_TRANSFER",
                "REF-800000");

        assertThat(saved.getStatus()).isEqualTo(SessionExtensionRequest.ExtensionStatus.COMPLETED);
        verify(sessionSyncService).syncAfterSessionExtension(any(SessionExtensionRequest.class));

        ArgumentCaptor<FinancialTransactionRequest> ftCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(ftCaptor.capture(), isNull());

        FinancialTransactionRequest ftReq = ftCaptor.getValue();
        assertThat(ftReq.getTransactionType()).isEqualTo("INCOME");
        assertThat(ftReq.getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(ftReq.getSubcategory())
                .isEqualTo(FinancialTransactionConstants.SUBCATEGORY_ADDITIONAL_CONSULTATION);
        assertThat(ftReq.getRelatedEntityId()).isEqualTo(REQUEST_ID);
        assertThat(ftReq.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST);
        assertThat(ftReq.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(ftReq.getAmount()).isEqualByComparingTo("800000");
        assertThat(ftReq.getTaxIncluded()).isTrue();

        ArgumentCaptor<FinancialTransaction> savedTx =
                ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).save(savedTx.capture());
        assertThat(savedTx.getValue().getStatus())
                .isEqualTo(FinancialTransaction.TransactionStatus.COMPLETED);
        assertThat(savedTx.getValue().getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("동일 requestId 원장이 이미 있으면 createTransaction을 호출하지 않는다")
    void confirmPayment_skipsDuplicateLedgerRow() {
        SessionExtensionRequest request = buildPendingRequest();
        User admin = new User();
        admin.setId(ADMIN_ID);

        when(requestRepository.findByTenantIdAndIdForUpdate(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(userService.findActiveById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(true);
        when(emailService.sendTemplateEmail(any(), any(), any(), any()))
                .thenReturn(EmailResponse.builder().success(true).build());

        sessionExtensionService.confirmPayment(
                REQUEST_ID, ADMIN_ID, "CASH", null);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(sessionSyncService).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    @Test
    @DisplayName("createTransaction이 null id를 반환하면 fail-closed로 예외를 던진다")
    void confirmPayment_failsClosedWhenLedgerCreateReturnsNullId() {
        SessionExtensionRequest request = buildPendingRequest();
        User admin = new User();
        admin.setId(ADMIN_ID);

        when(requestRepository.findByTenantIdAndIdForUpdate(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(userService.findActiveById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(salaryTaxRateLookupService.getVatRate(TENANT_ID)).thenReturn(new BigDecimal("0.10"));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(false);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(FinancialTransactionResponse.builder().id(null).build());

        assertThatThrownBy(() ->
                        sessionExtensionService.confirmPayment(
                                REQUEST_ID, ADMIN_ID, "BANK_TRANSFER", "REF-NULL"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("거래 ID 없음");
    }

    private SessionExtensionRequest buildPendingRequest() {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setName("상담사");
        User client = new User();
        client.setId(20L);
        client.setName("내담자");

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("추가 회기 10회");
        mapping.setPackagePrice(800_000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(10);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setTenantId(TENANT_ID);
        mapping.setBranchCode("MAIN001");

        User requester = new User();
        requester.setId(30L);
        requester.setName("요청자");
        requester.setEmail("requester@example.com");

        return SessionExtensionRequest.builder()
                .id(REQUEST_ID)
                .tenantId(TENANT_ID)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(ADDITIONAL_SESSIONS)
                .packageName("추가 회기 10회")
                .packagePrice(PACKAGE_PRICE)
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason("회귀: 10회 / 800000")
                .build();
    }
}
