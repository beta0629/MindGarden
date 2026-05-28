package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.PendingPaymentCleanupResult;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingPage;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 옵션 B R4 — AdminMappingCleanupServiceImpl 단위 테스트.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 *
 * <p>매트릭스:
 * <ul>
 *   <li>정리 정상 — PENDING_PAYMENT 매핑이 TERMINATED 로 전이 + termination_reason / terminatedBy 기록</li>
 *   <li>상태 검증 — PENDING_PAYMENT 외 상태는 IllegalStateException</li>
 *   <li>스케줄 연쇄 취소 — TENTATIVE_PENDING_PAYMENT 등 가예약을 CANCELLED 로 일괄 전이</li>
 *   <li>notify 발송 — notifyClient=true 면 NotificationService.sendConsultationCancelled 호출</li>
 *   <li>격리 실패 — tenantId 미설정 시 IllegalStateException</li>
 *   <li>audit 기록 — notes 컬럼에 R4 정리 사유 라인 누적</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMappingCleanupServiceImpl (R4 PENDING_PAYMENT 매핑 어드민 수동 정리)")
class AdminMappingCleanupServiceTest {

    private static final String TEST_TENANT_ID = "tenant-r4-" + UUID.randomUUID();
    private static final Long MAPPING_ID = 7001L;
    private static final String CLEANUP_REASON = "결제 미입금 24h 경과 정리합니다";
    private static final String ACTOR = "admin@test";

    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private NotificationService notificationService;

    private final PlatformTransactionManager noopTransactionManager = new AbstractPlatformTransactionManager() {
        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    };

    private AdminMappingCleanupServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminMappingCleanupServiceImpl(
                mappingRepository, scheduleRepository, notificationService, noopTransactionManager);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("정리 정상 — PENDING_PAYMENT 매핑이 TERMINATED로 전이되고 사유·종료자가 기록된다")
    void cleanupPendingPaymentMapping_happyPath_terminatesMapping() {
        ConsultantClientMapping mapping = newPendingPaymentMapping(MAPPING_ID);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                eq(TEST_TENANT_ID), eq(MAPPING_ID), any(Collection.class)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        PendingPaymentCleanupResult result = service.cleanupPendingPaymentMapping(
                MAPPING_ID, CLEANUP_REASON, Boolean.FALSE, ACTOR);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        ConsultantClientMapping saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(saved.getTerminationReason()).contains(CLEANUP_REASON);
        assertThat(saved.getTerminatedBy()).isEqualTo(ACTOR);
        assertThat(saved.getTerminatedAt()).isNotNull();
        assertThat(saved.getEndDate()).isNotNull();
        assertThat(saved.getNotes()).contains("R4 어드민 수동 정리").contains(ACTOR);

        assertThat(result.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(result.getCancelledScheduleCount()).isZero();
        assertThat(result.getNotifiedClientCount()).isZero();
    }

    @Test
    @DisplayName("상태 검증 — PENDING_PAYMENT 외 상태는 IllegalStateException")
    void cleanupPendingPaymentMapping_invalidStatus_throws() {
        ConsultantClientMapping mapping = newPendingPaymentMapping(MAPPING_ID);
        mapping.setStatus(MappingStatus.ACTIVE);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));

