package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.InstitutionLinkContractCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkContractResponse;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.InstitutionLinkContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 타기관 연계 계약 저장. {@code consultant_client_mappings} 를 사용하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLinkContractServiceImpl implements InstitutionLinkContractService {

    private final InstitutionLinkContractRepository institutionLinkContractRepository;

    @Override
    @Transactional
    public InstitutionLinkContractResponse create(String tenantId, InstitutionLinkContractCreateRequest request) {
        requireTenantId(tenantId);
        if (request == null) {
            throw new ValidationException("타기관 계약 요청은 필수입니다.");
        }
        if (request.getConsultantId() == null) {
            throw new ValidationException("consultantId", null, "상담사 ID는 필수입니다.");
        }
        if (request.getClientId() == null) {
            throw new ValidationException("clientId", null, "내담자 ID는 필수입니다.");
        }
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("status", request.getStatus(), "계약 상태는 필수입니다.");
        }

        InstitutionLinkContract entity = InstitutionLinkContract.builder()
                .consultantId(request.getConsultantId())
                .clientId(request.getClientId())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .prepaidAmount(request.getPrepaidAmount())
                .prepaidAt(request.getPrepaidAt())
                .monthlyAmount(request.getMonthlyAmount())
                .status(request.getStatus().trim())
                .institutionName(request.getInstitutionName())
                .notes(request.getNotes())
                .build();
        entity.setTenantId(tenantId);
        entity.setIsDeleted(false);

        InstitutionLinkContract saved = institutionLinkContractRepository.save(entity);
        log.info("타기관 계약 저장: tenantId={}, contractId={}, clientId={}",
                tenantId, saved.getId(), saved.getClientId());
        return InstitutionLinkContractResponse.fromEntity(saved);
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }
}
