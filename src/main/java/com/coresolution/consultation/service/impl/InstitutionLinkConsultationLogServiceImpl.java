package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.InstitutionLinkConsultationLogCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkConsultationLogResponse;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 타기관 상담일지 저장. 회기 매핑 remainingSessions 를 조회·검증하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLinkConsultationLogServiceImpl implements InstitutionLinkConsultationLogService {

    private final InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;
    private final InstitutionLinkContractRepository institutionLinkContractRepository;

    @Override
    @Transactional
    public InstitutionLinkConsultationLogResponse create(String tenantId,
            InstitutionLinkConsultationLogCreateRequest request) {
        requireTenantId(tenantId);
        if (request == null) {
            throw new ValidationException("타기관 상담일지 요청은 필수입니다.");
        }
        if (request.getContractId() == null) {
            throw new ValidationException("contractId", null, "타기관 계약 ID는 필수입니다.");
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

        InstitutionLinkContract contract = institutionLinkContractRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, request.getContractId())
                .orElseThrow(() -> new EntityNotFoundException("InstitutionLinkContract", request.getContractId()));

        InstitutionLinkConsultationLog entity = InstitutionLinkConsultationLog.builder()
                .contractId(contract.getId())
                .scheduleId(request.getScheduleId())
                .clientId(request.getClientId())
                .consultantId(request.getConsultantId())
                .sessionDate(request.getSessionDate())
                .sessionNumber(request.getSessionNumber())
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
                .isSessionCompleted(request.getIsSessionCompleted())
                .build();
        entity.setTenantId(tenantId);
        entity.setIsDeleted(false);

        InstitutionLinkConsultationLog saved = institutionLinkConsultationLogRepository.save(entity);
        log.info("타기관 상담일지 저장: tenantId={}, logId={}, contractId={}, remainingSessions 미사용",
                tenantId, saved.getId(), contract.getId());
        return InstitutionLinkConsultationLogResponse.fromEntity(saved);
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }
}