        assertThatThrownBy(() -> service.cleanupPendingPaymentMapping(MAPPING_ID, CLEANUP_REASON, true, ACTOR))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING_PAYMENT");
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("스케줄 연쇄 취소 — TENTATIVE 가예약/BOOKED/CONFIRMED 일정을 CANCELLED로 전환한다")
    void cleanupPendingPaymentMapping_cancelsAssociatedSchedules() {
        ConsultantClientMapping mapping = newPendingPaymentMapping(MAPPING_ID);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));

        Schedule tentative = new Schedule();
        tentative.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        Schedule booked = new Schedule();
        booked.setStatus(ScheduleStatus.BOOKED);
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                eq(TEST_TENANT_ID), eq(MAPPING_ID), any(Collection.class)))
                .thenReturn(Arrays.asList(tentative, booked));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        PendingPaymentCleanupResult result = service.cleanupPendingPaymentMapping(
                MAPPING_ID, CLEANUP_REASON, false, ACTOR);

        assertThat(tentative.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(result.getCancelledScheduleCount()).isEqualTo(2);
        verify(scheduleRepository, times(2)).save(any(Schedule.class));
    }

    @Test
    @DisplayName("notify 발송 — notifyClient=true 면 NotificationService.sendConsultationCancelled 호출")
    void cleanupPendingPaymentMapping_notifiesClientWhenRequested() {
        ConsultantClientMapping mapping = newPendingPaymentMapping(MAPPING_ID);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                eq(TEST_TENANT_ID), eq(MAPPING_ID), any(Collection.class)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notificationService.sendConsultationCancelled(any(User.class), anyString(), anyString()))
                .thenReturn(true);

        PendingPaymentCleanupResult result = service.cleanupPendingPaymentMapping(
                MAPPING_ID, CLEANUP_REASON, Boolean.TRUE, ACTOR);

        verify(notificationService, times(1))
                .sendConsultationCancelled(any(User.class), anyString(), anyString());
        assertThat(result.getNotifiedClientCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("격리 실패 — tenantId 미설정 시 IllegalStateException")
    void cleanupPendingPaymentMapping_missingTenant_throws() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> service.cleanupPendingPaymentMapping(MAPPING_ID, CLEANUP_REASON, true, ACTOR))
                .isInstanceOf(IllegalStateException.class);
        verify(mappingRepository, never()).findByTenantIdAndId(anyString(), anyLong());
    }

    @Test
    @DisplayName("audit 기록 — notes 컬럼에 R4 정리 사유 라인이 누적된다")
    void cleanupPendingPaymentMapping_appendsAuditNote() {
        ConsultantClientMapping mapping = newPendingPaymentMapping(MAPPING_ID);
        mapping.setNotes("기존 메모");
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                eq(TEST_TENANT_ID), eq(MAPPING_ID), any(Collection.class)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        service.cleanupPendingPaymentMapping(MAPPING_ID, CLEANUP_REASON, false, ACTOR);

        ArgumentCaptor<ConsultantClientMapping> captor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(captor.capture());
        assertThat(captor.getValue().getNotes()).startsWith("기존 메모\n").contains("R4 어드민 수동 정리");
    }

    @Test
    @DisplayName("조회 0건 — 페이지가 비어있다")
    void getDirtyPendingPaymentMappings_emptyPage() {
        when(mappingRepository.findDirtyPendingPaymentMappings(eq(TEST_TENANT_ID), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        PendingPaymentDirtyMappingPage page = service.getDirtyPendingPaymentMappings(24L, 0, 20);

        assertThat(page.getItems()).isEmpty();
        assertThat(page.getTotalElements()).isZero();
        assertThat(page.getAgeHours()).isEqualTo(24L);
    }

    @Test
    @DisplayName("조회 N건 — 항목이 createdAt 오름차순으로 채워진다")
    void getDirtyPendingPaymentMappings_populatesItems() {
        ConsultantClientMapping m1 = newPendingPaymentMapping(10L);
        ConsultantClientMapping m2 = newPendingPaymentMapping(11L);
        Page<ConsultantClientMapping> page =
                new PageImpl<>(Arrays.asList(m1, m2));
        when(mappingRepository.findDirtyPendingPaymentMappings(eq(TEST_TENANT_ID), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(page);

        PendingPaymentDirtyMappingPage result = service.getDirtyPendingPaymentMappings(48L, 0, 10);

        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getItems()).extracting("mappingId").containsExactly(10L, 11L);
        assertThat(result.getAgeHours()).isEqualTo(48L);
    }

    @Test
    @DisplayName("일괄 정리 — 50건 상한 초과 시 IllegalArgumentException")
    void bulkCleanup_overLimit_throws() {
        List<Long> tooMany = java.util.stream.LongStream.rangeClosed(1, 51).boxed().toList();

        assertThatThrownBy(() -> service.bulkCleanupPendingPaymentMappings(tooMany, CLEANUP_REASON, true, ACTOR))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("최대 50");
    }

    @Test
    @DisplayName("일괄 정리 — 일부 실패 시 successMappingIds / failedMappingIds 분리")
    void bulkCleanup_partialFailure_segmentsResults() {
        ConsultantClientMapping ok = newPendingPaymentMapping(100L);
        ConsultantClientMapping wrongState = newPendingPaymentMapping(101L);
        wrongState.setStatus(MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(100L)))
                .thenReturn(Optional.of(ok));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(101L)))
                .thenReturn(Optional.of(wrongState));
        when(scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                eq(TEST_TENANT_ID), eq(100L), any(Collection.class)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        PendingPaymentCleanupResult result = service.bulkCleanupPendingPaymentMappings(
                Arrays.asList(100L, 101L), CLEANUP_REASON, false, ACTOR);

        assertThat(result.getSuccessMappingIds()).containsExactly(100L);
        assertThat(result.getFailedMappingIds()).containsExactly(101L);
    }

    private ConsultantClientMapping newPendingPaymentMapping(Long id) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setTotalSessions(1);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        mapping.setStartDate(LocalDateTime.now().minusDays(2));
        mapping.setCreatedAt(LocalDateTime.now().minusDays(2));
        User consultant = new User();
        consultant.setId(201L);
        consultant.setName("상담사A");
        User client = new User();
        client.setId(301L);
        client.setName("내담자A");
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        return mapping;
    }
}
