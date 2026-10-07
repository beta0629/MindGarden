package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 일정 취소는 유료 매핑 상태를 바꾸지 않고, 차감된 회기만 복원하며 INCOME 은 유지한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("일정 취소 — 유료 매핑 상태 유지·INCOME 유지")
class ScheduleCancelPaidMappingStatusIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private ScheduleService scheduleService;

    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "scpm-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("ACTIVE 잔여 0 일정 취소 — 매핑 유지, 회기 1회 복원, INCOME COMPLETED 유지")
    void cancelPaidActiveMapping_keepsMappingAndIncome_restoresOnce() {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 10, 0);
        FinancialTransaction income = saveIncome(mapping.getId(),
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, 800_000L);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.CONFIRMED, 1);

        scheduleService.cancelSchedule(schedule.getId(), "scpm-cancel");

        ConsultantClientMapping after = mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
        Schedule cancelled = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElseThrow();
        FinancialTransaction incomeAfter = financialTransactionRepository.findById(income.getId()).orElseThrow();

        assertThat(cancelled.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(cancelled.getSessionSequence()).isNull();
        assertThat(after.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(after.getRemainingSessions()).isEqualTo(1);
        assertThat(after.getUsedSessions()).isEqualTo(9);
        assertThat(incomeAfter.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(incomeAfter.getIsDeleted()).isFalse();

        scheduleService.cancelSchedule(schedule.getId(), "scpm-cancel-again");
        ConsultantClientMapping afterSecond =
                mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
        assertThat(afterSecond.getRemainingSessions()).isEqualTo(1);
        assertThat(afterSecond.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("PENDING_PAYMENT 일정 취소 — 매핑 상태 유지")
    void cancelPendingPaymentMapping_keepsMappingStatus() {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 10, 0, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT, null);

        scheduleService.cancelSchedule(schedule.getId(), "scpm-pending");

        ConsultantClientMapping after = mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(after.getTerminatedAt()).isNull();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus,
            int total, int used, int remaining) {
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
        mapping.setPackageName("scpm-it");
        mapping.setPackagePrice(800_000L);
        mapping.setIsDeleted(false);
        return mappingRepository.saveAndFlush(mapping);
    }

    private Schedule saveSchedule(ConsultantClientMapping mapping, ScheduleStatus status, Integer sequence) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(3));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scpm-it-schedule");
        schedule.setSessionSequence(sequence);
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private FinancialTransaction saveIncome(Long mappingId, String relatedEntityType, long amount) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(TransactionType.INCOME)
                .category("CONSULTATION")
                .amount(BigDecimal.valueOf(amount))
                .description("scpm-income")
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
        tx.setTenantId(tenantId);
        tx.setIsDeleted(false);
        return financialTransactionRepository.saveAndFlush(tx);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("scpm-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scpm-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
