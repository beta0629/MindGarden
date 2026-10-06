package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.PartnerInstitutionCreateRequest;
import com.coresolution.consultation.dto.PartnerInstitutionResponse;
import com.coresolution.consultation.dto.PartnerInstitutionUpdateRequest;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import com.coresolution.consultation.service.PartnerInstitutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 연계 기관 마스터 구현.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerInstitutionServiceImpl implements PartnerInstitutionService {

    private final PartnerInstitutionRepository partnerInstitutionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PartnerInstitutionResponse> list(String tenantId) {
        requireTenantId(tenantId);
        return partnerInstitutionRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId)
                .stream()
                .map(PartnerInstitutionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PartnerInstitutionResponse create(String tenantId, PartnerInstitutionCreateRequest request) {
        requireTenantId(tenantId);
        validateRequest(request == null ? null : request.getName(),
                request == null ? null : request.getContactName(),
                request == null ? null : request.getDocumentEmail());

        PartnerInstitution entity = PartnerInstitution.builder()
                .name(request.getName().trim())
                .contactName(request.getContactName().trim())
                .contactPhone(trimToNull(request.getContactPhone()))
                .documentEmail(request.getDocumentEmail().trim())
                .notes(trimToNull(request.getNotes()))
                .build();
        entity.setTenantId(tenantId);
        entity.setIsDeleted(false);

        PartnerInstitution saved = partnerInstitutionRepository.save(entity);
        log.info("연계 기관 저장: tenantId={}, institutionId={}", tenantId, saved.getId());
        return PartnerInstitutionResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public PartnerInstitutionResponse update(String tenantId, Long id, PartnerInstitutionUpdateRequest request) {
        requireTenantId(tenantId);
        if (id == null) {
            throw new ValidationException("id", null, "기관 ID는 필수입니다.");
        }
        validateRequest(request == null ? null : request.getName(),
                request == null ? null : request.getContactName(),
                request == null ? null : request.getDocumentEmail());

        PartnerInstitution entity = partnerInstitutionRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, id)
                .orElseThrow(() -> new EntityNotFoundException("PartnerInstitution", id));
        entity.setName(request.getName().trim());
        entity.setContactName(request.getContactName().trim());
        entity.setContactPhone(trimToNull(request.getContactPhone()));
        entity.setDocumentEmail(request.getDocumentEmail().trim());
        entity.setNotes(trimToNull(request.getNotes()));
        PartnerInstitution saved = partnerInstitutionRepository.save(entity);
        log.info("연계 기관 수정: tenantId={}, institutionId={}", tenantId, saved.getId());
        return PartnerInstitutionResponse.fromEntity(saved);
    }

    private static void validateRequest(String name, String contactName, String documentEmail) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("name", name, "기관명은 필수입니다.");
        }
        if (contactName == null || contactName.isBlank()) {
            throw new ValidationException("contactName", contactName, "담당자는 필수입니다.");
        }
        if (documentEmail == null || documentEmail.isBlank()) {
            throw new ValidationException("documentEmail", documentEmail, "월말 문서 수신 이메일은 필수입니다.");
        }
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
