package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ScheduleStatusTransitionException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 같은 예약됨 일정에 대한 동시 확정. 테스트 트랜잭션을 쓰지 않아 커밋이 다른 스레드에 보인다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("일정 동시 확정 — 회기 1회만 차감")
class ScheduleConfirmConcurrentIntegrationTest {

    private static final int TOTAL_SESSIONS = 4;
    private static final int THREADS = 2;

    @Autowired private ScheduleService scheduleService;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    private TransactionTemplate transactionTemplate;

    private String tenantId;
    private Long mappingId;
    private Long scheduleId;
    private final List<Long> userIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = "scconc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.executeWithoutResult(status -> {
            TenantContextHolder.setTenantId(tenantId);
            User consultant = saveUser(UserRole.CONSULTANT, "동시상담사");
            User client = saveUser(UserRole.CLIENT, "동시내담자");
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setTenantId(tenantId);
            mapping.setConsultant(consultant);
            mapping.setClient(client);
            mapping.setStartDate(LocalDateTime.now());
            mapping.setStatus(MappingStatus.ACTIVE);
            mapping.setPaymentStatus(PaymentStatus.APPROVED);
            mapping.setPaymentMethod("CARD");
            mapping.setTotalSessions(TOTAL_SESSIONS);
            mapping.setUsedSessions(0);
            mapping.setRemainingSessions(TOTAL_SESSIONS);
            mapping.setPackageName("scconc-it");
            mapping.setIsDeleted(false);
            mapping = mappingRepository.saveAndFlush(mapping);
            mappingId = mapping.getId();

            Schedule schedule = new Schedule();
            schedule.setTenantId(tenantId);
            schedule.setConsultantId(consultant.getId());
            schedule.setClientId(client.getId());
            schedule.setMappingId(mapping.getId());
            schedule.setDate(LocalDate.now().plusDays(3));
            schedule.setStartTime(LocalTime.of(11, 0));
            schedule.setEndTime(LocalTime.of(11, 50));
            schedule.setStatus(ScheduleStatus.BOOKED);
            schedule.setScheduleType("CONSULTATION");
            schedule.setConsultationType("INDIVIDUAL");
            schedule.setTitle("scconc-it-schedule");
            schedule.setIsDeleted(false);
            scheduleId = scheduleRepository.saveAndFlush(schedule).getId();
        });
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                TenantContextHolder.setTenantId(tenantId);
                if (scheduleId != null) {
                    scheduleRepository.findByTenantIdAndId(tenantId, scheduleId)
                            .ifPresent(scheduleRepository::delete);
                }
                if (mappingId != null) {
                    mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                            .ifPresent(mappingRepository::delete);
                }
                for (Long userId : userIds) {
                    userRepository.findByTenantIdAndId(tenantId, userId).ifPresent(userRepository::delete);
                }
            });
        } finally {
            TenantContextHolder.clear();
        }
    }

    @Test
    @DisplayName("동시에 두 번 확정해도 회기는 1만 차감되고 상태는 CONFIRMED")
    void concurrentConfirm_deductsOnce() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        AtomicInteger ok = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        try {
            for (int i = 0; i < THREADS; i++) {
                pool.submit(() -> {
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        start.await(10, TimeUnit.SECONDS);
                        scheduleService.confirmSchedule(scheduleId, "scconc-confirm");
                        ok.incrementAndGet();
                    } catch (ScheduleStatusTransitionException ex) {
                        rejected.incrementAndGet();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    } finally {
                        TenantContextHolder.clear();
                        done.countDown();
                    }
                });
            }
            start.countDown();
            assertThat(done.await(30, TimeUnit.SECONDS)).isTrue();
        } finally {
            pool.shutdownNow();
        }

        assertThat(ok.get() + rejected.get()).isEqualTo(THREADS);
        assertThat(ok.get()).isGreaterThanOrEqualTo(1);

        TenantContextHolder.setTenantId(tenantId);
        Schedule confirmed = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId).orElseThrow();
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId).orElseThrow();
        assertThat(confirmed.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS - 1);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("scconc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scconc-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        userIds.add(saved.getId());
        return saved;
    }
}
