package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.constant.ClientEventIdempotencyKeys;
import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.entity.ClientEvent;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientEventRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingHistoryRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ClientEventService;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link ClientEventBackfillServiceImpl} — dry-run·멱등·테넌트 필수·롤백.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientEventBackfillServiceImpl")
class ClientEventBackfillServiceImplTest {

    private static final String TENANT_A = "tenant-a-" + UUID.randomUUID();
    private static final String TENANT_B = "tenant-b-" + UUID.randomUUID();
    private static final Long CLIENT_ID = 77L;

    @Mock
    private ClientEventService clientEventService;
    @Mock
    private ClientEventRepository clientEventRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantClientMappingHistoryRepository historyRepository;

    @InjectMocks
    private ClientEventBackfillServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
    }

    @Test
    @DisplayName("dry-run: record 미호출 · 예상 inserted·byEventType·clientCount 집계")
    void dryRun_doesNotCallRecord() {
        stubEmptySources(TENANT_A);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .client(client)
                .totalSessions(10)
                .usedSessions(0)
                .remainingSessions(10)
                .build();
        mapping.setId(101L);
        mapping.setTenantId(TENANT_A);
        mapping.setCreatedAt(LocalDateTime.of(2026, 1, 1, 9, 0));
        when(mappingRepository.findByTenantId(TENANT_A)).thenReturn(List.of(mapping));
        when(clientEventRepository.findByTenantIdAndIdempotencyKey(eq(TENANT_A), any()))
                .thenReturn(Optional.empty());

        ClientEventBackfillResult result = service.dryRun(TENANT_A);

        assertThat(result.getMode()).isEqualTo(ClientEventBackfillMode.DRY_RUN);
        assertThat(result.getScanned()).isEqualTo(1L);
        assertThat(result.getInserted()).isEqualTo(1L);
        assertThat(result.getSkipped()).isZero();
        assertThat(result.getClientCount()).isEqualTo(1L);
        assertThat(result.getByEventType())
                .containsKey(ClientEventType.MAPPING_CREATED.getCode());
        assertThat(result.getByEventType().get(ClientEventType.MAPPING_CREATED.getCode()).getInserted())
                .isEqualTo(1L);
        verify(clientEventService, never()).record(any());
    }

    @Test
    @DisplayName("훅 통일 키 존재 시 백필 skipped>0 · inserted=0")
    void backfill_skipsWhenHookLeftUnifiedKey() {
        stubEmptySources(TENANT_A);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .client(client)
                .totalSessions(5)
                .usedSessions(0)
                .remainingSessions(5)
                .build();
        mapping.setId(202L);
        mapping.setTenantId(TENANT_A);
        mapping.setCreatedAt(LocalDateTime.of(2026, 2, 1, 10, 0));
        when(mappingRepository.findByTenantId(TENANT_A)).thenReturn(List.of(mapping));

        String key = ClientEventIdempotencyKeys.forMapping(
                ClientEventType.MAPPING_CREATED, TENANT_A, 202L);
        when(clientEventRepository.findByTenantIdAndIdempotencyKey(TENANT_A, key))
                .thenReturn(Optional.of(ClientEvent.builder()
                        .id(1L)
                        .tenantId(TENANT_A)
                        .clientId(CLIENT_ID)
                        .eventType(ClientEventType.MAPPING_CREATED)
                        .occurredAt(LocalDateTime.of(2026, 2, 1, 10, 0))
                        .source(ClientEventSource.API)
                        .idempotencyKey(key)
                        .build()));

        ClientEventBackfillResult result = service.apply(TENANT_A);

        assertThat(result.getInserted()).isZero();
        assertThat(result.getSkipped()).isEqualTo(1L);
        verify(clientEventService, never()).record(any());
    }

    @Test
    @DisplayName("apply 2회: 2회차 inserted=0 · skipped>0 (멱등)")
    void apply_secondRunIdempotent() {
        stubEmptySources(TENANT_A);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .client(client)
                .totalSessions(5)
                .usedSessions(1)
                .remainingSessions(4)
                .build();
        mapping.setId(202L);
        mapping.setTenantId(TENANT_A);
        mapping.setCreatedAt(LocalDateTime.of(2026, 2, 1, 10, 0));
        when(mappingRepository.findByTenantId(TENANT_A)).thenReturn(List.of(mapping));

        String key = ClientEventBackfillConstants.idempotencyMappingCreated(TENANT_A, 202L);
        when(clientEventRepository.findByTenantIdAndIdempotencyKey(TENANT_A, key))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(ClientEvent.builder()
                        .id(1L)
                        .tenantId(TENANT_A)
                        .clientId(CLIENT_ID)
                        .eventType(ClientEventType.MAPPING_CREATED)
                        .occurredAt(LocalDateTime.of(2026, 2, 1, 10, 0))
                        .source(ClientEventSource.BACKFILLED)
                        .idempotencyKey(key)
                        .build()));
        when(clientEventService.record(any())).thenAnswer(inv -> {
            ClientEventRecordCommand cmd = inv.getArgument(0);
            return ClientEvent.builder()
                    .id(9L)
                    .tenantId(cmd.getTenantId())
                    .clientId(cmd.getClientId())
                    .eventType(cmd.getEventType())
                    .occurredAt(cmd.getOccurredAt())
                    .source(cmd.getSource())
                    .idempotencyKey(cmd.getIdempotencyKey())
                    .build();
        });

        ClientEventBackfillResult first = service.apply(TENANT_A);
        ClientEventBackfillResult second = service.apply(TENANT_A);

        assertThat(first.getInserted()).isEqualTo(1L);
        assertThat(first.getSkipped()).isZero();
        assertThat(second.getInserted()).isZero();
        assertThat(second.getSkipped()).isEqualTo(1L);
        verify(clientEventService, times(1)).record(any());
    }

    @Test
    @DisplayName("테넌트 스코프: 지정 tenant 로만 조회 · 타 테넌트 미호출")
    void apply_scopesQueriesToTenant() {
        stubEmptySources(TENANT_A);

        ClientEventBackfillResult result = service.apply(TENANT_A);

        assertThat(result.getTenantId()).isEqualTo(TENANT_A);
        verify(mappingRepository).findByTenantId(TENANT_A);
        verify(scheduleRepository).findByTenantId(TENANT_A);
        verify(historyRepository).findByTenantIdOrderByCreatedAtAscIdAsc(TENANT_A);
        verify(mappingRepository, never()).findByTenantId(TENANT_B);
        verify(scheduleRepository, never()).findByTenantId(TENANT_B);
        verify(historyRepository, never()).findByTenantIdOrderByCreatedAtAscIdAsc(TENANT_B);
    }

    @Test
    @DisplayName("tenantId 누락 → 예외")
    void run_requiresTenantId() {
        assertThatThrownBy(() -> service.dryRun(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
        assertThatThrownBy(() -> service.apply("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
        verify(mappingRepository, never()).findByTenantId(any());
    }

    @Test
    @DisplayName("결제·일정·이력 소스를 ClientEventType 으로 변환해 record · schedule 키 우선")
    void apply_mapsSourcesToEventTypes() {
        when(mappingRepository.findByTenantId(TENANT_A)).thenReturn(List.of());
        when(historyRepository.findByTenantIdOrderByCreatedAtAscIdAsc(TENANT_A))
                .thenReturn(List.of(history(11L, MappingHistoryEventType.SESSION_USED)));

        Payment approved = payment(301L, Payment.PaymentStatus.APPROVED, new BigDecimal("50000"));
        Payment cancelled = payment(302L, Payment.PaymentStatus.CANCELLED, new BigDecimal("10000"));
        when(paymentRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_A), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(approved, cancelled)));

        Schedule tentative = schedule(401L, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        Schedule booked = schedule(402L, ScheduleStatus.BOOKED);
        Schedule cancelledSchedule = schedule(403L, ScheduleStatus.CANCELLED);
        when(scheduleRepository.findByTenantId(TENANT_A))
                .thenReturn(List.of(tentative, booked, cancelledSchedule));

        when(clientEventRepository.findByTenantIdAndIdempotencyKey(eq(TENANT_A), any()))
                .thenReturn(Optional.empty());
        when(clientEventService.record(any())).thenAnswer(inv -> {
            ClientEventRecordCommand cmd = inv.getArgument(0);
            return ClientEvent.builder()
                    .id(1L)
                    .tenantId(cmd.getTenantId())
                    .clientId(cmd.getClientId())
                    .eventType(cmd.getEventType())
                    .occurredAt(cmd.getOccurredAt())
                    .source(ClientEventSource.BACKFILLED)
                    .idempotencyKey(cmd.getIdempotencyKey())
                    .build();
        });

        ClientEventBackfillResult result = service.apply(TENANT_A);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService, times(6)).record(captor.capture());
        List<ClientEventType> types = captor.getAllValues().stream()
                .map(ClientEventRecordCommand::getEventType)
                .toList();
        assertThat(types).containsExactlyInAnyOrder(
                ClientEventType.PAYMENT_COMPLETED,
                ClientEventType.TEMP_RESERVATION_CREATED,
                ClientEventType.SCHEDULE_CREATED,
                ClientEventType.SCHEDULE_CANCELLED,
                ClientEventType.SESSION_DEDUCTED,
                ClientEventType.PAYMENT_CANCELLED);
        assertThat(captor.getAllValues())
                .allMatch(cmd -> cmd.getSource() == ClientEventSource.BACKFILLED);
        assertThat(captor.getAllValues())
                .allMatch(cmd -> cmd.getIdempotencyKey() != null
                        && !cmd.getIdempotencyKey().startsWith("BACKFILL:"));
        ClientEventRecordCommand sessionCmd = captor.getAllValues().stream()
                .filter(c -> c.getEventType() == ClientEventType.SESSION_DEDUCTED)
                .findFirst()
                .orElseThrow();
        assertThat(sessionCmd.getIdempotencyKey())
                .isEqualTo("SESSION_DEDUCTED:" + TENANT_A + ":schedule:88");
        assertThat(result.getInserted()).isEqualTo(6L);
        assertThat(result.getErrors()).isZero();
        assertThat(result.getClientCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("rollback dry-run: BACKFILLED 만 집계 · API/SCREEN 미포함")
    void rollback_dryRun_countsOnlyBackfilled() {
        ClientEvent backfilled = ClientEvent.builder()
                .id(1L)
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.MAPPING_CREATED)
                .occurredAt(LocalDateTime.now())
                .source(ClientEventSource.BACKFILLED)
                .idempotencyKey("MAPPING_CREATED:" + TENANT_A + ":mapping:9")
                .build();
        ClientEvent legacy = ClientEvent.builder()
                .id(2L)
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.PAYMENT_COMPLETED)
                .occurredAt(LocalDateTime.now())
                .source(ClientEventSource.BACKFILLED)
                .idempotencyKey("BACKFILL:PAYMENT_COMPLETED:" + TENANT_A + ":3")
                .build();
        when(clientEventRepository.findByTenantIdAndSource(TENANT_A, ClientEventSource.BACKFILLED))
                .thenReturn(List.of(backfilled, legacy));

        ClientEventBackfillResult result = service.rollback(TENANT_A, true);

        assertThat(result.getInserted()).isEqualTo(2L);
        assertThat(result.getClientCount()).isEqualTo(1L);
        verify(clientEventRepository, never())
                .deleteByTenantIdAndSourceAndIdIn(any(), any(), any());
    }

    @Test
    @DisplayName("rollback apply: BACKFILLED 키만 삭제 · API/SCREEN 행은 조회·삭제 대상 아님")
    void rollback_apply_deletesOnlyBackfilledEligible() {
        ClientEvent backfilled = ClientEvent.builder()
                .id(10L)
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.SCHEDULE_CREATED)
                .occurredAt(LocalDateTime.now())
                .source(ClientEventSource.BACKFILLED)
                .idempotencyKey("SCHEDULE_CREATED:" + TENANT_A + ":schedule:1")
                .build();
        when(clientEventRepository.findByTenantIdAndSource(TENANT_A, ClientEventSource.BACKFILLED))
                .thenReturn(List.of(backfilled));
        when(clientEventRepository.deleteByTenantIdAndSourceAndIdIn(
                        eq(TENANT_A), eq(ClientEventSource.BACKFILLED), any()))
                .thenReturn(1);

        ClientEventBackfillResult result = service.rollback(TENANT_A, false);

        assertThat(result.getMode()).isEqualTo(ClientEventBackfillMode.ROLLBACK);
        assertThat(result.getInserted()).isEqualTo(1L);
        // 실시간 훅(API/SCREEN) 은 source=BACKFILLED 필터로 절대 삭제하지 않음
        verify(clientEventRepository).findByTenantIdAndSource(TENANT_A, ClientEventSource.BACKFILLED);
        verify(clientEventRepository, never())
                .findByTenantIdAndSource(TENANT_A, ClientEventSource.API);
        verify(clientEventRepository, never())
                .findByTenantIdAndSource(TENANT_A, ClientEventSource.SCREEN);
        verify(clientEventRepository).deleteByTenantIdAndSourceAndIdIn(
                eq(TENANT_A), eq(ClientEventSource.BACKFILLED), eq(List.of(10L)));
        verify(clientEventRepository, never())
                .deleteByTenantIdAndSourceAndIdIn(
                        eq(TENANT_A), eq(ClientEventSource.API), any());
        verify(clientEventRepository, never())
                .deleteByTenantIdAndSourceAndIdIn(
                        eq(TENANT_A), eq(ClientEventSource.SCREEN), any());
    }

    private void stubEmptySources(String tenantId) {
        when(mappingRepository.findByTenantId(tenantId)).thenReturn(List.of());
        when(scheduleRepository.findByTenantId(tenantId)).thenReturn(List.of());
        when(historyRepository.findByTenantIdOrderByCreatedAtAscIdAsc(tenantId))
                .thenReturn(List.of());
        when(paymentRepository.findByTenantIdAndIsDeletedFalse(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
    }

    private static Payment payment(Long id, Payment.PaymentStatus status, BigDecimal amount) {
        Payment payment = Payment.builder()
                .paymentId("pay-" + id)
                .orderId("ord-" + id)
                .amount(amount)
                .status(status)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .payerId(CLIENT_ID)
                .build();
        payment.setId(id);
        payment.setTenantId(TENANT_A);
        payment.setCreatedAt(LocalDateTime.of(2026, 3, 1, 12, 0));
        if (status == Payment.PaymentStatus.APPROVED) {
            payment.setApprovedAt(LocalDateTime.of(2026, 3, 1, 12, 5));
        }
        if (status == Payment.PaymentStatus.CANCELLED) {
            payment.setCancelledAt(LocalDateTime.of(2026, 3, 2, 9, 0));
        }
        return payment;
    }

    private static Schedule schedule(Long id, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_A);
        schedule.setClientId(CLIENT_ID);
        schedule.setConsultantId(9L);
        schedule.setDate(LocalDate.of(2026, 4, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        schedule.setCreatedAt(LocalDateTime.of(2026, 4, 1, 8, 0));
        return schedule;
    }

    private static ConsultantClientMappingHistory history(
            Long id, MappingHistoryEventType eventType) {
        return ConsultantClientMappingHistory.builder()
                .id(id)
                .tenantId(TENANT_A)
                .mappingId(50L)
                .clientId(CLIENT_ID)
                .eventType(eventType)
                .beforeStateJson("{\"usedSessions\":0,\"remainingSessions\":5}")
                .afterStateJson("{\"usedSessions\":1,\"remainingSessions\":4}")
                .reason("SESSION_USED via schedule 88")
                .createdAt(LocalDateTime.of(2026, 5, 1, 11, 0))
                .build();
    }
}
