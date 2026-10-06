package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;

/**
 * 병합 추가 패키지(B) — A 부분 사용 후 종료·부분 환불 (사용자 결정 2026-10-07, 기본 회기 먼저 소진).
 *
 * <p>A 자체 10회 800,000원 + 병합 B 5회 400,000원 → A 총 15회. B 미사용이면 B INCOME 취소 + 환불액에 B 포함,
 * 전표(EXPENSE)는 A 몫만. 클래스에 {@code @Transactional} 을 두지 않아 서비스 트랜잭션이 실제로 커밋·롤백된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-07
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("병합 추가 패키지 — 부분 사용 종료·부분 환불 B 미사용 판정")
class MappingMergedAddonPartialUseRefundIntegrationTest {

    private static final long PRICE_A = 800_000L;
    private static final long PRICE_B = 400_000L;
    private static final int SESSIONS_A = 10;
    private static final int SESSIONS_B = 5;
    private static final int TOTAL_MERGED = SESSIONS_A + SESSIONS_B;
    private static final int CONCURRENT_REQUESTS = 2;
    private static final long WAIT_SECONDS = 60L;

    @Autowired private AdminService adminService;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @SpyBean private FinancialTransactionService financialTransactionService;

    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "mmpu-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        Mockito.reset(financialTransactionService);
    }

    @Test
    @DisplayName("A 일부 사용 + B 미사용 종료 — B INCOME 취소, 환불액 = A 몫 + B, EXPENSE 는 A 몫만")
    void terminate_partialUseAddonUnused_cancelsAddonAndIncludesPrice() {
        Fixture f = fixture(3);

        adminService.terminateMapping(f.target.getId(), "mmpu-terminate");

        long targetShare = PRICE_A * 7 / SESSIONS_A;
        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reload(f.incomeA).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(expenseAmounts()).containsExactly(targetShare);
        assertThat(reloadMapping(f.target).getNotes()).contains(String.format("%,d원", targetShare + PRICE_B));
        assertThat(totalRefunded(f)).isEqualTo(targetShare + PRICE_B).isLessThanOrEqualTo(PRICE_A + PRICE_B);
    }

    @Test
    @DisplayName("A 일부 + B 일부 사용 종료 — B INCOME 유지, 환불은 현행 계산(B 미포함)")
    void terminate_addonPartiallyUsed_keepsAddonIncome() {
        Fixture f = fixture(11);

        adminService.terminateMapping(f.target.getId(), "mmpu-terminate-used");

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(expenseAmounts()).containsExactly(PRICE_A * 4 / TOTAL_MERGED);
    }

    @Test
    @DisplayName("경계 — 원래 총회기-사용 == B 회기: B 미사용, A 몫 0 → EXPENSE 없음, 환불액 = B")
    void terminate_boundaryExactlyAddonSessions_reversesAddonOnly() {
        Fixture f = fixture(SESSIONS_A);

        adminService.terminateMapping(f.target.getId(), "mmpu-boundary");

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(expenseAmounts()).isEmpty();
        assertThat(reloadMapping(f.target).getNotes()).contains(String.format("%,d원", PRICE_B));
    }

    @Test
    @DisplayName("부분 환불이 B 회기를 덮으면 종료와 같은 결과 — B 취소, EXPENSE A 몫만, 이어진 종료 누적도 동일")
    void partialRefund_coveringAddon_matchesTerminateOutcome() {
        Fixture f = fixture(3);

        adminService.partialRefundMapping(f.target.getId(), 7, "mmpu-partial");

        long firstTargetShare = PRICE_A * 2 / SESSIONS_A;
        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(expenseAmounts()).containsExactly(firstTargetShare);
        ConsultantClientMapping afterPartial = reloadMapping(f.target);
        assertThat(afterPartial.getTotalSessions()).isEqualTo(8);
        assertThat(afterPartial.getRemainingSessions()).isEqualTo(5);

        adminService.terminateMapping(f.target.getId(), "mmpu-partial-then-terminate");

        // 되돌린 B 5회는 A 단가 분모에서 빠진다 → A 몫 합계가 바로 종료한 경우(7회분)와 같다
        assertThat(expenseAmounts()).containsExactlyInAnyOrder(firstTargetShare, PRICE_A * 5 / SESSIONS_A);
        assertThat(totalRefunded(f)).isEqualTo(PRICE_A * 7 / SESSIONS_A + PRICE_B);
    }

    @Test
    @DisplayName("부분 환불 회기 < B 회기 — B 를 쪼개지 않고 B INCOME 유지(현행 계산)")
    void partialRefund_smallerThanAddon_keepsAddonIncome() {
        Fixture f = fixture(3);

        adminService.partialRefundMapping(f.target.getId(), 3, "mmpu-partial-small");

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(expenseAmounts()).hasSize(1);
        assertThat(expenseAmounts().get(0)).isLessThan(PRICE_B);
    }

    @Test
    @DisplayName("B 일부 사용 상태의 부분 환불 — B INCOME 유지")
    void partialRefund_addonPartiallyUsed_keepsAddonIncome() {
        Fixture f = fixture(11);

        adminService.partialRefundMapping(f.target.getId(), 4, "mmpu-partial-used");

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
    }

    @Test
    @DisplayName("재시도 — 종료 재호출은 거부, 부분 환불 반복도 B 는 1회만 되돌리고 누적 ≤ A+B")
    void retries_reverseAddonOnce_andCapCumulative() {
        Fixture f = fixture(3);
        adminService.partialRefundMapping(f.target.getId(), 7, "mmpu-retry-1");
        adminService.partialRefundMapping(f.target.getId(), 5, "mmpu-retry-2");
        assertThatThrownBy(() -> adminService.partialRefundMapping(f.target.getId(), 1, "mmpu-retry-3"))
                .isInstanceOf(RuntimeException.class);

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(totalRefunded(f)).isLessThanOrEqualTo(PRICE_A + PRICE_B);
        assertThat(expenseAmounts().stream().mapToLong(Long::longValue).sum()).isLessThanOrEqualTo(PRICE_A);

        Fixture g = fixture(3);
        adminService.terminateMapping(g.target.getId(), "mmpu-retry-terminate");
        List<Long> afterFirst = expenseAmounts();
        assertThatThrownBy(() -> adminService.terminateMapping(g.target.getId(), "mmpu-retry-terminate-2"))
                .isInstanceOf(RuntimeException.class);
        assertThat(expenseAmounts()).isEqualTo(afterFirst);
        assertThat(reload(g.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
    }

    @Test
    @DisplayName("동시 종료 2건 — 한 건만 성공, B 취소·EXPENSE 1회")
    void concurrentTerminate_appliesOnce() throws Exception {
        Fixture f = fixture(3);
        Long targetId = f.target.getId();
        CyclicBarrier barrier = new CyclicBarrier(CONCURRENT_REQUESTS);
        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_REQUESTS);
        int succeeded = 0;
        try {
            List<Future<Throwable>> futures = new ArrayList<>();
            for (int i = 0; i < CONCURRENT_REQUESTS; i++) {
                futures.add(pool.submit(() -> {
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        barrier.await(WAIT_SECONDS, TimeUnit.SECONDS);
                        adminService.terminateMapping(targetId, "mmpu-concurrent");
                        return null;
                    } catch (Throwable t) {
                        return t;
                    } finally {
                        TenantContextHolder.clear();
                    }
                }));
            }
            for (Future<Throwable> future : futures) {
                if (future.get(WAIT_SECONDS, TimeUnit.SECONDS) == null) {
                    succeeded++;
                }
            }
        } finally {
            pool.shutdownNow();
        }
        TenantContextHolder.setTenantId(tenantId);

        assertThat(succeeded).isEqualTo(1);
        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(expenseAmounts()).containsExactly(PRICE_A * 7 / SESSIONS_A);
    }

    @Test
    @DisplayName("B 취소 뒤 환불 전표 생성이 실패하면 매핑·B INCOME 모두 롤백 (종료·부분 환불)")
    void ledgerFailureAfterAddonCancel_rollsBackEverything() {
        Fixture f = fixture(3);
        doThrow(new IllegalStateException("forced-expense-failure"))
                .when(financialTransactionService).createTransaction(any(FinancialTransactionRequest.class), any());

        assertThatThrownBy(() -> adminService.terminateMapping(f.target.getId(), "mmpu-rollback"))
                .isInstanceOf(RuntimeException.class);
        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        ConsultantClientMapping afterTerminate = reloadMapping(f.target);
        assertThat(afterTerminate.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(afterTerminate.getRemainingSessions()).isEqualTo(12);

        assertThatThrownBy(() -> adminService.partialRefundMapping(f.target.getId(), 7, "mmpu-rollback-partial"))
                .isInstanceOf(RuntimeException.class);
        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reloadMapping(f.target).getTotalSessions()).isEqualTo(TOTAL_MERGED);
        assertThat(expenseAmounts()).isEmpty();
    }

    @Test
    @DisplayName("다른 타깃으로 병합된 행·다른 테넌트의 같은 관련 ID INCOME 은 부분 사용 종료에도 유지")
    void terminate_keepsOtherTargetAndOtherTenantIncome() {
        Fixture f = fixture(3);
        ConsultantClientMapping otherTarget = saveMapping(MappingStatus.ACTIVE, 8, 3, 5, 600_000L, null);
        ConsultantClientMapping mergedIntoOther = saveMapping(MappingStatus.TERMINATED, SESSIONS_B, SESSIONS_B, 0,
                PRICE_B, mergedNote(otherTarget.getId()));
        FinancialTransaction incomeMergedIntoOther = saveIncome(tenantId, mergedIntoOther.getId(), PRICE_B);
        String otherTenantId = "mmpv-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        FinancialTransaction otherTenantIncome = saveIncome(otherTenantId, f.merged.getId(), PRICE_B);

        adminService.terminateMapping(f.target.getId(), "mmpu-scope");

        assertThat(reload(f.incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reload(incomeMergedIntoOther).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reload(otherTenantIncome).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reloadMapping(otherTarget).getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private Fixture fixture(int usedSessions) {
        ConsultantClientMapping target = saveMapping(MappingStatus.ACTIVE, TOTAL_MERGED, usedSessions,
                TOTAL_MERGED - usedSessions, PRICE_A, null);
        ConsultantClientMapping merged = saveMapping(MappingStatus.TERMINATED, SESSIONS_B, SESSIONS_B, 0, PRICE_B,
                mergedNote(target.getId()));
        FinancialTransaction incomeA = saveIncome(tenantId, target.getId(), PRICE_A);
        FinancialTransaction incomeB = saveIncome(tenantId, merged.getId(), PRICE_B);
        return new Fixture(target, merged, incomeA, incomeB);
    }

    private static String mergedNote(Long targetId) {
        return String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, targetId, SESSIONS_B);
    }

    private long totalRefunded(Fixture f) {
        long expense = expenseAmounts().stream().mapToLong(Long::longValue).sum();
        long reversedAddon = reload(f.incomeB).getStatus() == TransactionStatus.CANCELLED ? PRICE_B : 0L;
        return expense + reversedAddon;
    }

    private List<Long> expenseAmounts() {
        return financialTransactionRepository.findAll().stream()
                .filter(tx -> tenantId.equals(tx.getTenantId()))
                .filter(tx -> tx.getTransactionType() == TransactionType.EXPENSE)
                .filter(tx -> !Boolean.TRUE.equals(tx.getIsDeleted()))
                .map(tx -> tx.getAmount().longValue())
                .toList();
    }

    private ConsultantClientMapping reloadMapping(ConsultantClientMapping mapping) {
        return mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
    }

    private FinancialTransaction reload(FinancialTransaction tx) {
        return financialTransactionRepository.findById(tx.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, int total, int used, int remaining, long price,
            String notes) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now());
        mapping.setStatus(status);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setPaymentMethod("CARD");
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackageName("mmpu-it");
        mapping.setPackagePrice(price);
        mapping.setNotes(notes);
        mapping.setIsDeleted(false);
        return mappingRepository.saveAndFlush(mapping);
    }

    private FinancialTransaction saveIncome(String ownerTenantId, Long mappingId, long amount) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(TransactionType.INCOME)
                .category("CONSULTATION")
                .amount(BigDecimal.valueOf(amount))
                .description("mmpu-income")
                .transactionDate(LocalDate.now())
                .taxIncluded(false)
                .taxAmount(BigDecimal.ZERO)
                .withholdingTaxAmount(BigDecimal.ZERO)
                .amountBeforeTax(BigDecimal.valueOf(amount))
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .status(TransactionStatus.COMPLETED)
                .relatedEntityId(mappingId)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        tx.setTenantId(ownerTenantId);
        tx.setIsDeleted(false);
        return financialTransactionRepository.saveAndFlush(tx);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("mmpu-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("mmpu-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }

    private record Fixture(ConsultantClientMapping target, ConsultantClientMapping merged,
            FinancialTransaction incomeA, FinancialTransaction incomeB) {
    }
}
