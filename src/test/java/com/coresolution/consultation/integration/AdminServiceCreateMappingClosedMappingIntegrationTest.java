package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

/**
 * [상태 조건 없는 일괄 상태 변경] createMapping 이 같은 상담사·내담자 쌍의 기존 매핑을 자동 종료할 때
 * 실제 DB 쿼리(상태 조건)로 진행 중 상태만 고르는지, 종료 매핑 행은 그대로인지 H2 에서 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("[상태 조건 없는 일괄 상태 변경] createMapping — 종료 매핑 보존·진행 중만 자동 종료 (DB)")
class AdminServiceCreateMappingClosedMappingIntegrationTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultantClientMappingRepository mappingRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private BatchNotificationDispatchService batchNotificationDispatchService;

    private String tenantId;
    private User consultant;
    private User client;
    private final List<Long> mappingIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = "cmc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = userRepository.saveAndFlush(newUser(UserRole.CONSULTANT, "상담사"));
        client = userRepository.saveAndFlush(newUser(UserRole.CLIENT, "내담자"));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        mappingRepository.findByTenantIdAndConsultantAndClient(tenantId, consultant, client)
                .forEach(m -> mappingIds.add(m.getId()));
        mappingIds.stream().distinct().forEach(mappingRepository::deleteById);
        userRepository.deleteById(client.getId());
        userRepository.deleteById(consultant.getId());
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("종료 3종 행은 상태·terminatedAt·notes·회기 불변, DEPOSIT_PENDING 행만 자동 종료")
    void createMapping_preservesClosedRows_terminatesInProgressOnly() {
        LocalDateTime closedAt = LocalDateTime.of(2026, 9, 1, 10, 0);
        List<ConsultantClientMapping> closed = new ArrayList<>();
        for (MappingStatus status : List.of(MappingStatus.TERMINATED, MappingStatus.CANCELLED,
                MappingStatus.SESSIONS_EXHAUSTED)) {
            closed.add(saveMapping(status, closedAt, "원래 메모 " + status));
        }
        ConsultantClientMapping inProgress = saveMapping(MappingStatus.DEPOSIT_PENDING, null, "진행 중");

        List<ConsultantClientMapping> lookedUp = mappingRepository.findByTenantIdAndConsultantAndClientAndStatusIn(
                tenantId, consultant, client, MappingStatus.AUTO_TERMINATE_ON_NEW_MAPPING);
        assertThat(lookedUp).extracting(ConsultantClientMapping::getId).containsExactly(inProgress.getId());

        ConsultantClientMapping created = adminService.createMapping(newRequest());
        mappingIds.add(created.getId());

        for (ConsultantClientMapping before : closed) {
            ConsultantClientMapping after = mappingRepository.findById(before.getId()).orElseThrow();
            assertThat(after.getStatus()).isEqualTo(before.getStatus());
            assertThat(after.getTerminatedAt()).isEqualTo(closedAt);
            assertThat(after.getNotes()).isEqualTo(before.getNotes());
            assertThat(after.getRemainingSessions()).isEqualTo(2);
            assertThat(after.getUsedSessions()).isEqualTo(3);
        }
        ConsultantClientMapping terminated = mappingRepository.findById(inProgress.getId()).orElseThrow();
        assertThat(terminated.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(terminated.getTerminatedAt()).isNotNull();
        assertThat(terminated.getNotes()).contains(AdminServiceUserFacingMessages.NOTES_AUTO_TERMINATED_ON_NEW_MAPPING);
        assertThat(terminated.getRemainingSessions()).isZero();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, LocalDateTime terminatedAt, String notes) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now().minus(30, ChronoUnit.DAYS));
        m.setStatus(status);
        m.setTerminatedAt(terminatedAt);
        m.setNotes(notes);
        m.setTotalSessions(5);
        m.setRemainingSessions(2);
        m.setUsedSessions(3);
        m.setPackageName("closed-test");
        m.setPackagePrice(100_000L);
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(m);
        mappingIds.add(saved.getId());
        return saved;
    }

    private ConsultantClientMappingCreateRequest newRequest() {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(consultant.getId());
        dto.setClientId(client.getId());
        dto.setTotalSessions(10);
        dto.setPackageName("new-package");
        dto.setPackagePrice(100_000L);
        dto.setStatus(MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name());
        return dto;
    }

    private User newUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("cmc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("cmc-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return user;
    }
}
