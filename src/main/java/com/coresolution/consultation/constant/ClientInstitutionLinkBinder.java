package com.coresolution.consultation.constant;

import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.PartnerInstitution;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;

/**
 * 타기관 내담자를 기관 마스터에만 연결한다. 기관 행을 내담자마다 만들지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class ClientInstitutionLinkBinder {

    private ClientInstitutionLinkBinder() {
    }

    /**
     * 테넌트 기관을 조회해 내담자 FK만 설정한다. 이름·담당은 목록 표시용 스냅샷이다.
     *
     * @param client 내담자
     * @param partnerInstitutionId 기관 PK
     * @param repository 기관 저장소
     * @param tenantId 테넌트 ID
     * @throws IllegalStateException tenantId 없음
     * @throws IllegalArgumentException 기관 ID 없음
     * @throws EntityNotFoundException 테넌트에 해당 기관 없음
     */
    public static void bind(
            Client client,
            Long partnerInstitutionId,
            PartnerInstitutionRepository repository,
            String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId는 필수입니다.");
        }
        if (partnerInstitutionId == null) {
            throw new IllegalArgumentException(ClientEngagementTypeConstants.MSG_INSTITUTION_REQUIRED);
        }
        PartnerInstitution institution = repository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, partnerInstitutionId)
                .orElseThrow(() -> new EntityNotFoundException("PartnerInstitution", partnerInstitutionId));
        client.setPartnerInstitutionId(institution.getId());
        client.setInstitutionName(institution.getName());
        client.setInstitutionContactName(institution.getContactName());
        client.setInstitutionContactPhone(institution.getContactPhone());
        client.setInstitutionDocumentEmail(institution.getDocumentEmail());
        client.setInstitutionDocumentPhone(null);
    }

    /**
     * 일반 회기로 되돌릴 때 기관 FK·스냅샷을 비운다.
     *
     * @param client 내담자
     */
    public static void clear(Client client) {
        client.setPartnerInstitutionId(null);
        client.setInstitutionName(null);
        client.setInstitutionContactName(null);
        client.setInstitutionContactPhone(null);
        client.setInstitutionDocumentPhone(null);
        client.setInstitutionDocumentEmail(null);
        client.setInstitutionPrepaid(null);
        client.setInstitutionPrepaidDate(null);
        client.setInstitutionPrepaidAmount(null);
    }
}
