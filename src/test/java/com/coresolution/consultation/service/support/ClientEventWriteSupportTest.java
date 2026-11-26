package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.entity.ClientEvent;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link ClientEventWriteSupport} 단위 테스트 — Command 빌드·예외 전파.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ClientEventWriteSupport")
class ClientEventWriteSupportTest {

    private static final String TENANT_ID = "tenant-client-event-write";

    @Mock
    private ClientEventService clientEventService;

    private ClientEventWriteSupport support;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        support = new ClientEventWriteSupport(clientEventService, new ObjectMapper());
        when(clientEventService.record(any(ClientEventRecordCommand.class)))
                .thenReturn(ClientEvent.builder().id(1L).build());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("SESSION_DEDUCTED: sessions before/after 를 Command 에 담아 record 호출")
    void recordSessionDeducted_passesSessionCounters() {
        support.recordSessionDeducted(
                TENANT_ID, 42L, 700L, 501L,
                5, 4, 1, 2,
                "{\"remainingSessions\":5}", "{\"remainingSessions\":4}");

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        ClientEventRecordCommand cmd = captor.getValue();
        assertThat(cmd.getEventType()).isEqualTo(ClientEventType.SESSION_DEDUCTED);
        assertThat(cmd.getClientId()).isEqualTo(42L);
        assertThat(cmd.getMappingId()).isEqualTo(700L);
        assertThat(cmd.getScheduleId()).isEqualTo(501L);
        assertThat(cmd.getSessionsRemainingBefore()).isEqualTo(5);
        assertThat(cmd.getSessionsRemainingAfter()).isEqualTo(4);
        assertThat(cmd.getSessionsUsedBefore()).isEqualTo(1);
        assertThat(cmd.getSessionsUsedAfter()).isEqualTo(2);
        assertThat(cmd.getIdempotencyKey())
                .isEqualTo("SESSION_DEDUCTED:" + TENANT_ID + ":schedule:501");
    }

