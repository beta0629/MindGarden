package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.sql.DataSource;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 예약 확정 알림은 행잠금 트랜잭션 커밋 뒤({@code DeferredExternalCalls})에 보낸다.
 * 외부 호출 시점에 Hikari active=0, EntityManager 미바인딩, 트랜잭션 동기화 비활성.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("예약 확정 알림 — 커밋 이후 외부 호출, 커넥션 점유 0")
class ScheduleConfirmNotificationOutsideTxIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @MockBean private NotificationService notificationService;

    private final List<CallBoundary> boundaries = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "scno-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
        boundaries.clear();
        doAnswer(invocation -> {
            boundaries.add(new CallBoundary(
                    "sendConsultationConfirmed",
                    TransactionSynchronizationManager.isActualTransactionActive(),
                    TransactionSynchronizationManager.isSynchronizationActive(),
                    TransactionSynchronizationManager.hasResource(entityManagerFactory),
                    activeConnections()));
            return true;
        }).when(notificationService).sendConsultationConfirmed(any(), anyString(), anyString(), anyString());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("확정 API 알림 시점에 커넥션·EM·동기화가 없다")
    void confirm_sendsNotificationAfterCommitWithoutHeldConnection() throws Exception {
        ConsultantClientMapping mapping = saveActiveMapping();
        Schedule schedule = saveBookedSchedule(mapping);

        mockMvc.perform(put("/api/v1/schedules/{id}/confirm", schedule.getId())
                        .sessionAttr(SessionConstants.USER_OBJECT, caller())
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("adminNote", "scno-confirm"))))
                .andExpect(status().isOk());

        assertThat(boundaries).isNotEmpty();
        assertThat(boundaries).allSatisfy(boundary -> {
            assertThat(boundary.actualTransaction()).as("actualTransaction").isFalse();
            assertThat(boundary.synchronization()).as("synchronization").isFalse();
            assertThat(boundary.entityManagerBound()).as("entityManagerBound").isFalse();
            assertThat(boundary.activeConnections()).as("activeConnections").isZero();
        });
    }

    private int activeConnections() {
        try {
            return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
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
        mapping.setTotalSessions(3);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(3);
        mapping.setPackageName("scno-it");
        mapping.setIsDeleted(false);
        return mappingRepository.saveAndFlush(mapping);
    }

    private Schedule saveBookedSchedule(ConsultantClientMapping mapping) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(2));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scno-it-schedule");
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("scno-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scno-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }

    private User caller() {
        User user = new User();
        user.setId(1L);
        user.setUserId("scno-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    private record CallBoundary(
            String call,
            boolean actualTransaction,
            boolean synchronization,
            boolean entityManagerBound,
            int activeConnections) {
    }
}
