package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;

import java.time.LocalDateTime;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientEventRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

/**
 * client_event 기록 실패 시 본 비즈니스 트랜잭션 롤백 실증.
 *
 * <p>클래스에 {@code @Transactional} 을 두지 않아 서비스 트랜잭션이 실제로 커밋·롤백된다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("client_event 기록 실패 → 본 트랜잭션 롤백")
class ClientEventWriteRollbackIntegrationTest {

    private static final int TOTAL_SESSIONS = 10;
    private static final long PACKAGE_PRICE = 100_000L;

    @Autowired private AdminService adminService;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ClientEventRepository clientEventRepository;

    @SpyBean private ClientEventService clientEventService;

    private String tenantId;
    private User consultant;
    private User client;
    private Long mappingId;

    @BeforeEach
    void setUp() {
        tenantId = "cer-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
        mappingId = saveActiveMapping().getId();
    }

    @AfterEach
    void tearDown() {
        reset(clientEventService);
        TenantContextHolder.setTenantId(tenantId);
        clientEventRepository
                .findByTenantIdAndClientId(tenantId, client.getId(), Pageable.unpaged())
                .forEach(clientEventRepository::delete);
        if (mappingId != null) {
            mappingRepository.deleteById(mappingId);
        }
        if (consultant != null) {
            userRepository.deleteById(consultant.getId());
        }
        if (client != null) {
            userRepository.deleteById(client.getId());
        }
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("useSession 중 client_event.record 실패 → remaining/used 롤백·이벤트 0건")
    void useSession_clientEventFailure_rollsBackMappingAndLeavesNoEvent() {
        ConsultantClientMapping before = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow();
        int remBefore = before.getRemainingSessions();
        int usedBefore = before.getUsedSessions();

        doThrow(new IllegalStateException("client_event write failed for rollback IT"))
                .when(clientEventService)
                .record(any(ClientEventRecordCommand.class));

        assertThatThrownBy(() -> adminService.useSession(mappingId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("client_event write failed");

        ConsultantClientMapping after = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow();
        assertThat(after.getRemainingSessions()).isEqualTo(remBefore);
        assertThat(after.getUsedSessions()).isEqualTo(usedBefore);
        assertThat(clientEventRepository
                        .findByTenantIdAndClientId(tenantId, client.getId(), Pageable.unpaged())
                        .getContent())
                .isEmpty();
    }

    private ConsultantClientMapping saveActiveMapping() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now());
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setPaymentMethod("CARD");
        mapping.setTotalSessions(TOTAL_SESSIONS);
        mapping.setRemainingSessions(TOTAL_SESSIONS);
        mapping.setUsedSessions(0);
        mapping.setPackageName("cer-it");
        mapping.setPackagePrice(PACKAGE_PRICE);
        mapping.setPaymentAmount(PACKAGE_PRICE);
        return mappingRepository.saveAndFlush(mapping);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("cer-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("cer-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
