package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
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
 * COMPLETED 회기 추가 요청의 누락 원장(FinancialTransaction) 백필 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionServiceImpl 회기 추가 수입 원장 백필")
class SessionExtensionServiceImplBackfillIncomeTest {

    private static final String TENANT_ID = "tenant-ext-backfill";
    private static final Long MISSING_REQUEST_ID = 1101L;
    private static final Long EXISTING_REQUEST_ID = 1102L;
    private static final Long TX_ID = 2201L;
    private static final BigDecimal PACKAGE_PRICE = new BigDecimal("800000");
    private static final String PAYMENT_METHOD_BANK = "BANK_TRANSFER";
    private static final String PAYMENT_METHOD_CASH = "CASH";

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
    @DisplayName("원장 없는 COMPLETED 요청은 createTransaction을 호출하고 created=1")
    void backfill_createsMissingIncomeLedger() {
        SessionExtensionRequest missing = buildCompletedRequest(
                MISSING_REQUEST_ID, PACKAGE_PRICE, PAYMENT_METHOD_BANK);

        when(requestRepository.findByTenantIdAndStatusAndPackagePriceGreaterThan(
                eq(TENANT_ID),
                eq(SessionExtensionRequest.ExtensionStatus.COMPLETED),
                eq(BigDecimal.ZERO)))
                .thenReturn(List.of(missing));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(MISSING_REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(false);
        when(salaryTaxRateLookupService.getVatRate(TENANT_ID)).thenReturn(new BigDecimal("0.10"));

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

        Map<String, Long> result =
                sessionExtensionService.backfillMissingSessionExtensionIncomeTransactions(TENANT_ID);

        assertThat(result.get("scanned")).isEqualTo(1L);
        assertThat(result.get("created")).isEqualTo(1L);
        assertThat(result.get("skippedExisting")).isEqualTo(0L);
        assertThat(result.get("skippedNoAmount")).isEqualTo(0L);

        ArgumentCaptor<FinancialTransactionRequest> ftCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(ftCaptor.capture(), isNull());
        FinancialTransactionRequest ftReq = ftCaptor.getValue();
        assertThat(ftReq.getRelatedEntityId()).isEqualTo(MISSING_REQUEST_ID);
        assertThat(ftReq.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST);
        assertThat(ftReq.getPaymentMethod()).isEqualTo(PAYMENT_METHOD_BANK);
        assertThat(ftReq.getAmount()).isEqualByComparingTo(PACKAGE_PRICE);
    }

    @Test
    @DisplayName("이미 원장이 있으면 createTransaction을 호출하지 않고 skippedExisting=1")
    void backfill_skipsWhenLedgerAlreadyExists() {
        SessionExtensionRequest existing = buildCompletedRequest(
                EXISTING_REQUEST_ID, PACKAGE_PRICE, PAYMENT_METHOD_CASH);

        when(requestRepository.findByTenantIdAndStatusAndPackagePriceGreaterThan(
                eq(TENANT_ID),
                eq(SessionExtensionRequest.ExtensionStatus.COMPLETED),
                eq(BigDecimal.ZERO)))
                .thenReturn(List.of(existing));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(EXISTING_REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(true);

        Map<String, Long> result =
                sessionExtensionService.backfillMissingSessionExtensionIncomeTransactions(TENANT_ID);

        assertThat(result.get("scanned")).isEqualTo(1L);
        assertThat(result.get("created")).isEqualTo(0L);
        assertThat(result.get("skippedExisting")).isEqualTo(1L);
        assertThat(result.get("skippedNoAmount")).isEqualTo(0L);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("누락·기존 원장 혼합 시 created/skippedExisting을 각각 집계한다")
    void backfill_countsCreatedAndSkippedExistingTogether() {
        SessionExtensionRequest missing = buildCompletedRequest(
                MISSING_REQUEST_ID, PACKAGE_PRICE, PAYMENT_METHOD_BANK);
        SessionExtensionRequest existing = buildCompletedRequest(
                EXISTING_REQUEST_ID, PACKAGE_PRICE, PAYMENT_METHOD_CASH);

        when(requestRepository.findByTenantIdAndStatusAndPackagePriceGreaterThan(
                eq(TENANT_ID),
                eq(SessionExtensionRequest.ExtensionStatus.COMPLETED),
                eq(BigDecimal.ZERO)))
                .thenReturn(List.of(missing, existing));
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(MISSING_REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(false);
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(EXISTING_REQUEST_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST),
                        eq(FinancialTransaction.TransactionType.INCOME)))
                .thenReturn(true);
        when(salaryTaxRateLookupService.getVatRate(TENANT_ID)).thenReturn(new BigDecimal("0.10"));

        FinancialTransactionResponse created = FinancialTransactionResponse.builder()
                .id(TX_ID)
                .build();
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(created);
        FinancialTransaction persisted = new FinancialTransaction();
        persisted.setId(TX_ID);
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_ID, TX_ID))
                .thenReturn(Optional.of(persisted));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Map<String, Long> result =
                sessionExtensionService.backfillMissingSessionExtensionIncomeTransactions(TENANT_ID);

        assertThat(result.get("scanned")).isEqualTo(2L);
        assertThat(result.get("created")).isEqualTo(1L);
        assertThat(result.get("skippedExisting")).isEqualTo(1L);
        verify(financialTransactionService, times(1)).createTransaction(any(), isNull());
    }

    @Test
    @DisplayName("tenantId가 비어 있으면 fail-closed로 예외를 던진다")
    void backfill_rejectsBlankTenantId() {
        assertThatThrownBy(() ->
                sessionExtensionService.backfillMissingSessionExtensionIncomeTransactions("  "))
                .isInstanceOf(IllegalStateException.class);
        verify(requestRepository, never())
                .findByTenantIdAndStatusAndPackagePriceGreaterThan(any(), any(), any());
    }

    private SessionExtensionRequest buildCompletedRequest(
            Long requestId, BigDecimal packagePrice, String paymentMethod) {
        User consultant = new User();
        consultant.setId(10L);
        User client = new User();
        client.setId(20L);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(601L);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("추가 회기 10회");
        mapping.setTenantId(TENANT_ID);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        User requester = new User();
        requester.setId(30L);

        return SessionExtensionRequest.builder()
                .id(requestId)
                .tenantId(TENANT_ID)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(10)
                .packageName("추가 회기 10회")
                .packagePrice(packagePrice)
                .paymentMethod(paymentMethod)
                .status(SessionExtensionRequest.ExtensionStatus.COMPLETED)
                .reason("백필 단위 테스트")
                .build();
    }
}