    @Test
    @DisplayName("SCHEDULE_CREATED: 통일 schedule 멱등 키")
    void recordScheduleCreated_setsUnifiedKey() {
        Schedule schedule = new Schedule();
        schedule.setId(10L);
        schedule.setClientId(42L);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setDate(LocalDate.of(2026, 11, 26));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));

        support.recordScheduleCreated(schedule, false);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        assertThat(captor.getValue().getIdempotencyKey())
                .isEqualTo("SCHEDULE_CREATED:" + TENANT_ID + ":schedule:10");
    }

    @Test
    @DisplayName("PAYMENT_COMPLETED: 통일 payment 멱등 키")
    void recordPaymentCompleted_setsUnifiedKey() {
        Payment payment = Payment.builder()
                .paymentId("PAY-1")
                .orderId("ORD-1")
                .amount(new BigDecimal("50000"))
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(42L)
                .build();
        payment.setId(9001L);
        payment.setTenantId(TENANT_ID);

        support.recordPaymentCompleted(payment, ClientEventSource.PG_CALLBACK);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        assertThat(captor.getValue().getIdempotencyKey())
                .isEqualTo("PAYMENT_COMPLETED:" + TENANT_ID + ":payment:9001");
    }

    @Test
    @DisplayName("record 실패 시 예외를 삼키지 않고 전파")
    void record_propagatesException() {
        doThrow(new RuntimeException("client_event write failed"))
                .when(clientEventService).record(any(ClientEventRecordCommand.class));

        Schedule schedule = new Schedule();
        schedule.setId(10L);
        schedule.setClientId(42L);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setDate(LocalDate.of(2026, 11, 26));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));

        assertThatThrownBy(() -> support.recordScheduleCreated(schedule, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("client_event write failed");
    }

    @Test
    @DisplayName("PAYMENT_COMPLETED: PAYMENT_* 타입·금액 전달")
    void recordPaymentCompleted_passesPaymentFields() {
        Payment payment = Payment.builder()
                .paymentId("PAY-1")
                .orderId("ORD-1")
                .amount(new BigDecimal("50000"))
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(42L)
                .build();
        payment.setId(9001L);
        payment.setTenantId(TENANT_ID);

        support.recordPaymentCompleted(payment, ClientEventSource.PG_CALLBACK);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        ClientEventRecordCommand cmd = captor.getValue();
        assertThat(cmd.getEventType()).isEqualTo(ClientEventType.PAYMENT_COMPLETED);
        assertThat(cmd.getPaymentId()).isEqualTo(9001L);
        assertThat(cmd.getAmount()).isEqualByComparingTo("50000");
        assertThat(cmd.getSource()).isEqualTo(ClientEventSource.PG_CALLBACK);
        assertThat(cmd.getClientId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("SESSION_ADJUSTED: forMappingAction 멱등 키 + before/after 세션 카운터")
    void recordSessionAdjusted_setsForMappingKeyAndBeforeAfter() {
        User client = new User();
        client.setId(42L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(700L);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setTotalSessions(15);
        mapping.setUsedSessions(2);
        mapping.setRemainingSessions(13);

        support.recordSessionAdjusted(mapping, "{\"totalSessions\":10}", 8, 2);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        ClientEventRecordCommand cmd = captor.getValue();
        assertThat(cmd.getEventType()).isEqualTo(ClientEventType.SESSION_ADJUSTED);
        assertThat(cmd.getMappingId()).isEqualTo(700L);
        assertThat(cmd.getSessionsRemainingBefore()).isEqualTo(8);
        assertThat(cmd.getSessionsRemainingAfter()).isEqualTo(13);
        assertThat(cmd.getSessionsUsedBefore()).isEqualTo(2);
        assertThat(cmd.getSessionsUsedAfter()).isEqualTo(2);
        assertThat(cmd.getBeforeJson()).contains("totalSessions");
        assertThat(cmd.getAfterJson()).contains("15");
        assertThat(cmd.getIdempotencyKey())
                .isEqualTo("SESSION_ADJUSTED:" + TENANT_ID + ":mapping:700:rem8-u2_rem13-u2");
    }

    @Test
    @DisplayName("PAYMENT_COMPLETED(매핑): forMappingAction 멱등 키 + 금액")
    void recordPaymentCompletedForMapping_setsUnifiedMappingKey() {
        User client = new User();
        client.setId(42L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(701L);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        mapping.setPaymentReference("REF-PAY-701");

        support.recordPaymentCompletedForMapping(
                mapping, new BigDecimal("90000"), ClientEventSource.API);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        ClientEventRecordCommand cmd = captor.getValue();
        assertThat(cmd.getEventType()).isEqualTo(ClientEventType.PAYMENT_COMPLETED);
        assertThat(cmd.getAmount()).isEqualByComparingTo("90000");
        assertThat(cmd.getMappingId()).isEqualTo(701L);
        assertThat(cmd.getIdempotencyKey())
                .isEqualTo("PAYMENT_COMPLETED:" + TENANT_ID + ":mapping:701:ref:REF-PAY-701:amt:90000");
    }

    @Test
    @DisplayName("PAYMENT_REFUNDED(매핑): forMappingAction 멱등 키(부분환불 fingerprint)")
    void recordPaymentRefundedForMapping_setsUnifiedMappingKey() {
        User client = new User();
        client.setId(42L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(702L);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);

        support.recordPaymentRefundedForMapping(
                mapping, new BigDecimal("50000"), "관리자 종료 환불", null);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService).record(captor.capture());
        ClientEventRecordCommand cmd = captor.getValue();
        assertThat(cmd.getEventType()).isEqualTo(ClientEventType.PAYMENT_REFUNDED);
        assertThat(cmd.getReason()).isEqualTo("관리자 종료 환불");
        assertThat(cmd.getIdempotencyKey())
                .startsWith("PAYMENT_REFUNDED:" + TENANT_ID + ":mapping:702:amt:50000:r:");
        assertThat(cmd.getIdempotencyKey())
                .isNotEqualTo("PAYMENT_REFUNDED:" + TENANT_ID + ":mapping:702");
    }

    @Test
    @DisplayName("mapping-only 재결제·부분환불 fingerprint 가 서로 다르고 동일 요청은 동일 키")
    void mappingOnlyPaymentKeys_distinctPerActionUnit() {
        User client = new User();
        client.setId(42L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(703L);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);

        support.recordPaymentCompletedForMapping(
                mapping, new BigDecimal("90000"), "REF-A", ClientEventSource.API);
        support.recordPaymentCompletedForMapping(
                mapping, new BigDecimal("90000"), "REF-B", ClientEventSource.API);
        support.recordPaymentRefundedForMapping(
                mapping, new BigDecimal("10000"), "부분1", null);
        support.recordPaymentRefundedForMapping(
                mapping, new BigDecimal("10000"), "부분1", null);
        support.recordPaymentRefundedForMapping(
                mapping, new BigDecimal("20000"), "부분2", null);

        ArgumentCaptor<ClientEventRecordCommand> captor =
                ArgumentCaptor.forClass(ClientEventRecordCommand.class);
        verify(clientEventService, times(5)).record(captor.capture());
        java.util.List<String> keys = new java.util.ArrayList<>();
        for (ClientEventRecordCommand command : captor.getAllValues()) {
            keys.add(command.getIdempotencyKey());
        }
        assertThat(keys.get(0)).contains("ref:REF-A:amt:90000");
        assertThat(keys.get(1)).contains("ref:REF-B:amt:90000");
        assertThat(keys.get(0)).isNotEqualTo(keys.get(1));
        assertThat(keys.get(2)).isEqualTo(keys.get(3));
        assertThat(keys.get(2)).isNotEqualTo(keys.get(4));
    }
}
