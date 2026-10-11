package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.dto.ConsultationLogGroupedPage;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.repository.ConsultationLogClientAggregate;
import com.coresolution.consultation.repository.ConsultationLogSortKey;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.service.ConsultationRecordPersonNameResolver;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * 관리자 상담일지 묶음 페이지의 기간 집계.
 * 건수는 현재 페이지 행 수가 아니다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("상담일지 묶음 페이지 기간 집계")
class ConsultationRecordServiceImplGroupedLogPageTest {

    private static final String TENANT_ID = "grouped-log-tenant";

    @Mock
    private ConsultationRecordRepository consultationRecordRepository;

    @Mock
    private ConsultationRecordPersonNameResolver consultationRecordPersonNameResolver;

    @InjectMocks
    private ConsultationRecordServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("내담자 선택의 상담 수·첫·최근 일은 페이지 행이 아니라 기간 집계다")
    void clientModeSummaryUsesPeriodAggregate() {
        Long clientId = 10L;
        Pageable pageable = PageRequest.of(0, 2);
        when(consultationRecordRepository.aggregateConsultationLogByClient(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(aggregate(clientId, 9L,
                        LocalDate.of(2026, 8, 13), LocalDate.of(2026, 10, 8))));
        when(consultationRecordRepository.findForConsultationLogViewBySessionAsc(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList(),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(record(1L, clientId), record(2L, clientId)), pageable, 9));

        ConsultationLogGroupedPage grouped = service.getGroupedConsultationLogPage(
                null, clientId, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 31),
                null, null, null, pageable);

        assertThat(grouped.getPage().getContent()).hasSize(2);
        assertThat(grouped.getPage().getTotalElements()).isEqualTo(9);
        assertThat(grouped.getSummary().getMode()).isEqualTo("CLIENT");
        assertThat(grouped.getSummary().getSessionCount()).isEqualTo(9L);
        assertThat(grouped.getSummary().getFirstSessionDate()).isEqualTo(LocalDate.of(2026, 8, 13));
        assertThat(grouped.getSummary().getLastSessionDate()).isEqualTo(LocalDate.of(2026, 10, 8));
        verify(consultationRecordRepository).findForConsultationLogViewBySessionAsc(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList(),
                any(Pageable.class));
    }

    @Test
    @DisplayName("상담사 선택은 기간 최근일·이름 순으로 페이지를 자르고 머리 건수는 기간 집계다")
    void counselorModePagesInGroupOrderAndKeepsPeriodCounts() {
        Pageable pageable = PageRequest.of(0, 10);
        when(consultationRecordRepository.aggregateConsultationLogByClient(
                eq(TENANT_ID), eq(7L), nullable(Long.class), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(
                        aggregate(10L, 9L, LocalDate.of(2026, 8, 13), LocalDate.of(2026, 10, 8)),
                        aggregate(20L, 3L, LocalDate.of(2026, 9, 22), LocalDate.of(2026, 10, 6))));
        when(consultationRecordRepository.findConsultationLogSortKeys(
                eq(TENANT_ID), eq(7L), nullable(Long.class), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(
                        key(101L, 20L, 2, LocalDate.of(2026, 10, 1)),
                        key(100L, 20L, 1, LocalDate.of(2026, 9, 22)),
                        key(201L, 10L, 2, LocalDate.of(2026, 10, 8)),
                        key(200L, 10L, 1, LocalDate.of(2026, 8, 13))));
        when(consultationRecordPersonNameResolver.resolveDisplayNames(eq(TENANT_ID), any()))
                .thenReturn(Map.of(10L, "한서윤", 20L, "오세아"));
        when(consultationRecordRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyList()))
                .thenReturn(List.of(
                        record(201L, 10L),
                        record(200L, 10L),
                        record(101L, 20L),
                        record(100L, 20L)));

        ConsultationLogGroupedPage grouped = service.getGroupedConsultationLogPage(
                7L, null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 31),
                null, null, null, pageable);

        assertThat(grouped.getPage().getContent()).extracting(ConsultationRecord::getId)
                .containsExactly(200L, 201L, 100L, 101L);
        assertThat(grouped.getSummary().getMode()).isEqualTo("COUNSELOR");
        assertThat(grouped.getSummary().getSessionCount()).isNull();
        assertThat(grouped.getSummary().getClients()).extracting(period -> period.getClientId())
                .containsExactly(10L, 20L);
        assertThat(grouped.getSummary().getClients().get(0).getSessionCount()).isEqualTo(9L);
        assertThat(grouped.getSummary().getClients().get(1).getSessionCount()).isEqualTo(3L);
    }

    private static ConsultationRecord record(Long id, Long clientId) {
        ConsultationRecord record = new ConsultationRecord();
        record.setId(id);
        record.setClientId(clientId);
        record.setConsultantId(7L);
        record.setSessionDate(LocalDate.of(2026, 10, 1));
        return record;
    }

    private static ConsultationLogClientAggregate aggregate(Long clientId, long count, LocalDate first, LocalDate last) {
        return new ConsultationLogClientAggregate() {
            @Override
            public Long getClientId() {
                return clientId;
            }

            @Override
            public Long getSessionCount() {
                return count;
            }

            @Override
            public LocalDate getFirstSessionDate() {
                return first;
            }

            @Override
            public LocalDate getLastSessionDate() {
                return last;
            }
        };
    }

    private static ConsultationLogSortKey key(Long id, Long clientId, Integer sessionNumber, LocalDate sessionDate) {
        return new ConsultationLogSortKey() {
            @Override
            public Long getId() {
                return id;
            }

            @Override
            public Long getClientId() {
                return clientId;
            }

            @Override
            public Integer getSessionNumber() {
                return sessionNumber;
            }

            @Override
            public LocalDate getSessionDate() {
                return sessionDate;
            }
        };
    }
}
