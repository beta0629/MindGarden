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
import com.coresolution.consultation.util.ConsultationLogTimelineSort;
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
    @DisplayName("내담자 선택의 상담 수·첫·최근 일은 페이지 행이 아니라 기간 집계이고 기본은 최근 순이다")
    void clientModeSummaryUsesPeriodAggregateAndRecentOrder() {
        Long clientId = 10L;
        Pageable pageable = PageRequest.of(0, 2);
        when(consultationRecordRepository.aggregateConsultationLogByClient(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(aggregate(clientId, 9L,
                        LocalDate.of(2026, 8, 13), LocalDate.of(2026, 10, 8))));
        when(consultationRecordRepository.findConsultationLogSortKeys(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(
                        key(1L, clientId, 7L, 1, LocalDate.of(2026, 8, 13)),
                        key(2L, clientId, 7L, 2, LocalDate.of(2026, 8, 20)),
                        key(3L, clientId, 8L, 9, LocalDate.of(2026, 10, 8))));
        when(consultationRecordRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyList()))
                .thenAnswer(invocation -> {
                    List<Long> ids = invocation.getArgument(1);
                    return ids.stream().map(id -> record(id, clientId)).toList();
                });

        ConsultationLogGroupedPage grouped = service.getGroupedConsultationLogPage(
                null, clientId, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 31),
                null, null, null, pageable, null);

        assertThat(grouped.getPage().getContent()).extracting(ConsultationRecord::getId).containsExactly(3L, 2L);
        assertThat(grouped.getPage().getTotalElements()).isEqualTo(3);
        assertThat(grouped.getSummary().getMode()).isEqualTo("CLIENT");
        assertThat(grouped.getSummary().getSessionCount()).isEqualTo(9L);
        assertThat(grouped.getSummary().getFirstSessionDate()).isEqualTo(LocalDate.of(2026, 8, 13));
        assertThat(grouped.getSummary().getLastSessionDate()).isEqualTo(LocalDate.of(2026, 10, 8));
        assertThat(grouped.getBoundary().getSort()).isEqualTo("RECENT");
        assertThat(grouped.getBoundary().getPrecedingConsultantId()).isNull();
        verify(consultationRecordRepository).findConsultationLogSortKeys(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList());
    }

    @Test
    @DisplayName("30회기 최근 순 2쪽은 직전 상담사가 같고 회기 순으로 바꾸면 번호가 뒤집힌다")
    void thirtySessionsPageBoundaryFollowsTimelineSort() {
        Long clientId = 40L;
        when(consultationRecordRepository.aggregateConsultationLogByClient(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(List.of(aggregate(clientId, 30L,
                        LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 30))));
        when(consultationRecordRepository.findConsultationLogSortKeys(
                eq(TENANT_ID), nullable(Long.class), eq(clientId), nullable(LocalDate.class),
                nullable(LocalDate.class), nullable(Boolean.class), anyBoolean(), anyString(), anyList()))
                .thenReturn(thirtyKeys(clientId));
        when(consultationRecordRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyList()))
                .thenAnswer(invocation -> {
                    List<Long> ids = invocation.getArgument(1);
                    return ids.stream().map(id -> record(id, clientId)).toList();
                });
        when(consultationRecordPersonNameResolver.resolveDisplayNames(eq(TENANT_ID), any()))
                .thenReturn(java.util.Map.of(7L, "박지안"));

        ConsultationLogGroupedPage recent = service.getGroupedConsultationLogPage(
                null, clientId, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 10, 31),
                null, null, null, PageRequest.of(1, 10), ConsultationLogTimelineSort.RECENT);

        assertThat(recent.getPage().getTotalElements()).isEqualTo(30);
        assertThat(recent.getPage().getContent()).extracting(ConsultationRecord::getId)
                .containsExactly(20L, 19L, 18L, 17L, 16L, 15L, 14L, 13L, 12L, 11L);
        assertThat(recent.getBoundary().getSort()).isEqualTo("RECENT");
        assertThat(recent.getBoundary().getPrecedingConsultantId()).isEqualTo(7L);
        assertThat(recent.getBoundary().getPrecedingConsultantName()).isEqualTo("박지안");
        assertThat(recent.getSummary().getSessionCount()).isEqualTo(30L);

        ConsultationLogGroupedPage sessionOrder = service.getGroupedConsultationLogPage(
                null, clientId, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 10, 31),
                null, null, null, PageRequest.of(0, 10), ConsultationLogTimelineSort.SESSION);
        assertThat(sessionOrder.getPage().getContent()).extracting(ConsultationRecord::getId)
                .containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
        assertThat(sessionOrder.getBoundary().getPrecedingConsultantId()).isNull();
        assertThat(sessionOrder.getBoundary().getSort()).isEqualTo("SESSION");
    }

    @Test
    @DisplayName("상담사 선택은 최근 상담일 순 묶음이고 묶음 안도 최근 순이며 머리 건수는 기간 집계다")
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
                        key(101L, 20L, 7L, 2, LocalDate.of(2026, 10, 1)),
                        key(100L, 20L, 7L, 1, LocalDate.of(2026, 9, 22)),
                        key(201L, 10L, 7L, 2, LocalDate.of(2026, 10, 8)),
                        key(200L, 10L, 7L, 1, LocalDate.of(2026, 8, 13))));
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
                null, null, null, pageable, ConsultationLogTimelineSort.SESSION);

        assertThat(grouped.getPage().getContent()).extracting(ConsultationRecord::getId)
                .containsExactly(201L, 200L, 101L, 100L);
        assertThat(grouped.getBoundary().getSort()).isEqualTo("RECENT");
        assertThat(grouped.getSummary().getMode()).isEqualTo("COUNSELOR");
        assertThat(grouped.getSummary().getSessionCount()).isNull();
        assertThat(grouped.getSummary().getClients()).extracting(period -> period.getClientId())
                .containsExactly(10L, 20L);
        assertThat(grouped.getSummary().getClients().get(0).getSessionCount()).isEqualTo(9L);
        assertThat(grouped.getSummary().getClients().get(1).getSessionCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("상담사 선택 2쪽은 앞 내담자의 남은 최근 회차 다음에 다음 내담자가 온다")
    void counselorModeSecondPageContinuesRecentWithinGroup() {
        Pageable pageable = PageRequest.of(1, 2);
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
                        key(199L, 10L, 7L, 1, LocalDate.of(2026, 9, 10)),
                        key(101L, 20L, 7L, 2, LocalDate.of(2026, 10, 6)),
                        key(201L, 10L, 7L, 3, LocalDate.of(2026, 10, 8)),
                        key(200L, 10L, 7L, 2, LocalDate.of(2026, 10, 1)),
                        key(100L, 20L, 7L, 1, LocalDate.of(2026, 9, 22))));
        when(consultationRecordPersonNameResolver.resolveDisplayNames(eq(TENANT_ID), any()))
                .thenReturn(Map.of(10L, "한서윤", 20L, "오세아", 7L, "박지안"));
        when(consultationRecordRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyList()))
                .thenAnswer(invocation -> {
                    List<Long> ids = invocation.getArgument(1);
                    return ids.stream().map(id -> record(id, id >= 199L ? 10L : 20L)).toList();
                });

        ConsultationLogGroupedPage grouped = service.getGroupedConsultationLogPage(
                7L, null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 10, 31),
                null, null, null, pageable, ConsultationLogTimelineSort.SESSION);

        assertThat(grouped.getPage().getTotalElements()).isEqualTo(5);
        assertThat(grouped.getPage().getContent()).extracting(ConsultationRecord::getId)
                .containsExactly(199L, 101L);
        assertThat(grouped.getBoundary().getSort()).isEqualTo("RECENT");
        assertThat(grouped.getBoundary().getPrecedingClientId()).isEqualTo(10L);
        assertThat(grouped.getBoundary().getPrecedingConsultantId()).isEqualTo(7L);
        assertThat(grouped.getBoundary().getPrecedingConsultantName()).isEqualTo("박지안");
        assertThat(grouped.getSummary().getClients()).extracting(period -> period.getClientId())
                .containsExactly(10L, 20L);
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

    private static List<ConsultationLogSortKey> thirtyKeys(Long clientId) {
        List<ConsultationLogSortKey> keys = new java.util.ArrayList<>();
        for (int session = 1; session <= 30; session++) {
            Long consultantId = session >= 25 ? 8L : 7L;
            keys.add(key((long) session, clientId, consultantId, session, LocalDate.of(2026, 3, session)));
        }
        return keys;
    }

    private static ConsultationLogSortKey key(Long id, Long clientId, Long consultantId, Integer sessionNumber,
            LocalDate sessionDate) {
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
            public Long getConsultantId() {
                return consultantId;
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
