package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회기 동기화의 SESSIONS_EXHAUSTED 전이 — H2 실제 서비스.
 *
 * <p>활성 매핑만 잔여 0 이면 소진으로 바뀌고, 취소·종료·결제 대기·결제 확인 매핑은 잔여 0 이어도 상태를 유지한다
 * (.dev 매핑 315/323/324/331/332 사례).</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("회기 동기화 — 활성 매핑만 회기 소진 전이")
class SessionSyncExhaustedStatusIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private SessionSyncService sessionSyncService;

    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "sses-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("회기 사용 후 동기화 — 활성 매핑 잔여 0 은 소진, 같은 쌍 취소·결제 대기·결제 확인 매핑은 그대로")
    void syncAfterSessionUsage_marksOnlyActiveMappingExhausted() {
        ConsultantClientMapping active = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 2, 2, 0);
        ConsultantClientMapping cancelled = saveMapping(MappingStatus.CANCELLED, PaymentStatus.APPROVED, 2, 2, 0);
        ConsultantClientMapping pendingPayment = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 0, 0, 0);
        ConsultantClientMapping paymentConfirmed = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.PAY, 0, 0, 0);

        sessionSyncService.syncAfterSessionUsage(active.getId(), consultant.getId(), client.getId());

        assertThat(statusOf(active)).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(statusOf(cancelled)).isEqualTo(MappingStatus.CANCELLED);
        assertThat(statusOf(pendingPayment)).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(statusOf(paymentConfirmed)).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
    }

    @Test
    @DisplayName("회기 사용 후 동기화 — 활성 매핑 잔여가 남아 있으면 활성 유지")
    void syncAfterSessionUsage_activeWithRemaining_staysActive() {
        ConsultantClientMapping active = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 3, 1, 2);

        sessionSyncService.syncAfterSessionUsage(active.getId(), consultant.getId(), client.getId());

        assertThat(statusOf(active)).isEqualTo(MappingStatus.ACTIVE);
    }

    @ParameterizedTest(name = "{0} 매핑 잔여 0 검증 → 상태 유지")
    @EnumSource(value = MappingStatus.class,
            names = {"CANCELLED", "TERMINATED", "PENDING_PAYMENT", "PAYMENT_CONFIRMED", "SUSPENDED"})
    @DisplayName("단건 검증·동기화 — 활성이 아닌 매핑은 잔여 0 이어도 소진으로 바꾸지 않는다")
    void validateAndSync_nonActiveMapping_keepsStatus(MappingStatus status) {
        ConsultantClientMapping mapping = saveMapping(status, PaymentStatus.APPROVED, 2, 2, 0);

        sessionSyncService.validateAndSyncMappingSessions(mapping.getId());

        assertThat(statusOf(mapping)).isEqualTo(status);
    }

    @Test
    @DisplayName("전체 검증 — 활성 매핑만 소진 전이, 종료·취소 매핑 그대로")
    void validateAllSessions_marksOnlyActiveMappingExhausted() {
        ConsultantClientMapping active = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 1, 1, 0);
        ConsultantClientMapping terminated = saveMapping(MappingStatus.TERMINATED, PaymentStatus.APPROVED, 1, 1, 0);
        ConsultantClientMapping cancelled = saveMapping(MappingStatus.CANCELLED, PaymentStatus.APPROVED, 1, 1, 0);

        sessionSyncService.validateAllSessions();

        assertThat(statusOf(active)).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(statusOf(terminated)).isEqualTo(MappingStatus.TERMINATED);
        assertThat(statusOf(cancelled)).isEqualTo(MappingStatus.CANCELLED);
    }

    private MappingStatus statusOf(ConsultantClientMapping mapping) {
        return mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow().getStatus();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus,
            int total, int used, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(total);
        m.setUsedSessions(used);
        m.setRemainingSessions(remaining);
        m.setPackageName("sses-it");
        m.setIsDeleted(false);
        return mappingRepository.saveAndFlush(m);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("sses-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("sses-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
