package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import com.coresolution.consultation.entity.Account;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.AccountRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository;
import com.coresolution.consultation.repository.erp.accounting.JournalEntryLineRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private ObjectMapper objectMapper;
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
        Account savedVatPayable = Account.builder()
                .id(5L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-VAT-PAYABLE")
                .isPrimary(false)
                .build();
        Account savedWithholding = Account.builder()
                .id(6L)
                .tenantId(TEST_TENANT_ID)
                .accountNumber("ERP-WITHHOLDING-PAYABLE")
                .isPrimary(false)
                .build();
        when(accountRepository.save(any(Account.class)))
                .thenAnswer(inv -> {
                    Account a = inv.getArgument(0);
                    if ("ERP-REVENUE".equals(a.getAccountNumber())) return savedRevenue;
                    if ("ERP-EXPENSE".equals(a.getAccountNumber())) return savedExpense;
                    if ("ERP-CASH".equals(a.getAccountNumber())) return savedCash;
                    if ("ERP-LIABILITY".equals(a.getAccountNumber())) return savedLiability;
                    if ("ERP-VAT-PAYABLE".equals(a.getAccountNumber())) return savedVatPayable;
                    if ("ERP-WITHHOLDING-PAYABLE".equals(a.getAccountNumber())) return savedWithholding;
                    return a;
                });
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndCodeValue(eq(TEST_TENANT_ID), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(commonCodeRepository.save(any(CommonCode.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        accountingService.ensureErpAccountMappingForTenant(TEST_TENANT_ID);

        // Then: 저장된 Account가 isPrimary=false인지 ArgumentCaptor로 검증 (ERP 가상 계정 6종)
        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository, org.mockito.Mockito.atLeast(6)).save(accountCaptor.capture());
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

    @Test
    @DisplayName("INCOME 거래 D2 부가세 분리 시 현금·매출·부가세예수 3줄 분개 생성")
    void createJournalEntryFromTransaction_incomeVatThreeLines() {
        when(accountingEntryRepository.findByTenantIdAndFinancialTransactionId(eq(TEST_TENANT_ID), eq(700L)))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.findMaxSequenceByTenantIdAndYear(anyString(), anyString()))
                .thenReturn(null);

        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenAnswer(inv -> {
                    String codeValue = inv.getArgument(2);
                    long accountId;
                    switch (codeValue) {
                        case "REVENUE":
                            accountId = 1L;
                            break;
                        case "EXPENSE":
                            accountId = 2L;
                            break;
                        case "CASH":
                            accountId = 3L;
                            break;
                        case "LIABILITY":
                            accountId = 4L;
                            break;
                        case "VAT_PAYABLE":
                            accountId = 5L;
                            break;
                        default:
                            return Optional.empty();
                    }
                    CommonCode cc = CommonCode.builder()
                            .codeValue(codeValue)
                            .extraData("{\"accountId\":" + accountId + "}")
                            .build();
                    return Optional.of(cc);
                });

        when(accountRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), anyLong()))
                .thenAnswer(inv -> {
                    Long id = inv.getArgument(1);
                    return Optional.of(Account.builder()
                            .id(id)
                            .tenantId(TEST_TENANT_ID)
                            .accountNumber("ACC-" + id)
                            .description("계정 " + id)
                            .build());
                });

        BigDecimal total = new BigDecimal("110000.00");
        BigDecimal net = new BigDecimal("100000.00");
        BigDecimal vat = new BigDecimal("10000.00");
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(total)
                .taxAmount(vat)
                .amountBeforeTax(net)
                .taxIncluded(false)
                .transactionDate(LocalDate.of(2026, 4, 17))
                .description("상담료(부가세 포함)")
                .build();
        tx.setId(700L);
        tx.setTenantId(TEST_TENANT_ID);

        when(accountingEntryRepository.save(any(AccountingEntry.class))).thenAnswer(inv -> {
            AccountingEntry e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(99L);
            }
            return e;
        });

        AccountingEntry draftBalanced = AccountingEntry.builder()
                .id(99L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.PENDING)
                .entryStatus(AccountingEntry.EntryStatus.DRAFT)
                .totalDebit(total)
                .totalCredit(total)
                .entryDate(tx.getTransactionDate())
                .build();
        AccountingEntry approvedForPost = AccountingEntry.builder()
                .id(99L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.APPROVED)
                .entryStatus(AccountingEntry.EntryStatus.APPROVED)
                .totalDebit(total)
                .totalCredit(total)
                .entryDate(tx.getTransactionDate())
                .build();
        when(accountingEntryRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(99L)))
                .thenReturn(Optional.of(draftBalanced))
                .thenReturn(Optional.of(approvedForPost));

        when(journalEntryLineRepository.findByJournalEntryId(eq(99L)))
                .thenReturn(Collections.emptyList());

        AccountingEntry result = accountingService.createJournalEntryFromTransaction(tx);

        assertNotNull(result);
        ArgumentCaptor<JournalEntryLine> lineCaptor = ArgumentCaptor.forClass(JournalEntryLine.class);
        verify(journalEntryLineRepository, times(3)).save(lineCaptor.capture());
        java.util.List<JournalEntryLine> saved = lineCaptor.getAllValues();
        assertEquals(0, saved.get(0).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(0).getDebitAmount().compareTo(total));
        assertEquals(Long.valueOf(3L), saved.get(0).getAccountId());
        assertEquals(0, saved.get(1).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(1).getCreditAmount().compareTo(net));
        assertEquals(Long.valueOf(1L), saved.get(1).getAccountId());
        assertEquals(0, saved.get(2).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(2).getCreditAmount().compareTo(vat));
        assertEquals(Long.valueOf(5L), saved.get(2).getAccountId());
    }

    @Test
    @DisplayName("INCOME D2+D5: 카드 수수료 시 현금(실입금)·수수료비용·매출·부가세 4줄 분개")
    void createJournalEntryFromTransaction_incomeVatThreeLines_cardMerchantFee() {
        when(accountingEntryRepository.findByTenantIdAndFinancialTransactionId(eq(TEST_TENANT_ID), eq(701L)))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.findMaxSequenceByTenantIdAndYear(anyString(), anyString()))
                .thenReturn(null);

        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenAnswer(inv -> {
                    String codeValue = inv.getArgument(2);
                    long accountId;
                    switch (codeValue) {
                        case "REVENUE":
                            accountId = 1L;
                            break;
                        case "EXPENSE":
                            accountId = 2L;
                            break;
                        case "CASH":
                            accountId = 3L;
                            break;
                        case "LIABILITY":
                            accountId = 4L;
                            break;
                        case "VAT_PAYABLE":
                            accountId = 5L;
                            break;
                        default:
                            return Optional.empty();
                    }
                    CommonCode cc = CommonCode.builder()
                            .codeValue(codeValue)
                            .extraData("{\"accountId\":" + accountId + "}")
                            .build();
                    return Optional.of(cc);
                });

        when(accountRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), anyLong()))
                .thenAnswer(inv -> {
                    Long id = inv.getArgument(1);
                    return Optional.of(Account.builder()
                            .id(id)
                            .tenantId(TEST_TENANT_ID)
                            .accountNumber("ACC-" + id)
                            .description("계정 " + id)
                            .build());
                });

        BigDecimal total = new BigDecimal("110000.00");
        BigDecimal net = new BigDecimal("100000.00");
        BigDecimal vat = new BigDecimal("10000.00");
        BigDecimal fee = new BigDecimal("3300.00");
        BigDecimal cashNet = total.subtract(fee);
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(total)
                .taxAmount(vat)
                .amountBeforeTax(net)
                .taxIncluded(false)
                .cardMerchantFeeAmount(fee)
                .transactionDate(LocalDate.of(2026, 4, 17))
                .description("상담료(카드, 부가세 포함)")
                .build();
        tx.setId(701L);
        tx.setTenantId(TEST_TENANT_ID);

        when(accountingEntryRepository.save(any(AccountingEntry.class))).thenAnswer(inv -> {
            AccountingEntry e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(100L);
            }
            return e;
        });

        AccountingEntry draftBalanced = AccountingEntry.builder()
                .id(100L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.PENDING)
                .entryStatus(AccountingEntry.EntryStatus.DRAFT)
                .totalDebit(total)
                .totalCredit(total)
                .entryDate(tx.getTransactionDate())
                .build();
        AccountingEntry approvedForPost = AccountingEntry.builder()
                .id(100L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.APPROVED)
                .entryStatus(AccountingEntry.EntryStatus.APPROVED)
                .totalDebit(total)
                .totalCredit(total)
                .entryDate(tx.getTransactionDate())
                .build();
        when(accountingEntryRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(100L)))
                .thenReturn(Optional.of(draftBalanced))
                .thenReturn(Optional.of(approvedForPost));

        when(journalEntryLineRepository.findByJournalEntryId(eq(100L)))
                .thenReturn(Collections.emptyList());

        AccountingEntry result = accountingService.createJournalEntryFromTransaction(tx);

        assertNotNull(result);
        ArgumentCaptor<JournalEntryLine> lineCaptor = ArgumentCaptor.forClass(JournalEntryLine.class);
        verify(journalEntryLineRepository, times(4)).save(lineCaptor.capture());
        java.util.List<JournalEntryLine> saved = lineCaptor.getAllValues();
        assertEquals(0, saved.get(0).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(0).getDebitAmount().compareTo(cashNet));
        assertEquals(Long.valueOf(3L), saved.get(0).getAccountId());
        assertEquals(0, saved.get(1).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(1).getDebitAmount().compareTo(fee));
        assertEquals(Long.valueOf(2L), saved.get(1).getAccountId());
        assertEquals(0, saved.get(2).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(2).getCreditAmount().compareTo(net));
        assertEquals(Long.valueOf(1L), saved.get(2).getAccountId());
        assertEquals(0, saved.get(3).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(3).getCreditAmount().compareTo(vat));
        assertEquals(Long.valueOf(5L), saved.get(3).getAccountId());
    }

    @Test
    @DisplayName("INCOME 거래: 부가세 없이 원천징수만 있으면 현금·매출·원천예수 3줄 분개")
    void createJournalEntryFromTransaction_incomeWithholdingOnly_noVat() {
        when(accountingEntryRepository.findByTenantIdAndFinancialTransactionId(eq(TEST_TENANT_ID), eq(702L)))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.findMaxSequenceByTenantIdAndYear(anyString(), anyString()))
                .thenReturn(null);

        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenAnswer(inv -> {
                    String codeValue = inv.getArgument(2);
                    long accountId;
                    switch (codeValue) {
                        case "REVENUE":
                            accountId = 1L;
                            break;
                        case "EXPENSE":
                            accountId = 2L;
                            break;
                        case "CASH":
                            accountId = 3L;
                            break;
                        case "LIABILITY":
                            accountId = 4L;
                            break;
                        case "WITHHOLDING_PAYABLE":
                            accountId = 6L;
                            break;
                        default:
                            return Optional.empty();
                    }
                    CommonCode cc = CommonCode.builder()
                            .codeValue(codeValue)
                            .extraData("{\"accountId\":" + accountId + "}")
                            .build();
                    return Optional.of(cc);
                });

        when(accountRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), anyLong()))
                .thenAnswer(inv -> {
                    Long id = inv.getArgument(1);
                    return Optional.of(Account.builder()
                            .id(id)
                            .tenantId(TEST_TENANT_ID)
                            .accountNumber("ACC-" + id)
                            .description("계정 " + id)
                            .build());
                });

        BigDecimal gross = new BigDecimal("100000.00");
        BigDecimal wh = new BigDecimal("3300.00");
        BigDecimal netRevenue = gross.subtract(wh);
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(gross)
                .taxAmount(BigDecimal.ZERO)
                .withholdingTaxAmount(wh)
                .taxIncluded(false)
                .transactionDate(LocalDate.of(2026, 4, 17))
                .description("프리랜서 상담료(원천)")
                .build();
        tx.setId(702L);
        tx.setTenantId(TEST_TENANT_ID);

        when(accountingEntryRepository.save(any(AccountingEntry.class))).thenAnswer(inv -> {
            AccountingEntry e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(101L);
            }
            return e;
        });

        AccountingEntry draftBalanced = AccountingEntry.builder()
                .id(101L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.PENDING)
                .entryStatus(AccountingEntry.EntryStatus.DRAFT)
                .totalDebit(gross)
                .totalCredit(gross)
                .entryDate(tx.getTransactionDate())
                .build();
        AccountingEntry approvedForPost = AccountingEntry.builder()
                .id(101L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.APPROVED)
                .entryStatus(AccountingEntry.EntryStatus.APPROVED)
                .totalDebit(gross)
                .totalCredit(gross)
                .entryDate(tx.getTransactionDate())
                .build();
        when(accountingEntryRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(101L)))
                .thenReturn(Optional.of(draftBalanced))
                .thenReturn(Optional.of(approvedForPost));

        when(journalEntryLineRepository.findByJournalEntryId(eq(101L)))
                .thenReturn(Collections.emptyList());

        AccountingEntry result = accountingService.createJournalEntryFromTransaction(tx);

        assertNotNull(result);
        ArgumentCaptor<JournalEntryLine> lineCaptor = ArgumentCaptor.forClass(JournalEntryLine.class);
        verify(journalEntryLineRepository, times(3)).save(lineCaptor.capture());
        java.util.List<JournalEntryLine> saved = lineCaptor.getAllValues();
        assertEquals(0, saved.get(0).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(0).getDebitAmount().compareTo(gross));
        assertEquals(Long.valueOf(3L), saved.get(0).getAccountId());
        assertEquals(0, saved.get(1).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(1).getCreditAmount().compareTo(netRevenue));
        assertEquals(Long.valueOf(1L), saved.get(1).getAccountId());
        assertEquals(0, saved.get(2).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(2).getCreditAmount().compareTo(wh));
        assertEquals(Long.valueOf(6L), saved.get(2).getAccountId());
    }

    @Test
    @DisplayName("D7 EXPENSE+CONSULTATION_REFUND: 환불부채 경유 4줄 역분개, 차변·대변 균형·LIABILITY 2라인")
    void createJournalEntryFromTransaction_expenseRefundConsultation_fourLines() {
        BigDecimal refundAmt = new BigDecimal("110000.00");
        when(accountingEntryRepository.findByTenantIdAndFinancialTransactionId(eq(TEST_TENANT_ID), eq(703L)))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.findMaxSequenceByTenantIdAndYear(anyString(), anyString()))
                .thenReturn(null);

        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenAnswer(inv -> {
                    String codeValue = inv.getArgument(2);
                    long accountId;
                    switch (codeValue) {
                        case "REVENUE":
                            accountId = 1L;
                            break;
                        case "EXPENSE":
                            accountId = 2L;
                            break;
                        case "CASH":
                            accountId = 3L;
                            break;
                        case "LIABILITY":
                            accountId = 4L;
                            break;
                        default:
                            return Optional.empty();
                    }
                    CommonCode cc = CommonCode.builder()
                            .codeValue(codeValue)
                            .extraData("{\"accountId\":" + accountId + "}")
                            .build();
                    return Optional.of(cc);
                });

        when(accountRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), anyLong()))
                .thenAnswer(inv -> {
                    Long id = inv.getArgument(1);
                    return Optional.of(Account.builder()
                            .id(id)
                            .tenantId(TEST_TENANT_ID)
                            .accountNumber("ACC-" + id)
                            .description("계정 " + id)
                            .build());
                });

        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .subcategory("CONSULTATION_REFUND")
                .amount(refundAmt)
                .transactionDate(LocalDate.of(2026, 4, 17))
                .description("상담료 전액 환불")
                .build();
        tx.setId(703L);
        tx.setTenantId(TEST_TENANT_ID);

        when(accountingEntryRepository.save(any(AccountingEntry.class))).thenAnswer(inv -> {
            AccountingEntry e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(102L);
            }
            return e;
        });

        BigDecimal balancedTotal = refundAmt.add(refundAmt);
        AccountingEntry draftBalanced = AccountingEntry.builder()
                .id(102L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.PENDING)
                .entryStatus(AccountingEntry.EntryStatus.DRAFT)
                .totalDebit(balancedTotal)
                .totalCredit(balancedTotal)
                .entryDate(tx.getTransactionDate())
                .build();
        AccountingEntry approvedForPost = AccountingEntry.builder()
                .id(102L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.APPROVED)
                .entryStatus(AccountingEntry.EntryStatus.APPROVED)
                .totalDebit(balancedTotal)
                .totalCredit(balancedTotal)
                .entryDate(tx.getTransactionDate())
                .build();
        when(accountingEntryRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(102L)))
                .thenReturn(Optional.of(draftBalanced))
                .thenReturn(Optional.of(approvedForPost));

        when(journalEntryLineRepository.findByJournalEntryId(eq(102L)))
                .thenReturn(Collections.emptyList());

        AccountingEntry result = accountingService.createJournalEntryFromTransaction(tx);

        assertNotNull(result);
        ArgumentCaptor<JournalEntryLine> lineCaptor = ArgumentCaptor.forClass(JournalEntryLine.class);
        verify(journalEntryLineRepository, times(4)).save(lineCaptor.capture());
        java.util.List<JournalEntryLine> saved = lineCaptor.getAllValues();
        assertEquals(0, saved.get(0).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(0).getDebitAmount().compareTo(refundAmt));
        assertEquals(Long.valueOf(2L), saved.get(0).getAccountId());
        assertEquals(0, saved.get(1).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(1).getCreditAmount().compareTo(refundAmt));
        assertEquals(Long.valueOf(4L), saved.get(1).getAccountId());
        assertEquals(0, saved.get(2).getCreditAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(2).getDebitAmount().compareTo(refundAmt));
        assertEquals(Long.valueOf(4L), saved.get(2).getAccountId());
        assertEquals(0, saved.get(3).getDebitAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, saved.get(3).getCreditAmount().compareTo(refundAmt));
        assertEquals(Long.valueOf(3L), saved.get(3).getAccountId());
    }

    @Test
    @DisplayName("D7 EXPENSE+CONSULTATION_PARTIAL_REFUND: 부분환불 4줄 역분개 동일 구조 검증")
    void createJournalEntryFromTransaction_expensePartialRefundConsultation_fourLines() {
        BigDecimal refundAmt = new BigDecimal("27500.50");
        when(accountingEntryRepository.findByTenantIdAndFinancialTransactionId(eq(TEST_TENANT_ID), eq(704L)))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.findMaxSequenceByTenantIdAndYear(anyString(), anyString()))
                .thenReturn(null);

        when(commonCodeService.getTenantCodeByGroupAndValue(eq(TEST_TENANT_ID), eq("ERP_ACCOUNT_TYPE"), anyString()))
                .thenAnswer(inv -> {
                    String codeValue = inv.getArgument(2);
                    long accountId;
                    switch (codeValue) {
                        case "REVENUE":
                            accountId = 1L;
                            break;
                        case "EXPENSE":
                            accountId = 2L;
                            break;
                        case "CASH":
                            accountId = 3L;
                            break;
                        case "LIABILITY":
                            accountId = 4L;
                            break;
                        default:
                            return Optional.empty();
                    }
                    CommonCode cc = CommonCode.builder()
                            .codeValue(codeValue)
                            .extraData("{\"accountId\":" + accountId + "}")
                            .build();
                    return Optional.of(cc);
                });

        when(accountRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), anyLong()))
                .thenAnswer(inv -> {
                    Long id = inv.getArgument(1);
                    return Optional.of(Account.builder()
                            .id(id)
                            .tenantId(TEST_TENANT_ID)
                            .accountNumber("ACC-" + id)
                            .description("계정 " + id)
                            .build());
                });

        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .subcategory("CONSULTATION_PARTIAL_REFUND")
                .amount(refundAmt)
                .transactionDate(LocalDate.of(2026, 4, 17))
                .description("상담료 부분환불")
                .build();
        tx.setId(704L);
        tx.setTenantId(TEST_TENANT_ID);

        when(accountingEntryRepository.save(any(AccountingEntry.class))).thenAnswer(inv -> {
            AccountingEntry e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(103L);
            }
            return e;
        });

        BigDecimal balancedTotal = refundAmt.add(refundAmt);
        AccountingEntry draftBalanced = AccountingEntry.builder()
                .id(103L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.PENDING)
                .entryStatus(AccountingEntry.EntryStatus.DRAFT)
                .totalDebit(balancedTotal)
                .totalCredit(balancedTotal)
                .entryDate(tx.getTransactionDate())
                .build();
        AccountingEntry approvedForPost = AccountingEntry.builder()
                .id(103L)
                .tenantId(TEST_TENANT_ID)
                .approvalStatus(AccountingEntry.ApprovalStatus.APPROVED)
                .entryStatus(AccountingEntry.EntryStatus.APPROVED)
                .totalDebit(balancedTotal)
                .totalCredit(balancedTotal)
                .entryDate(tx.getTransactionDate())
                .build();
        when(accountingEntryRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(103L)))
                .thenReturn(Optional.of(draftBalanced))
                .thenReturn(Optional.of(approvedForPost));

        when(journalEntryLineRepository.findByJournalEntryId(eq(103L)))
                .thenReturn(Collections.emptyList());

        AccountingEntry result = accountingService.createJournalEntryFromTransaction(tx);

        assertNotNull(result);
        ArgumentCaptor<JournalEntryLine> lineCaptor = ArgumentCaptor.forClass(JournalEntryLine.class);
        verify(journalEntryLineRepository, times(4)).save(lineCaptor.capture());
        java.util.List<JournalEntryLine> saved = lineCaptor.getAllValues();
        BigDecimal sumDebit = saved.stream()
                .map(JournalEntryLine::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumCredit = saved.stream()
                .map(JournalEntryLine::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, sumDebit.compareTo(sumCredit));
        assertEquals(0, sumDebit.compareTo(balancedTotal));
        assertEquals(4, saved.size());
        assertEquals(Long.valueOf(4L), saved.get(1).getAccountId());
        assertEquals(Long.valueOf(4L), saved.get(2).getAccountId());
    }
}
