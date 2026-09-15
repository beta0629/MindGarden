package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.dto.InstitutionLinkContractCreateRequest;
import com.coresolution.consultation.dto.InstitutionLinkContractResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import com.coresolution.consultation.service.InstitutionLinkContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 타기관 연계 등록 구현. {@code consultant_client_mappings} 를 사용하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionLinkContractServiceImpl implements InstitutionLinkContractService {

    private final InstitutionLinkContractRepository institutionLinkContractRepository;
    private final PartnerInstitutionRepository partnerInstitutionRepository;
    private final ClientRepository clientRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InstitutionLinkContractResponse> list(String tenantId) {
        requireTenantId(tenantId);
        List<InstitutionLinkContract> contracts =
                institutionLinkContractRepository.findByTenantIdAndIsDeletedFalseOrderByIdDesc(tenantId);
        Map<Long, PartnerInstitution> institutions = loadInstitutions(tenantId, contracts);
        Map<Long, String> clientNames = loadClientNames(tenantId, contracts);
        return contracts.stream()
                .map(contract -> InstitutionLinkContractResponse.fromEntity(
                        contract,
                        institutions.get(contract.getInstitutionId()),
                        clientNames.get(contract.getClientId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InstitutionLinkContractResponse create(String tenantId, InstitutionLinkContractCreateRequest request) {
        requireTenantId(tenantId);
        if (request == null) {
            throw new ValidationException("타기관 연계 요청은 필수입니다.");
        }
        if (request.getClientId() == null) {
            throw new ValidationException("clientId", null, "내담자는 필수입니다.");
        }
        if (request.getInstitutionId() == null) {
            throw new ValidationException("institutionId", null, "연계 기관은 필수입니다.");
        }
        if (request.getMonthlyAmount() == null) {
            throw new ValidationException("monthlyAmount", null, "월결제 금액은 필수입니다.");
        }
        if (request.getPrepaidAmount() == null) {
            throw new ValidationException("prepaidAmount", null, "초기 선납 금액은 필수입니다.");
        }

        Client client = clientRepository
                .findByTenantIdAndIdIncludingDeleted(tenantId, request.getClientId())
                .filter(found -> !Boolean.TRUE.equals(found.getIsDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Client", request.getClientId()));
        PartnerInstitution institution = partnerInstitutionRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, request.getInstitutionId())
                .orElseThrow(() -> new EntityNotFoundException("PartnerInstitution", request.getInstitutionId()));

        LocalDate periodStart = request.getPeriodStart() != null
                ? request.getPeriodStart()
                : LocalDate.now().withDayOfMonth(1);

        InstitutionLinkContract entity = InstitutionLinkContract.builder()
                .clientId(client.getId())
                .institutionId(institution.getId())
                .consultantId(request.getConsultantId())
                .periodStart(periodStart)
                .periodEnd(request.getPeriodEnd())
                .prepaidAmount(request.getPrepaidAmount())
                .monthlyAmount(request.getMonthlyAmount())
                .status(InstitutionLinkConstants.STATUS_ACTIVE)
                .notes(trimToNull(request.getNotes()))
                .build();
        entity.setTenantId(tenantId);
        entity.setIsDeleted(false);

        InstitutionLinkContract saved = institutionLinkContractRepository.save(entity);
        log.info("타기관 연계 등록: tenantId={}, contractId={}, clientId={}, institutionId={}",
                tenantId, saved.getId(), saved.getClientId(), saved.getInstitutionId());
        return InstitutionLinkContractResponse.fromEntity(saved, institution, client.getName());
    }

    private Map<Long, PartnerInstitution> loadInstitutions(String tenantId, List<InstitutionLinkContract> contracts) {
        Map<Long, PartnerInstitution> result = new HashMap<>();
        for (InstitutionLinkContract contract : contracts) {
            Long institutionId = contract.getInstitutionId();
            if (institutionId == null || result.containsKey(institutionId)) {
                continue;
            }
            partnerInstitutionRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, institutionId)
                    .ifPresent(institution -> result.put(institutionId, institution));
        }
        return result;
    }

    private Map<Long, String> loadClientNames(String tenantId, List<InstitutionLinkContract> contracts) {
        Map<Long, String> result = new HashMap<>();
        for (InstitutionLinkContract contract : contracts) {
            Long clientId = contract.getClientId();
            if (clientId == null || result.containsKey(clientId)) {
                continue;
            }
            clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, clientId)
                    .ifPresent(client -> result.put(clientId, client.getName()));
        }
        return result;
    }

    private static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
