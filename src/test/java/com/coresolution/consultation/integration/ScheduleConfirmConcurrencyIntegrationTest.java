package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
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

/**
 * 같은 일정 동시 확정 2회 — H2 실제 트랜잭션(테스트 트랜잭션 없음). 회기는 정확히 1회만 차감된다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("일정 동시 확정 — 회기 1회만 차감")
class ScheduleConfirmConcurrencyIntegrationTest {

    private static final int TOTAL_SESSIONS = 3;
    private static final int CONCURRENT_REQUESTS = 2;
    private static final long BARRIER_WAIT_SECONDS = 5L;
    private static final long FUTURE_WAIT_SECONDS = 60L;

    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ScheduleService scheduleService;

    private final List<Long> createdUserIds = new ArrayList<>();
    private Long mappingId;
    private Long scheduleId;
    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "scc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 27);
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        if (scheduleId != null) {
            scheduleRepository.deleteById(scheduleId);
        }
        if (mappingId != null) {
            mappingRepository.deleteById(mappingId);
        }
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("예약됨 일정 동시 확정 2회 — 확정 상태, used 1·remaining 2")
    void concurrentConfirm_deductsExactlyOnce() throws Exception {
        User consultant = saveUser(UserRole.CONSULTANT, "상담사");
        User client = saveUser(UserRole.CLIENT, "내담자");
        ConsultantClientMapping mapping = saveActiveMapping(consultant, client);
        mappingId = mapping.getId();
        scheduleId = saveBookedSchedule(mapping, consultant, client).getId();

        CyclicBarrier barrier = new CyclicBarrier(CONCURRENT_REQUESTS);
        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_REQUESTS);
        try {
            List<Future<Throwable>> futures = new ArrayList<>();
            for (int i = 0; i < CONCURRENT_REQUESTS; i++) {
                futures.add(pool.submit(() -> {
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        barrier.await(BARRIER_WAIT_SECONDS, TimeUnit.SECONDS);
                        scheduleService.confirmSchedule(scheduleId, "scc-confirm");
                        return null;
                    } catch (Throwable t) {
                        return t;
                    } finally {
                        TenantContextHolder.clear();
                    }
                }));
            }
            int succeeded = 0;
            for (Future<Throwable> future : futures) {
                if (future.get(FUTURE_WAIT_SECONDS, TimeUnit.SECONDS) == null) {
                    succeeded++;
                }
            }
            assertThat(succeeded).isGreaterThanOrEqualTo(1);
        } finally {
            pool.shutdownNow();
        }

        TenantContextHolder.setTenantId(tenantId);
        ConsultantClientMapping after = mappingRepository.findByTenantIdAndId(tenantId, mappingId).orElseThrow();
        assertThat(after.getUsedSessions()).isEqualTo(1);
        assertThat(after.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS - 1);
        Schedule schedule = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId).orElseThrow();
        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(schedule.getSessionSequence()).isNotNull();
    }

    private ConsultantClientMapping saveActiveMapping(User consultant, User client) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(MappingStatus.ACTIVE);
        m.setPaymentStatus(PaymentStatus.APPROVED);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(TOTAL_SESSIONS);
        m.setUsedSessions(0);
        m.setRemainingSessions(TOTAL_SESSIONS);
        m.setPackageName("scc-it");
        m.setIsDeleted(false);
        return mappingRepository.saveAndFlush(m);
    }

    private Schedule saveBookedSchedule(ConsultantClientMapping mapping, User consultant, User client) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(7));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scc-it-schedule");
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("scc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scc-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        return saved;
    }
}
