package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.Collections;

import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.core.context.TenantContext;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ConsultationRecordServiceImpl — P0 핫픽스 (2026-05-29) 단위 테스트.
 *
 * <p>{@code getConsultationRecords(consultantId, clientId, startDate, endDate, pageable)}
 * 가 입력 조합에 따라 올바른 Repository 메서드를 호출하는지 검증한다. 5 시나리오:
 * <ol>
 *   <li>모든 필터 null — 기존 전체 조회 Repository 메서드</li>
 *   <li>consultantId 만 — Consultant 단독 Repository</li>
 *   <li>clientId 만 — Client 단독 Repository</li>
 *   <li>startDate/endDate 만 — Tenant + sessionDate BETWEEN Repository</li>
 *   <li>consultantId + clientId + 기간 — 4-인자 BETWEEN Repository</li>
 * </ol>
 *
 * <p>모든 시나리오에서 {@code tenantId} 격리(TenantContextHolder)가 보존됨을 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRecordServiceImpl — 기간 필터 라우팅 (P0 핫픽스 2026-05-29)")
class ConsultationRecordServiceImplDateRangeTest {

    private static final String TENANT_ID = "tenant-test-date-range";
    private static final Pageable PAGEABLE = PageRequest.of(0, 100);
    private static final LocalDate START = LocalDate.of(2026, 4, 1);
    private static final LocalDate END = LocalDate.of(2026, 4, 30);

    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private ConsultationRepository consultationRepository;
    @Mock private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    @Mock private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ConsultationRecordServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("모든 필터 null — 전체 조회 Repository 호출 (기존 동작)")
    void noFilters_callsTenantOnlyRepository() {
        when(consultationRecordRepository
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(eq(TENANT_ID), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        service.getConsultationRecords(null, null, null, null, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(TENANT_ID, PAGEABLE);
        verify(consultationRecordRepository, never())
                .findByTenantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        any(), any(), any(), any());
    }

    @Test
    @DisplayName("consultantId 만 — Consultant 단독 Repository 호출")
    void consultantOnly_callsConsultantRepository() {
        Long consultantId = 10L;
        when(consultationRecordRepository
                .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TENANT_ID), eq(consultantId), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        service.getConsultationRecords(consultantId, null, null, null, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        TENANT_ID, consultantId, PAGEABLE);
    }

    @Test
    @DisplayName("clientId 만 — Client 단독 Repository 호출")
    void clientOnly_callsClientRepository() {
        Long clientId = 20L;
        when(consultationRecordRepository
                .findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TENANT_ID), eq(clientId), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        service.getConsultationRecords(null, clientId, null, null, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
                        TENANT_ID, clientId, PAGEABLE);
    }

    @Test
    @DisplayName("startDate/endDate 만 — Tenant + sessionDate BETWEEN Repository 호출 (4월 데이터 노출)")
    void dateRangeOnly_callsBetweenRepository() {
        when(consultationRecordRepository
                .findByTenantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TENANT_ID), eq(START), eq(END), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        service.getConsultationRecords(null, null, START, END, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        TENANT_ID, START, END, PAGEABLE);
        verify(consultationRecordRepository, never())
                .findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(any(), any());
    }

    @Test
    @DisplayName("consultantId + clientId + 기간 — 4-인자 BETWEEN Repository 호출")
    void fullFilters_callsFourArgBetweenRepository() {
        Long consultantId = 30L;
        Long clientId = 40L;
        when(consultationRecordRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TENANT_ID), eq(consultantId), eq(clientId), eq(START), eq(END), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.<ConsultationRecord>emptyList()));

        service.getConsultationRecords(consultantId, clientId, START, END, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndConsultantIdAndClientIdAndSessionDateBetweenAndIsDeletedFalseOrderBySessionDateDesc(
                        TENANT_ID, consultantId, clientId, START, END, PAGEABLE);
    }

    @Test
    @DisplayName("backward compatibility — 기존 3-인자 메서드는 5-인자 메서드로 위임")
    void legacyMethod_delegatesToNewMethod() {
        Long consultantId = 50L;
        when(consultationRecordRepository
                .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        eq(TENANT_ID), eq(consultantId), eq(PAGEABLE)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        service.getConsultationRecords(consultantId, null, PAGEABLE);

        verify(consultationRecordRepository)
                .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
                        TENANT_ID, consultantId, PAGEABLE);
    }
}
