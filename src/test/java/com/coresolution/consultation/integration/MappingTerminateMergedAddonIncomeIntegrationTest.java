package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
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
 * 병합 추가 패키지 종료 시 타깃·소스 INCOME 을 같은 트랜잭션에서 취소한다.
 *
 * <p>클래스에 {@code @Transactional} 을 두지 않아 서비스 트랜잭션이 실제로 커밋·롤백된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("매핑 종료 — 병합 추가 패키지 INCOME 동시 취소")
class MappingTerminateMergedAddonIncomeIntegrationTest {

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
        tenantId = "mtma-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
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
    @DisplayName("타깃 미사용 종료 — 본 매핑·병합 소스 INCOME 모두 CANCELLED, 재호출은 이미 닫혀 멱등")
    void terminateTarget_cancelsBothIncomes_retryDoesNotReopen() {
        ConsultantClientMapping target = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10, 800_000L);
        ConsultantClientMapping merged = saveMapping(MappingStatus.TERMINATED, PaymentStatus.APPROVED, 5, 5, 0, 400_000L);
        merged.setNotes(String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, target.getId(), 5));
        mappingRepository.saveAndFlush(merged);
        FinancialTransaction incomeA = saveIncome(target.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 800_000L);
        FinancialTransaction incomeB = saveIncome(merged.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 400_000L);

        adminService.terminateMapping(target.getId(), "mtma-void");

        assertThat(reloadIncome(incomeA).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reloadIncome(incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reloadMapping(target).getStatus()).isEqualTo(MappingStatus.CANCELLED);

        assertThatThrownBy(() -> adminService.terminateMapping(target.getId(), "mtma-void-retry"))
                .isInstanceOf(RuntimeException.class);
        assertThat(reloadIncome(incomeA).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reloadIncome(incomeB).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
    }

    @Test
    @DisplayName("두 번째 INCOME 취소가 실패하면 매핑·첫 INCOME 도 롤백")
    void terminateTarget_secondCancelFailure_rollsBackMappingAndIncome() {
        ConsultantClientMapping target = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10, 800_000L);
        ConsultantClientMapping merged = saveMapping(MappingStatus.TERMINATED, PaymentStatus.APPROVED, 5, 5, 0, 400_000L);
        merged.setNotes(String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, target.getId(), 5));
        mappingRepository.saveAndFlush(merged);
        FinancialTransaction incomeA = saveIncome(target.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 800_000L);
        FinancialTransaction incomeB = saveIncome(merged.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 400_000L);

        AtomicInteger calls = new AtomicInteger();
        doAnswer(invocation -> {
            if (calls.incrementAndGet() >= 2) {
                throw new IllegalStateException("forced-second-cancel-failure");
            }
            return invocation.callRealMethod();
        }).when(financialTransactionService).cancelRelatedPostedIncomeTransactions(anyLong(), anyString());

        assertThatThrownBy(() -> adminService.terminateMapping(target.getId(), "mtma-rollback"))
                .isInstanceOf(RuntimeException.class);

        assertThat(reloadMapping(target).getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(reloadIncome(incomeA).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reloadIncome(incomeB).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
    }

    @Test
    @DisplayName("다른 타깃으로 병합된 같은 쌍 행·다른 테넌트의 같은 관련 ID INCOME 은 취소하지 않는다")
    void terminateTarget_keepsIncomeMergedIntoOtherTargetAndOtherTenant() {
        ConsultantClientMapping target = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10, 800_000L);
        ConsultantClientMapping otherTarget = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 8, 3, 5, 600_000L);
        ConsultantClientMapping mergedIntoOther = saveMapping(
                MappingStatus.TERMINATED, PaymentStatus.APPROVED, 5, 5, 0, 400_000L);
        mergedIntoOther.setNotes(String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MERGED_FMT, otherTarget.getId(), 5));
        mappingRepository.saveAndFlush(mergedIntoOther);
        FinancialTransaction incomeTarget = saveIncome(target.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 800_000L);
        FinancialTransaction incomeMergedIntoOther = saveIncome(mergedIntoOther.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 400_000L);
        String otherTenantId = "mtmb-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        FinancialTransaction otherTenantIncome = saveIncome(otherTenantId, target.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 800_000L);

        adminService.terminateMapping(target.getId(), "mtma-void-scope");

        assertThat(reloadIncome(incomeTarget).getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(reloadIncome(incomeMergedIntoOther).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reloadIncome(otherTenantIncome).getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(reloadMapping(otherTarget).getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private ConsultantClientMapping reloadMapping(ConsultantClientMapping mapping) {
        return mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
    }

    private FinancialTransaction reloadIncome(FinancialTransaction tx) {
        return financialTransactionRepository.findById(tx.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus,
            int total, int used, int remaining, long price) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now());
        mapping.setStatus(status);
        mapping.setPaymentStatus(paymentStatus);
        mapping.setPaymentMethod("CARD");
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackageName("mtma-it");
        mapping.setPackagePrice(price);
        mapping.setIsDeleted(false);
        return mappingRepository.saveAndFlush(mapping);
    }

    private FinancialTransaction saveIncome(Long mappingId, String relatedEntityType, long amount) {
        return saveIncome(tenantId, mappingId, relatedEntityType, amount);
    }

    private FinancialTransaction saveIncome(String ownerTenantId, Long mappingId, String relatedEntityType,
            long amount) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(TransactionType.INCOME)
                .category("CONSULTATION")
                .amount(BigDecimal.valueOf(amount))
                .description("mtma-income")
                .transactionDate(LocalDate.now())
                .taxIncluded(false)
                .taxAmount(BigDecimal.ZERO)
                .withholdingTaxAmount(BigDecimal.ZERO)
                .amountBeforeTax(BigDecimal.valueOf(amount))
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .status(TransactionStatus.COMPLETED)
                .relatedEntityId(mappingId)
                .relatedEntityType(relatedEntityType)
                .build();
        tx.setTenantId(ownerTenantId);
        tx.setIsDeleted(false);
        return financialTransactionRepository.saveAndFlush(tx);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("mtma-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("mtma-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
