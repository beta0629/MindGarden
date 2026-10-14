package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.NotificationService;
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
 * 관리자 수동 매칭 배정(createMappingFromAdmin) 동시 요청 — 짧은 시간창 중복 생성 가드가
 * 내담자 행 잠금(FOR UPDATE)으로 직렬화되어 정확히 1건만 생성됨을 H2 실제 트랜잭션으로 검증한다.
 *
 * <p>exists 체크와 save 분리로 인한 레이스(#1616 후속)를 재현한다: 동일 상담사·내담자·
 * 동일 packageName 요청을 스레드 2개가 동시에 {@code createMappingFromAdmin}으로 보내면
 * 1건은 성공, 1건은 {@link IllegalArgumentException}(짧은 시간창 중복)으로 실패해야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("createMappingFromAdmin 동시 요청 — 짧은 시간창 중복 가드 직렬화 (DB)")
class AdminServiceCreateMappingDuplicateConcurrencyIntegrationTest {

    private static final int CONCURRENT_REQUESTS = 2;
    private static final long BARRIER_WAIT_SECONDS = 5L;
    private static final long FUTURE_WAIT_SECONDS = 60L;
    private static final String PACKAGE_NAME = "concurrency-admin-guard-package";

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
        tenantId = "cmdc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 27);
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
    @DisplayName("동일 상담사·내담자·동일 packageName 동시 생성 2회 — 성공 1 + 실패 1, DB 행 1건")
    void concurrentCreateMappingFromAdmin_sameConsultantClientPackageName_createsExactlyOneRow()
            throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(CONCURRENT_REQUESTS);
        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_REQUESTS);
        try {
            List<Future<Throwable>> futures = new ArrayList<>();
            for (int i = 0; i < CONCURRENT_REQUESTS; i++) {
                futures.add(pool.submit(() -> {
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        barrier.await(BARRIER_WAIT_SECONDS, TimeUnit.SECONDS);
                        adminService.createMappingFromAdmin(newRequest());
                        return null;
                    } catch (Throwable t) {
                        return t;
                    } finally {
                        TenantContextHolder.clear();
                    }
                }));
            }

            int succeeded = 0;
            int rejectedAsDuplicate = 0;
            for (Future<Throwable> future : futures) {
                Throwable result = future.get(FUTURE_WAIT_SECONDS, TimeUnit.SECONDS);
                if (result == null) {
                    succeeded++;
                } else if (result instanceof IllegalArgumentException) {
                    rejectedAsDuplicate++;
                }
            }
            assertThat(succeeded).isEqualTo(1);
            assertThat(rejectedAsDuplicate).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }

        TenantContextHolder.setTenantId(tenantId);
        List<ConsultantClientMapping> created = mappingRepository
                .findByTenantIdAndConsultantAndClient(tenantId, consultant, client).stream()
                .filter(m -> PACKAGE_NAME.equals(m.getPackageName()))
                .toList();
        assertThat(created).hasSize(1);
    }

    private ConsultantClientMappingCreateRequest newRequest() {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(consultant.getId());
        dto.setClientId(client.getId());
        dto.setTotalSessions(10);
        dto.setPackageName(PACKAGE_NAME);
        dto.setPackagePrice(100_000L);
        dto.setStatus(MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name());
        return dto;
    }

    private User newUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("cmdc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("cmdc-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
