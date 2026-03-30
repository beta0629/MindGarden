package com.coresolution.consultation.service.impl;

import java.util.Optional;
import com.coresolution.consultation.entity.Account;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.AccountRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository;
import com.coresolution.consultation.repository.erp.accounting.JournalEntryLineRepository;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AccountingServiceImpl 단위 테스트
 * - ERP 가상 계정 isPrimary(false) 검증
 * - ensureErpAccountMappingForTenant REQUIRES_NEW 동작 검증
 *
 * @author MindGarden
 * @since 2026-03-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AccountingServiceImpl 테스트")
class AccountingServiceImplTest {

    private static final String TEST_TENANT_ID = "tenant-test-" + java.util.UUID.randomUUID();

    @Mock
    private AccountingEntryRepository accountingEntryRepository;
    @Mock
    private JournalEntryLineRepository journalEntryLineRepository;
    @Mock
    private LedgerService ledgerService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private TransactionStatus transactionStatus;

    @InjectMocks
    private AccountingServiceImpl accountingService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("ERP 가상 계정 생성 시 Account의 isPrimary가 false로 저장되는지 검증")
    void ensureErpAccountMappingForTenant_savesAccountWithIsPrimaryFalse() {
        // Given: 기본 계정이 없어 시딩이 실행되도록 설정
        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenReturn(Optional.empty());
        when(accountRepository.findByTenantIdAndAccountNumberAndIsDeletedFalse(eq(TEST_TENANT_ID), anyString()))
                .thenReturn(Optional.empty());
        when(transactionManager.getTransaction(any(org.springframework.transaction.support.DefaultTransactionDefinition.class)))
                .thenReturn(transactionStatus);

        Account savedRevenue = Account.builder()
                .id(1L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-REVENUE")
                .isPrimary(false)
                .build();
        Account savedExpense = Account.builder()
                .id(2L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-EXPENSE")
                .isPrimary(false)
                .build();
        Account savedCash = Account.builder()
                .id(3L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-CASH")
                .isPrimary(false)
                .build();
        Account savedLiability = Account.builder()
                .id(4L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-LIABILITY")
                .isPrimary(false)
                .build();
        when(accountRepository.save(any(Account.class)))
                .thenAnswer(inv -> {
                    Account a = inv.getArgument(0);
                    if ("ERP-REVENUE".equals(a.getAccountNumber())) return savedRevenue;
                    if ("ERP-EXPENSE".equals(a.getAccountNumber())) return savedExpense;
                    if ("ERP-CASH".equals(a.getAccountNumber())) return savedCash;
                    if ("ERP-LIABILITY".equals(a.getAccountNumber())) return savedLiability;
                    return a;
                });
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(eq(TEST_TENANT_ID), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        accountingService.ensureErpAccountMappingForTenant(TEST_TENANT_ID);

        // Then: 저장된 Account가 isPrimary=false인지 ArgumentCaptor로 검증 (REVENUE, EXPENSE, CASH, LIABILITY 4개)
        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository, org.mockito.Mockito.atLeast(4)).save(accountCaptor.capture());
        for (Account captured : accountCaptor.getAllValues()) {
            assertNotNull(captured.getAccountNumber());
            assertFalse(captured.getIsPrimary(), "ERP 가상 계정은 isPrimary=false 여야 함: " + captured.getAccountNumber());
        }
        verify(transactionManager).commit(transactionStatus);
    }

    @Test
    @DisplayName("ensureErpAccountMappingForTenant 시딩 실패 시 rollback 호출되어 부모 트랜잭션 오염 방지")
    void ensureErpAccountMappingForTenant_rollbackOnSeedingFailure() {
        // Given: 기본 계정 없음 → 시딩 진행, save 시 예외 발생
        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenReturn(Optional.empty());
        when(accountRepository.findByTenantIdAndAccountNumberAndIsDeletedFalse(eq(TEST_TENANT_ID), eq("ERP-REVENUE")))
                .thenReturn(Optional.empty());
        when(transactionManager.getTransaction(any(org.springframework.transaction.support.DefaultTransactionDefinition.class)))
                .thenReturn(transactionStatus);
        doThrow(new RuntimeException("시딩 실패 시뮬레이션")).when(accountRepository).save(any(Account.class));

        // When & Then: 예외 전파, rollback 호출, commit 미호출
        assertThrows(RuntimeException.class,
                () -> accountingService.ensureErpAccountMappingForTenant(TEST_TENANT_ID));
        verify(transactionManager).rollback(transactionStatus);
        verify(transactionManager, never()).commit(any(TransactionStatus.class));
    }
}
