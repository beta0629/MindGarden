package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.dto.ClientEventResponse;
import com.coresolution.consultation.entity.ClientEvent;
import com.coresolution.consultation.repository.ClientEventRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * {@link ClientEventServiceImpl} 단위 테스트 — 테넌트 스코프·멱등.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientEventServiceImpl")
class ClientEventServiceImplTest {

    private static final String TENANT_A = "tenant-a-" + UUID.randomUUID();
    private static final String TENANT_B = "tenant-b-" + UUID.randomUUID();
    private static final Long CLIENT_ID = 55L;

    @Mock
    private ClientEventRepository clientEventRepository;

    @InjectMocks
    private ClientEventServiceImpl service;

    @Test
    @DisplayName("tenantId 누락 시 예외 · 리포지토리 미호출")
    void findTimeline_requiresTenantId() {
        Pageable pageable = PageRequest.of(0, 20);
        assertThatThrownBy(() -> service.findTimeline(null, CLIENT_ID, pageable))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
        assertThatThrownBy(() -> service.findTimeline("  ", CLIENT_ID, pageable))
                .isInstanceOf(IllegalArgumentException.class);
        verify(clientEventRepository, never()).findByTenantIdAndClientId(any(), any(), any());
    }

    @Test
    @DisplayName("clientId 누락 시 예외")
    void findTimeline_requiresClientId() {
        assertThatThrownBy(() -> service.findTimeline(TENANT_A, null, PageRequest.of(0, 10)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("clientId");
        verify(clientEventRepository, never()).findByTenantIdAndClientId(any(), any(), any());
    }

    @Test
    @DisplayName("타 테넌트 clientId 로 조회해도 전달된 tenantId 스코프만 사용")
    void findTimeline_scopesByPassedTenantIdOnly() {
        ClientEvent event = ClientEvent.builder()
                .id(9L)
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.SESSION_DEDUCTED)
                .occurredAt(LocalDateTime.of(2026, 11, 2, 10, 0))
                .source(ClientEventSource.API)
                .build();
        Pageable pageable = PageRequest.of(
                0,
                20,
                Sort.by(Sort.Order.asc("occurredAt"), Sort.Order.asc("id")));
        when(clientEventRepository.findByTenantIdAndClientId(eq(TENANT_A), eq(CLIENT_ID), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(event), pageable, 1));

        Page<ClientEventResponse> page = service.findTimeline(TENANT_A, CLIENT_ID, pageable);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getEventType())
                .isEqualTo(ClientEventType.SESSION_DEDUCTED.getCode());
        verify(clientEventRepository).findByTenantIdAndClientId(TENANT_A, CLIENT_ID, pageable);
        verify(clientEventRepository, never()).findByTenantIdAndClientId(eq(TENANT_B), any(), any());
    }

    @Test
    @DisplayName("idempotencyKey 중복 시 기존 row 반환 · save 미호출")
    void record_idempotentWhenKeyExists() {
        String key = "backfill:payment:99";
        ClientEvent existing = ClientEvent.builder()
                .id(3L)
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.PAYMENT_COMPLETED)
                .occurredAt(LocalDateTime.of(2026, 10, 1, 12, 0))
                .source(ClientEventSource.BACKFILLED)
                .idempotencyKey(key)
                .build();
        when(clientEventRepository.findByTenantIdAndIdempotencyKey(TENANT_A, key))
                .thenReturn(Optional.of(existing));

        ClientEvent result = service.record(ClientEventRecordCommand.builder()
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.PAYMENT_COMPLETED)
                .occurredAt(LocalDateTime.of(2026, 10, 1, 12, 0))
                .source(ClientEventSource.BACKFILLED)
                .idempotencyKey(key)
                .build());

        assertThat(result.getId()).isEqualTo(3L);
        verify(clientEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("신규 record 는 저장하고 예외를 삼키지 않는다")
    void record_savesNewEvent() {
        when(clientEventRepository.save(any(ClientEvent.class))).thenAnswer(inv -> {
            ClientEvent e = inv.getArgument(0);
            e.setId(11L);
            return e;
        });

        ClientEvent saved = service.record(ClientEventRecordCommand.builder()
                .tenantId(TENANT_A)
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.MAPPING_REASSIGNED)
                .occurredAt(LocalDateTime.of(2026, 11, 3, 8, 30))
                .source(ClientEventSource.SCREEN)
                .actorUserId(1L)
                .actorRole("ADMIN")
                .mappingId(200L)
                .sessionsRemainingBefore(5)
                .sessionsRemainingAfter(5)
                .build());

        assertThat(saved.getId()).isEqualTo(11L);
        ArgumentCaptor<ClientEvent> captor = ArgumentCaptor.forClass(ClientEvent.class);
        verify(clientEventRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo(ClientEventType.MAPPING_REASSIGNED);
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_A);
    }

    @Test
    @DisplayName("record 시 tenantId 누락이면 예외")
    void record_requiresTenantId() {
        assertThatThrownBy(() -> service.record(ClientEventRecordCommand.builder()
                .clientId(CLIENT_ID)
                .eventType(ClientEventType.SCHEDULE_CREATED)
                .occurredAt(LocalDateTime.now())
                .source(ClientEventSource.API)
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
        verify(clientEventRepository, never()).save(any());
    }
}
