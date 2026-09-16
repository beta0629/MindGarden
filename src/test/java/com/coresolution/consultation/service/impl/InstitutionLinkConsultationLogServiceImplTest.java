package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 타기관 일지는 rem=0·회차 null 이어도 저장되고, 완료 시 매핑 remaining 을 건드리지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InstitutionLinkConsultationLogServiceImpl")
class InstitutionLinkConsultationLogServiceImplTest {

    private static final String TENANT_ID = "tenant-institution-link-1";
    private static final long MAPPING_ID = 8801L;
    private static final long CONTRACT_ID = 41L;

    @Mock
    private InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ScheduleService scheduleService;

    @InjectMocks
    private InstitutionLinkConsultationLogServiceImpl service;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("타기관 매핑 rem=0·회차 null 이어도 새 로그 테이블에 저장된다")
    void create_institutionMappingWithRemainingZero_savesWithoutSessionSequence() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        mapping.setRemainingSessions(0);
        when(consultantClientMappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(institutionLinkContractRepository.findByTenantIdAndSourceMappingId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.empty());
        when(institutionLinkConsultationLogRepository
                .countByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalse(
                        eq(TENANT_ID), eq(MAPPING_ID), eq("2026-09")))
                .thenReturn(2L);
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkConsultationLog entity = invocation.getArgument(0);
                    entity.setId(88L);
                    return entity;
                });

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(500L)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .clientCondition("월결제 타기관 상담")
                .isSessionCompleted(false)
                .build();

        InstitutionLinkConsultationLogResponse saved = service.create(TENANT_ID, request);

        ArgumentCaptor<InstitutionLinkConsultationLog> captor =
                ArgumentCaptor.forClass(InstitutionLinkConsultationLog.class);
        verify(institutionLinkConsultationLogRepository).save(captor.capture());
        InstitutionLinkConsultationLog persisted = captor.getValue();
        assertThat(persisted.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(persisted.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(persisted.getBillingYearMonth()).isEqualTo("2026-09");
        assertThat(persisted.getMonthlyOccurrence()).isEqualTo(3);
        assertThat(persisted.getClientCondition()).isEqualTo("월결제 타기관 상담");
        assertThat(fieldNames(InstitutionLinkConsultationLog.class))
                .doesNotContain("remainingSessions", "usedSessions", "totalSessions", "sessionSequence");
        assertThat(saved.getId()).isEqualTo(88L);
        verify(consultantClientMappingRepository, never()).save(any());
        verify(scheduleService, never()).markCompletedAfterConsultationLogIfOpen(any(), any());
    }

    @Test
    @DisplayName("회기권 ADVANCE 매핑은 타기관 일지 경로에서 거부된다")
    void create_rejectsAdvanceMappingWithoutContract() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setPaymentTiming(PaymentTimingConstants.ADVANCE);
        mapping.setRemainingSessions(0);
        when(consultantClientMappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(eq(TENANT_ID), eq(9L)))
                .thenReturn(Optional.empty());

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .mappingId(MAPPING_ID)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .build();

        assertThatThrownBy(() -> service.create(TENANT_ID, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("회기권 매핑은 타기관 상담일지 경로를 사용할 수 없습니다.");
        verify(institutionLinkConsultationLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("타기관 내담자 + SAME_DAY 오배정 매핑이어도 sessionNumber null 로 저장된다")
    void create_institutionClientWithMisassignedSameDayMapping_saves() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);
        mapping.setRemainingSessions(0);
        when(consultantClientMappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        Client client = new Client();
        client.setId(9L);
        client.setEngagementType(ClientEngagementTypeConstants.INSTITUTION_LINK);
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(eq(TENANT_ID), eq(9L)))
                .thenReturn(Optional.of(client));
        when(institutionLinkContractRepository.findByTenantIdAndSourceMappingId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.empty());
        when(institutionLinkConsultationLogRepository
                .countByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalse(
                        eq(TENANT_ID), eq(MAPPING_ID), eq("2026-09")))
                .thenReturn(0L);
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkConsultationLog entity = invocation.getArgument(0);
                    entity.setId(99L);
                    return entity;
                });

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(436L)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .clientCondition("오배정 보정 저장")
                .build();

        InstitutionLinkConsultationLogResponse saved = service.create(TENANT_ID, request);

        assertThat(saved.getId()).isEqualTo(99L);
        verify(consultantClientMappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("완료는 로그 테이블만 갱신하고 매핑을 저장하지 않으며 스케줄 COMPLETED 승격을 요청한다")
    void complete_doesNotSaveMapping() {
        TenantContextHolder.setTenantId(TENANT_ID);
        InstitutionLinkConsultationLog existing = InstitutionLinkConsultationLog.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(436L)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .billingYearMonth("2026-09")
                .monthlyOccurrence(1)
                .isSessionCompleted(false)
                .build();
        existing.setId(88L);
        existing.setTenantId(TENANT_ID);
        when(institutionLinkConsultationLogRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_ID), eq(88L)))
                .thenReturn(Optional.of(existing));
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InstitutionLinkConsultationLogResponse saved = service.complete(88L);

        assertThat(saved.getIsSessionCompleted()).isTrue();
        assertThat(saved.getCompletedAt()).isNotNull();
        verifyNoInteractions(consultantClientMappingRepository);
        verify(scheduleService).markCompletedAfterConsultationLogIfOpen(eq(TENANT_ID), eq(436L));
    }

    @Test
    @DisplayName("isSessionCompleted=true 저장 시 스케줄 COMPLETED 승격을 요청한다")
    void create_sessionCompleted_promotesSchedule() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        mapping.setRemainingSessions(0);
        when(consultantClientMappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(institutionLinkContractRepository.findByTenantIdAndSourceMappingId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.empty());
        when(institutionLinkConsultationLogRepository
                .countByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalse(
                        eq(TENANT_ID), eq(MAPPING_ID), eq("2026-09")))
                .thenReturn(0L);
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkConsultationLog entity = invocation.getArgument(0);
                    entity.setId(101L);
                    return entity;
                });

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(436L)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .isSessionCompleted(true)
                .build();

        service.create(TENANT_ID, request);

        verify(scheduleService).markCompletedAfterConsultationLogIfOpen(eq(TENANT_ID), eq(436L));
    }

    @Test
    @DisplayName("tenantId 없으면 일지를 저장하지 않는다")
    void create_requiresTenantId() {
        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .mappingId(MAPPING_ID)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .build();

        assertThatThrownBy(() -> service.create(null, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("tenantId는 필수입니다.");
        verifyNoInteractions(institutionLinkConsultationLogRepository);
        verifyNoInteractions(consultantClientMappingRepository);
        verifyNoInteractions(institutionLinkContractRepository);
    }

    @Test
    @DisplayName("계약 경로도 remainingSessions 없이 저장된다")
    void create_contractPath_doesNotRequireRemainingSessions() {
        InstitutionLinkContract contract = InstitutionLinkContract.builder()
                .consultantId(7L)
                .clientId(9L)
                .periodStart(LocalDate.of(2026, 9, 1))
                .status("ACTIVE")
                .build();
        contract.setId(CONTRACT_ID);
        contract.setTenantId(TENANT_ID);
        when(institutionLinkContractRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_ID), eq(CONTRACT_ID)))
                .thenReturn(Optional.of(contract));
        when(institutionLinkConsultationLogRepository
                .countByTenantIdAndContractIdAndBillingYearMonthAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONTRACT_ID), eq("2026-09")))
                .thenReturn(0L);
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> {
                    InstitutionLinkConsultationLog entity = invocation.getArgument(0);
                    entity.setId(89L);
                    return entity;
                });

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .contractId(CONTRACT_ID)
                .clientId(9L)
                .consultantId(7L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .build();

        InstitutionLinkConsultationLogResponse saved = service.create(TENANT_ID, request);

        assertThat(saved.getId()).isEqualTo(89L);
        assertThat(saved.getContractId()).isEqualTo(CONTRACT_ID);
        assertThat(saved.getMonthlyOccurrence()).isEqualTo(1);
        verify(consultantClientMappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("스케줄 ID 로 최신 타기관 일지를 조회하고 본문 필드를 반환한다")
    void findLatestBySchedule_returnsBodyFields() {
        TenantContextHolder.setTenantId(TENANT_ID);
        InstitutionLinkConsultationLog existing = InstitutionLinkConsultationLog.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(436L)
                .clientId(78L)
                .consultantId(3L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .billingYearMonth("2026-09")
                .monthlyOccurrence(1)
                .clientCondition("상태A")
                .mainIssues("이슈B")
                .interventionMethods("개입C")
                .clientResponse("반응D")
                .progressEvaluation("평가E")
                .homeworkAssigned("숙제")
                .consultantObservations("관찰")
                .consultantAssessment("사정")
                .specialConsiderations("주의")
                .isSessionCompleted(true)
                .build();
        existing.setId(2L);
        existing.setTenantId(TENANT_ID);
        when(institutionLinkConsultationLogRepository
                .findFirstByTenantIdAndScheduleIdAndIsDeletedFalseOrderByIdDesc(eq(TENANT_ID), eq(436L)))
                .thenReturn(Optional.of(existing));

        Optional<InstitutionLinkConsultationLogResponse> found =
                service.findLatestByScheduleOrMapping(436L, MAPPING_ID);

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(2L);
        assertThat(found.get().getClientCondition()).isEqualTo("상태A");
        assertThat(found.get().getMainIssues()).isEqualTo("이슈B");
        assertThat(found.get().getInterventionMethods()).isEqualTo("개입C");
        assertThat(found.get().getClientResponse()).isEqualTo("반응D");
        assertThat(found.get().getProgressEvaluation()).isEqualTo("평가E");
        assertThat(found.get().getHomeworkAssigned()).isEqualTo("숙제");
        assertThat(found.get().getConsultantObservations()).isEqualTo("관찰");
        assertThat(found.get().getConsultantAssessment()).isEqualTo("사정");
        assertThat(found.get().getSpecialConsiderations()).isEqualTo("주의");
        verify(institutionLinkConsultationLogRepository, never())
                .findFirstByTenantIdAndMappingIdAndIsDeletedFalseOrderByIdDesc(any(), any());
    }

    @Test
    @DisplayName("타기관 일지 수정은 본문만 갱신하고 매핑 remaining 을 건드리지 않는다")
    void update_updatesBodyWithoutTouchingMapping() {
        TenantContextHolder.setTenantId(TENANT_ID);
        InstitutionLinkConsultationLog existing = InstitutionLinkConsultationLog.builder()
                .mappingId(MAPPING_ID)
                .scheduleId(436L)
                .clientId(78L)
                .consultantId(3L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .billingYearMonth("2026-09")
                .monthlyOccurrence(1)
                .clientCondition("old")
                .isSessionCompleted(false)
                .build();
        existing.setId(2L);
        existing.setTenantId(TENANT_ID);
        when(institutionLinkConsultationLogRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_ID), eq(2L)))
                .thenReturn(Optional.of(existing));
        when(institutionLinkConsultationLogRepository.save(any(InstitutionLinkConsultationLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        InstitutionLinkConsultationLogCreateRequest request = InstitutionLinkConsultationLogCreateRequest.builder()
                .clientId(78L)
                .consultantId(3L)
                .sessionDate(LocalDate.of(2026, 9, 14))
                .clientCondition("수정본")
                .mainIssues("이슈수정")
                .isSessionCompleted(true)
                .build();

        InstitutionLinkConsultationLogResponse saved = service.update(2L, request);

        assertThat(saved.getClientCondition()).isEqualTo("수정본");
        assertThat(saved.getMainIssues()).isEqualTo("이슈수정");
        assertThat(saved.getIsSessionCompleted()).isTrue();
        verify(consultantClientMappingRepository, never()).save(any());
    }

    private static String[] fieldNames(Class<?> type) {
        return Arrays.stream(type.getDeclaredFields()).map(Field::getName).toArray(String[]::new);
    }
}
