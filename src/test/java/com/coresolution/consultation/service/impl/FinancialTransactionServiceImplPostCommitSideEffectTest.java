package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 입금 커밋 이후 분개 실패는 로그만 남기고 입금 행을 되돌리지 않는다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("회계 거래 생성 후 분개 실패")
class FinancialTransactionServiceImplPostCommitSideEffectTest {

    private static final String TENANT_ID = "tenant-post-commit";
    private static final long TRANSACTION_ID = 77L;
    private static final long RELATED_ENTITY_ID = 901L;
    private static final BigDecimal AMOUNT = new BigDecimal("450000");

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private AccountingService accountingService;
    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private FinancialTransactionServiceImpl financialTransactionService;

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("afterCommit 분개 실패 — 예외 없음, 저장 유지, ERROR 태그에 거래 식별값")
    void createTransaction_journalFailureAfterCommit_keepsDepositAndLogs() {
        AtomicReference<FinancialTransaction> saved = new AtomicReference<>();
        when(financialTransactionRepository.save(any(FinancialTransaction.class))).thenAnswer(invocation -> {
            FinancialTransaction entity = invocation.getArgument(0);
            entity.setId(TRANSACTION_ID);
            saved.set(entity);
            return entity;
        });
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(TRANSACTION_ID)))
                .thenAnswer(invocation -> Optional.ofNullable(saved.get()));
        when(consultantClientMappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(RELATED_ENTITY_ID)))
                .thenReturn(Optional.empty());
        when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        doThrow(new IllegalStateException("journal-down"))
                .when(accountingService).createJournalEntryFromTransaction(any(FinancialTransaction.class));

        Logger logger = (Logger) LoggerFactory.getLogger(FinancialTransactionServiceImpl.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            TransactionSynchronizationManager.initSynchronization();
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("INCOME")
                    .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                    .subcategory("CONSULTATION_FEE")
                    .amount(AMOUNT)
                    .transactionDate(LocalDate.of(2026, 10, 6))
                    .relatedEntityId(RELATED_ENTITY_ID)
                    .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                    .tenantId(TENANT_ID)
                    .cardMerchantFeeAmount(BigDecimal.ONE)
                    .taxIncluded(true)
                    .build();

            FinancialTransactionResponse response = financialTransactionService.createTransaction(request, null);

            assertThat(response.getId()).isEqualTo(TRANSACTION_ID);
            assertThat(response.getAmount()).isEqualByComparingTo(AMOUNT);
            verify(accountingService, never()).createJournalEntryFromTransaction(any());

            List<TransactionSynchronization> synchronizations =
                    new ArrayList<>(TransactionSynchronizationManager.getSynchronizations());
            assertThat(synchronizations).isNotEmpty();
            assertThatCode(() -> synchronizations.forEach(TransactionSynchronization::afterCommit))
                    .doesNotThrowAnyException();

            verify(financialTransactionRepository).save(any(FinancialTransaction.class));
            verify(accountingService).createJournalEntryFromTransaction(any(FinancialTransaction.class));
            assertThat(appender.list)
                    .anyMatch(event -> event.getLevel() == Level.ERROR
                            && event.getFormattedMessage().contains(
                                    FinancialTransactionConstants.ERP_POST_COMMIT_SIDE_EFFECT_FAILED)
                            && event.getFormattedMessage().contains("sideEffect=JOURNAL")
                            && event.getFormattedMessage().contains("tenantId=" + TENANT_ID)
                            && event.getFormattedMessage().contains("transactionId=" + TRANSACTION_ID)
                            && event.getFormattedMessage().contains("relatedEntityId=" + RELATED_ENTITY_ID)
                            && event.getFormattedMessage().contains("transactionType=INCOME")
                            && event.getFormattedMessage().contains("amount=" + AMOUNT.longValue()));
        } finally {
            logger.detachAppender(appender);
        }
    }
}
