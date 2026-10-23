package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 타기관 상담일지 저장. {@link com.coresolution.consultation.service.ConsultationRecordService} 를 호출하지 않는다.
 *
 * <p>회기 매핑 remainingSessions 를 검증·차감하지 않는다. sessionSequence 가 null 이어도 저장한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLinkConsultationLogServiceImpl implements InstitutionLinkConsultationLogService {

    private static final DateTimeFormatter BILLING_YEAR_MONTH_FORMATTER =
            DateTimeFormatter.ofPattern(InstitutionLinkConstants.BILLING_YEAR_MONTH_PATTERN);

    private final InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;
    private final InstitutionLinkContractRepository institutionLinkContractRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public InstitutionLinkConsultationLogResponse create(String tenantId,
            InstitutionLinkConsultationLogCreateRequest request) {
        requireTenantId(tenantId);
        if (request == null) {
            throw new ValidationException("타기관 상담일지 요청은 필수입니다.");
        }
        if (request.getClientId() == null) {
            throw new ValidationException("clientId", null, "내담자 ID는 필수입니다.");
        }
        if (request.getConsultantId() == null) {
            throw new ValidationException("consultantId", null, "상담사 ID는 필수입니다.");
        }
        if (request.getSessionDate() == null) {
            throw new ValidationException("sessionDate", null, "세션 일자는 필수입니다.");
        }
        if (request.getMappingId() == null && request.getContractId() == null) {
            throw new ValidationException("mappingId", null, "타기관 매핑 ID 또는 계약 ID는 필수입니다.");
        }

        final Long mappingId = request.getMappingId();
        final Long requestedContractId = request.getContractId();
        if (mappingId != null) {
            ConsultantClientMapping mapping = consultantClientMappingRepository
                    .findByTenantIdAndId(tenantId, mappingId)
                    .orElseThrow(() -> new EntityNotFoundException("ConsultantClientMapping", mappingId));
            if (!PaymentTimingConstants.isInstitutionLink(mapping.getPaymentTiming())
                    && requestedContractId == null
                    && !isInstitutionLinkClient(tenantId, request.getClientId())) {
                throw new ValidationException("mappingId", mappingId, "회기권 매핑은 타기관 상담일지 경로를 사용할 수 없습니다.");
            }
        }
        Long resolvedContractId = requestedContractId;
        if (requestedContractId != null) {
            InstitutionLinkContract contract = institutionLinkContractRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(tenantId, requestedContractId)
                    .orElseThrow(() -> new EntityNotFoundException("InstitutionLinkContract", requestedContractId));
            resolvedContractId = contract.getId();
        } else {
            resolvedContractId = institutionLinkContractRepository
                    .findByTenantIdAndSourceMappingId(tenantId, mappingId)
                    .map(InstitutionLinkContract::getId)
                    .orElse(null);
        }

        String billingYearMonth = request.getSessionDate().format(BILLING_YEAR_MONTH_FORMATTER);
        int monthlyOccurrence = nextMonthlyOccurrence(tenantId, mappingId, resolvedContractId, billingYearMonth);

        InstitutionLinkConsultationLog entity = InstitutionLinkConsultationLog.builder()
                .contractId(resolvedContractId)
                .mappingId(mappingId)
                .scheduleId(request.getScheduleId())
                .clientId(request.getClientId())
                .consultantId(request.getConsultantId())
                .sessionDate(request.getSessionDate())
                .billingYearMonth(billingYearMonth)
                .monthlyOccurrence(monthlyOccurrence)
                .clientCondition(request.getClientCondition())
                .mainIssues(request.getMainIssues())
                .interventionMethods(request.getInterventionMethods())
                .clientResponse(request.getClientResponse())
                .nextSessionPlan(request.getNextSessionPlan())
                .homeworkAssigned(request.getHomeworkAssigned())
                .consultantObservations(request.getConsultantObservations())
                .consultantAssessment(request.getConsultantAssessment())
                .progressEvaluation(request.getProgressEvaluation())
                .specialConsiderations(request.getSpecialConsiderations())
                .isSessionCompleted(Boolean.TRUE.equals(request.getIsSessionCompleted()))
                .build();
        entity.setTenantId(tenantId);
        entity.setIsDeleted(false);
        if (Boolean.TRUE.equals(entity.getIsSessionCompleted())) {
            entity.setCompletedAt(LocalDateTime.now());
        }

        InstitutionLinkConsultationLog saved = institutionLinkConsultationLogRepository.save(entity);
        log.info("타기관 상담일지 저장: tenantId={}, logId={}, mappingId={}, contractId={}, remainingSessions 미사용",
                tenantId, saved.getId(), mappingId, resolvedContractId);
        return InstitutionLinkConsultationLogResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public InstitutionLinkConsultationLogResponse createFromSchedulePayload(Map<String, Object> recordData) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return create(tenantId, InstitutionLinkConsultationLogCreateRequest.fromSchedulePayload(recordData));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InstitutionLinkConsultationLogResponse> listByBillingMonth(
            Long contractId,
            Long mappingId,
            String billingYearMonth) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String normalizedMonth = requireBillingYearMonth(billingYearMonth);
        if (mappingId == null && contractId == null) {
            throw new ValidationException("mappingId", null, "타기관 매핑 ID 또는 계약 ID는 필수입니다.");
        }
        List<InstitutionLinkConsultationLog> rows;
        if (mappingId != null) {
            rows = institutionLinkConsultationLogRepository
                    .findByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalseOrderBySessionDateAscIdAsc(
                            tenantId, mappingId, normalizedMonth);
        } else {
            rows = institutionLinkConsultationLogRepository
                    .findByTenantIdAndContractIdAndBillingYearMonthAndIsDeletedFalseOrderBySessionDateAscIdAsc(
                            tenantId, contractId, normalizedMonth);
        }
        return rows.stream()
                .map(InstitutionLinkConsultationLogResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InstitutionLinkConsultationLogResponse getById(Long recordId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return InstitutionLinkConsultationLogResponse.fromEntity(requireLog(tenantId, recordId));
    }

    @Override
    @Transactional
    public InstitutionLinkConsultationLogResponse complete(Long recordId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        InstitutionLinkConsultationLog entity = requireLog(tenantId, recordId);
        entity.setIsSessionCompleted(true);
        entity.setCompletedAt(LocalDateTime.now());
        InstitutionLinkConsultationLog saved = institutionLinkConsultationLogRepository.save(entity);
        log.info("타기관 상담일지 완료: tenantId={}, logId={}, mapping 잔여회기 미차감", tenantId, saved.getId());
        return InstitutionLinkConsultationLogResponse.fromEntity(saved);
    }

    /**
     * 내담자 등록 유형이 타기관인지. 오배정(SAME_DAY 매핑) 일지 저장 시 paymentTiming 교차 허용 근거.
     *
     * @param tenantId 테넌트
     * @param clientId 내담자
     * @return 타기관이면 true
     */
    private boolean isInstitutionLinkClient(String tenantId, Long clientId) {
        if (clientId == null) {
            return false;
        }
        return clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, clientId)
                .map(Client::getEngagementType)
                .filter(ClientEngagementTypeConstants::isInstitutionLink)
                .isPresent();
    }

    private int nextMonthlyOccurrence(String tenantId, Long mappingId, Long contractId, String billingYearMonth) {
        long existing;
        if (mappingId != null) {
            existing = institutionLinkConsultationLogRepository
                    .countByTenantIdAndMappingIdAndBillingYearMonthAndIsDeletedFalse(
                            tenantId, mappingId, billingYearMonth);
        } else {
            existing = institutionLinkConsultationLogRepository
                    .countByTenantIdAndContractIdAndBillingYearMonthAndIsDeletedFalse(
                            tenantId, contractId, billingYearMonth);
        }
        return (int) existing + 1;
    }

    private InstitutionLinkConsultationLog requireLog(String tenantId, Long recordId) {
        if (recordId == null) {
            throw new ValidationException("recordId", null, "타기관 상담일지 ID는 필수입니다.");
        }
        return institutionLinkConsultationLogRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, recordId)
                .orElseThrow(() -> new EntityNotFoundException("InstitutionLinkConsultationLog", recordId));
    }

    private static String requireBillingYearMonth(String billingYearMonth) {
        if (billingYearMonth == null || billingYearMonth.isBlank()) {
            throw new ValidationException("billingYearMonth", billingYearMonth, "청구 연월은 필수입니다.");
        }
        try {
            YearMonth parsed = YearMonth.parse(billingYearMonth.trim(), BILLING_YEAR_MONTH_FORMATTER);
            return parsed.format(BILLING_YEAR_MONTH_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new ValidationException("billingYearMonth", billingYearMonth, "청구 연월은 yyyy-MM 형식이어야 합니다.");
        }
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }
}
